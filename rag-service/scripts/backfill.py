"""
Rawabit RAG Microservice — Vector Backfill Script
==================================================
Vectorizes every competency profile into the `ai_chunks` table.

For each row in `person`, the script:
  1. Fetches the person's academic career (+ specialty, university),
     professional career (+ company) and reliability-scored sources.
  2. Renders one deterministic bilingual text block (the "profile card").
  3. Embeds it with the shared `embedder.encode_passages()` service
     (multilingual-e5-small → 384-d vector).
  4. Upserts into `ai_chunks`
     (source_table='person', source_id=person.id, chunk_index=0).

Idempotent by design: the unique index uq_ai_chunks_source guarantees that
re-running this script updates existing chunks instead of duplicating them.

Usage (from the rag-service/ directory):
    python scripts/backfill.py                 # full upsert
    python scripts/backfill.py --batch-size 16 # smaller embed batches
    python scripts/backfill.py --fresh         # delete 'person' chunks first
    python scripts/backfill.py --dry-run       # build & print chunks, no DB writes
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from collections import defaultdict
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import acreate_client

from app.core.config import get_settings
from app.services.embedder import embedder

settings = get_settings()

async def fetch_all(client) -> tuple[list[dict], dict[str, list], dict[str, list], dict[str, list]]:
    """Fetch persons plus every relation we render into the chunk text."""

    print("[fetch] Loading persons ...")
    persons = (await client.from_("person").select("*").execute()).data or []
    print(f"[fetch]   -> {len(persons)} persons")

    print("[fetch] Loading academic careers (+ specialty, university) ...")
    academic_rows = (
        await client.from_("academic_career")
        .select("*, specialty(name_ar, name_fr, name_en, domain), "
                "university(abbreviation, name_ar, name_fr, name_en)")
        .execute()
    ).data or []
    academic_by_person: dict[str, list] = defaultdict(list)
    for row in academic_rows:
        academic_by_person[row["person_id"]].append(row)
    print(f"[fetch]   -> {len(academic_rows)} academic records")

    print("[fetch] Loading professional careers (+ company) ...")
    professional_rows = (
        await client.from_("professional_career")
        .select("*, company(name, name_ar, sector)")
        .execute()
    ).data or []
    professional_by_person: dict[str, list] = defaultdict(list)
    for row in professional_rows:
        professional_by_person[row["person_id"]].append(row)
    print(f"[fetch]   -> {len(professional_rows)} professional records")

    sources_by_person: dict[str, list] = defaultdict(list)
    try:
        source_rows = (
            await client.from_("sources")
            .select("person_id, source_type, source_url, reliability_score")
            .execute()
        ).data or []
        for row in source_rows:
            sources_by_person[row["person_id"]].append(row)
        print(f"[fetch]   -> {len(source_rows)} source records")
    except Exception as exc:
        print(f"[fetch]   !! sources unavailable ({exc}) — continuing without them")

    return persons, academic_by_person, professional_by_person, sources_by_person

def _fmt_date(value, end_value) -> str:
    def head(v):
        if v is None or v == "":
            return ""
        return str(v)[:4]
    start = head(value)
    end = "present" if not end_value else head(end_value)
    return f"{start}-{end}" if start else end

def _fmt_academic(row: dict) -> str | None:
    degree = row.get("degree")
    uni = (row.get("university") or {})
    spec = (row.get("specialty") or {})
    uni_name = uni.get("name_fr") or uni.get("abbreviation") or uni.get("name_en")
    spec_name = spec.get("name_fr") or spec.get("name_en")
    parts: list[str] = []
    if degree and uni_name:
        parts.append(f"{degree} at {uni_name}")
    elif degree:
        parts.append(degree)
    elif spec_name:
        parts.append(f"Studies in {spec_name}")
    else:
        return None
    years = _fmt_date(row.get("start_year"), None)
    if isinstance(row.get("start_year"), int):
        years = f"{row['start_year']}-{row.get('end_year') or '?'}"
    parts[0] += f" ({years})" if years.strip("-? ") else ""
    thesis = (row.get("thesis_title") or "").strip()
    if thesis:
        parts.append(f"Thesis: {thesis}")
    return ". ".join(parts)

def _fmt_professional(row: dict) -> str | None:
    role = row.get("role")
    company = (row.get("company") or {})
    company_name = company.get("name") or company.get("name_ar")
    if not role and not company_name:
        return None
    period = _fmt_date(row.get("start_date"), row.get("end_date"))
    line = f"{role or 'Professional'}"
    if company_name:
        line += f" at {company_name}"
    line += f" ({period})"
    desc = (row.get("description") or "").strip()
    if desc:
        line += f": {desc}"
    return line

def build_chunk(person: dict, academic: list, professional: list, sources: list) -> tuple[str, dict]:
    """Render the profile card text + metadata bag for one person."""
    name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
    name_ar = f"{person.get('first_name_ar', '')} {person.get('last_name_ar', '')}".strip()

    lines: list[str] = []
    lines.append(f"Name / Nom : {name}" + (f" ({name_ar})" if name_ar else ""))

    specialties: list[str] = []
    academic_lines = [_l for _l in (_fmt_academic(r) for r in academic) if _l]
    for r in academic:
        spec = (r.get("specialty") or {})
        label = spec.get("name_fr") or spec.get("name_en")
        if label and label not in specialties:
            specialties.append(label)
    if specialties:
        lines.append(f"Specialty / Spécialité : {'; '.join(specialties)}")
    if academic_lines:
        lines.append("Academic / Formation :\n" + "\n".join(f"- {a}" for a in academic_lines))

    professional_lines = [_l for _l in (_fmt_professional(r) for r in professional) if _l]
    if professional_lines:
        lines.append("Professional / Expérience :\n" + "\n".join(f"- {p}" for p in professional_lines))

    companies = sorted({(r.get("company") or {}).get("name") for r in professional} - {None})
    if companies:
        lines.append(f"Sectors / Employers : {', '.join(companies)}")

    reliability_scores = [s["reliability_score"] for s in sources if s.get("reliability_score")]
    if sources:
        src_summary = "; ".join(
            f"{s.get('source_type')} ({s.get('reliability_score')}/5)" for s in sources
        )
        lines.append(f"Sources / المصادر : {src_summary}")

    metadata = {
        "wilaya_id": person.get("wilaya_id"),
        "specialties": specialties,
        "companies": companies,
        "reliability_avg": (
            round(sum(reliability_scores) / len(reliability_scores), 2)
            if reliability_scores
            else None
        ),
        "email": person.get("email"),
    }

    return "\n".join(lines), metadata

async def main() -> int:
    parser = argparse.ArgumentParser(description="Vectorize Rawabit competencies into ai_chunks.")
    parser.add_argument("--batch-size", type=int, default=32, help="Persons per embedding batch.")
    parser.add_argument("--fresh", action="store_true", help="Delete existing 'person' chunks first.")
    parser.add_argument("--dry-run", action="store_true", help="Build and print chunks without DB writes.")
    args = parser.parse_args()

    t_start = time.perf_counter()
    print("=" * 70)
    print("Rawabit backfill — vectorizing competencies into ai_chunks")
    print(f"Supabase project : {settings.supabase_url}")
    print(f"Embedding model  : {settings.embedding_model}")
    print(f"Batch size       : {args.batch_size} | fresh={args.fresh} | dry-run={args.dry_run}")
    print("=" * 70)

    print("[init] Warming embedder ...")
    await asyncio.to_thread(embedder.warm, settings.embedding_model)
    print(f"[init] Embedder ready (dim={embedder.dimension}).")

    client = await acreate_client(settings.supabase_url, settings.supabase_service_key)
    print("[init] Supabase async client connected.")

    persons, academic, professional, sources = await fetch_all(client)
    if not persons:
        print("[done] No persons found — nothing to vectorize.")
        return 0

    if args.fresh and not args.dry_run:
        print("[clean] Deleting existing 'person' chunks ...")
        await client.from_("ai_chunks").delete().eq("source_table", "person").execute()

    inserted, failed, skipped = 0, 0, 0
    batch_rows: list[dict] = []

    for index, person in enumerate(persons, start=1):
        pid = person["id"]
        chunk_text, meta = build_chunk(
            person,
            academic.get(pid, []),
            professional.get(pid, []),
            sources.get(pid, []),
        )

        if len(chunk_text.strip()) < 10:
            print(f"[skip] {pid}: chunk too short — nothing meaningful to embed.")
            skipped += 1
            continue

        batch_rows.append({
            "source_table": "person",
            "source_id": str(pid),
            "chunk_text": chunk_text,
            "chunk_index": 0,
            "embedding": None,
            "metadata": meta,
            "_text": chunk_text,
        })

        if len(batch_rows) < args.batch_size and index < len(persons):
            continue

        texts = [row.pop("_text") for row in batch_rows]
        try:
            vectors = await asyncio.to_thread(embedder.encode_passages, texts)
        except Exception as exc:
            print(f"[error] Encoding failed for batch of {len(batch_rows)}: {exc}")
            failed += len(batch_rows)
            batch_rows = []
            continue

        for row, vector in zip(batch_rows, vectors):
            row["embedding"] = vector

        if args.dry_run:
            print(f"\n[dry-run] Would upsert {len(batch_rows)} chunk(s):")
            for row in batch_rows:
                preview = row["chunk_text"].replace("\n", " | ")
                print(f"  - person {row['source_id']} :: {preview[:140]}...")
            inserted += len(batch_rows)
        else:
            try:
                await (
                    client.from_("ai_chunks")
                    .upsert(batch_rows, on_conflict="source_table,source_id,chunk_index")
                    .execute()
                )
                inserted += len(batch_rows)
                print(f"[write] Upserted {inserted}/{len(persons) - skipped} chunks ...")
            except Exception as exc:
                print(f"[error] Insert failed for batch of {len(batch_rows)}: {exc}")
                failed += len(batch_rows)

        batch_rows = []

    elapsed = time.perf_counter() - t_start
    print("=" * 70)
    print(f"[done] inserted/upserted={inserted}  skipped={skipped}  failed={failed}  "
          f"time={elapsed:.1f}s")
    print("=" * 70)
    return 1 if failed else 0

if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except KeyboardInterrupt:
        print("\n[abort] Interrupted by user.")
        sys.exit(130)
