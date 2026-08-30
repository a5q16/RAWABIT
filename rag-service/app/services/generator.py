"""
RAG Generator — retrieval + generation pipeline.

retrieve_context(query, threshold) → list[dict] via Supabase RPC match_chunks.
stream_rag_response(query, lang)    → async generator yielding SSE events.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

import httpx
from supabase import acreate_client

from app.core.config import get_settings
from app.services.embedder import embedder

logger = logging.getLogger("rawabit.generator")

# ── Smart fallback messages (engaging, prompt profile suggestion) ──
_FALLBACK = {
    "ar": (
        "عذراً، لم نعثر بعد على كفاءات مسجلة وموثقة في هذا التخصص. "
        "منصة 'روابط' تعتمد على البيانات المؤكدة فقط. "
        "هل تعرف كفاءة جزائرية متميزة في هذا المجال؟ "
        "ساعدنا في إثراء المنصة واقترح إضافتها ليقوم فريق الإدارة بمراجعتها."
    ),
    "fr": (
        "Désolé, aucune compétence vérifiée n'est encore enregistrée dans ce domaine. "
        "Connaissez-vous un expert algérien dans ce secteur ? "
        "Suggérez son profil pour enrichir la plateforme."
    ),
    "en": (
        "Sorry, no verified competencies found for this domain yet. "
        "Do you know an Algerian expert in this field? "
        "Suggest their profile to help enrich the platform."
    ),
}

# ── System prompts per language ─────────────────────────────────
_SYSTEM_PROMPT = {
    "ar": (
        "قواعد صارمة — اتبعها بالضبط:\n"
        "1. لا تبدأ أبداً بعبارات تمهيدية مثل 'بناءً على السياق' أو 'من المعطيات المقدمة'. "
        "ابدأ مباشرة بالحقائق.\n"
        "2. بعد كل ادّعاء وقائعي، أرفق رقم المصدر على طوله مباشرة بدون مسافة إضافية. "
        "مثال: أحمد بن علي حاصل على شهادة الماستر [1] من جامعة USTHB [1].\n"
        "3. عالج السياق بذكاء عبر اللغات: إذا كان السياق بالفرنسية والسؤال بالعربية، "
        "ابج棵 بالعربية مع ربط المصطلحات Francophone بالمقابلة العربية. "
        "مثال: 'متخصص في الهندسة المدنية [1] (Génie Civil)'.\n"
        "4. تحليل السياق المُسترجع: إذا لم يحتوِ السياق على المسمى الوظيفي أو الشخص "
        "المطلوب بالضبط، عليك أن تُخرج فقط العبارة التالية ولن تُضيف أي شيء آخر:\n"
        "[TRIGGER_SANDBOX]\n"
        "5. لا تُ臆ِص معلومات غير موجودة في السياق.\n\n"
        "السياق:\n{context}"
    ),
    "fr": (
        "Règles strictes — suivez-les à la lettre :\n"
        "1. NE commencez JAMAIS par des phrases d'introduction comme Selon le contexte, "
        "D'après les données ou Voici la réponse. Commencez directement par les faits.\n"
        "2. Après chaque affirmation factuelle, ajoutez IMMÉDIATEMENT le numéro de la source "
        "sans espace supplémentaire. Exemple : Ahmed Benali est diplômé en Master [1] "
        "de l'USTHB [1].\n"
        "3. Pont multilingue intelligent : si le contexte est en arabe et la question en français, "
        "répondez en français en reliant les termes arabophones à leurs équivalents francophones. "
        "Exemple : 'Spécialiste en informatique [1] (Informatique)'.\n"
        "4. Analyse du contexte récupéré : si le contexte ne contient PAS la profession ou la "
        "personne exacte demandée par l'utilisateur, vous DEVEZ produire EXACTEMENT cette "
        "phrase et rien d'autre :\n"
        "[TRIGGER_SANDBOX]\n"
        "5. Ne jamais inventer d'informations absentes du contexte.\n\n"
        "Contexte:\n{context}"
    ),
    "en": (
        "Strict rules — follow them exactly:\n"
        "1. NEVER start with introductory phrases like Based on the context, "
        "According to the data, or Here is the answer. Start directly with the facts.\n"
        "2. After every factual claim, append the source number IMMEDIATELY after it "
        "with no extra space. Example: Ahmed Benali holds a Master's degree [1] "
        "from USTHB [1].\n"
        "3. Smart multilingual bridging: if the context is in Arabic/French and the question "
        "is in English, answer in English while connecting foreign terms to their English "
        "equivalents. Example: 'Specialist in Computer Science [1] (Informatique)'.\n"
        "4. Retrieved context analysis: if the context does NOT contain the exact profession "
        "or person requested by the user, you MUST output EXACTLY this phrase and nothing else:\n"
        "[TRIGGER_SANDBOX]\n"
        "5. Never fabricate information absent from the context.\n\n"
        "Context:\n{context}"
    ),
}


async def _get_client():
    """Create a fresh async Supabase client (short-lived per request)."""
    s = get_settings()
    return await acreate_client(s.supabase_url, s.supabase_service_key)


# ── Retrieval ───────────────────────────────────────────────────
async def retrieve_context(
    query: str,
    threshold: float | None = None,
    match_count: int | None = None,
) -> list[dict]:
    """
    Embed the query, call Supabase RPC match_chunks, return ranked results.
    Returns [] if nothing meets the threshold (triggers refusal path).
    """
    s = get_settings()
    threshold = threshold or s.sim_threshold
    match_count = match_count or s.match_count

    # 1. Embed query
    vec = await asyncio.to_thread(embedder.encode_query, query)

    # 2. Call match_chunks RPC
    client = await _get_client()
    res = await client.rpc(
        "match_chunks",
        {
            "query_embedding": vec,
            "match_threshold": threshold,
            "match_count": match_count,
        },
    ).execute()

    rows = res.data or []
    logger.info("retrieve_context: %d results (threshold=%.2f)", len(rows), threshold)
    return rows


# ── LLM streaming via Groq Cloud ────────────────────────────────
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "qwen/qwen3.8-27b"


async def _stream_groq(
    messages: list[dict],
    temperature: float = 0.1,
    max_tokens: int = 512,
) -> AsyncGenerator[str, None]:
    """
    Stream tokens from the Groq Cloud API (OpenAI-compatible).
    Yields raw token strings from the SSE stream.
    """
    s = get_settings()
    headers = {
        "Authorization": f"Bearer {s.groq_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": _GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as http:
        async with http.stream("POST", _GROQ_URL, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                logger.error("Groq API %s: %s", resp.status_code, body.decode(errors="replace")[:500])
                raise httpx.HTTPStatusError(
                    f"Groq API returned {resp.status_code}",
                    request=resp.request,
                    response=resp,
                )
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[6:]
                if chunk.strip() == "[DONE]":
                    break
                try:
                    obj = json.loads(chunk)
                    delta = obj["choices"][0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


# ── Full RAG stream ─────────────────────────────────────────────
_SANDBOX_TRIGGER = "[TRIGGER_SANDBOX]"


async def stream_rag_response(
    query: str,
    lang: str = "fr",
) -> AsyncGenerator[str, None]:
    """
    End-to-end RAG generator yielding SSE events:
      event: meta     → {"status": "searching"}|"generating"}|"sandbox_triggered"}
      event: token    → "word "
      event: sources  → [{"n":1, "name":"...", ...}]
      event: action   → {"type": "suggest_profile"}  (on sandbox trigger)
      event: error    → {"message":"...", "code":"..."}  (on failure)
    """
    s = get_settings()

    # ── Phase 1: Retrieval ──────────────────────────────────────
    yield _sse("meta", {"status": "searching"})

    try:
        rows = await retrieve_context(query, s.sim_threshold, s.match_count)
    except Exception as exc:
        logger.exception("retrieve_context failed")
        yield _sse("error", {"message": str(exc), "code": "retrieval_error"})
        return

    # ── Gate: no results → smart fallback ────────────────────────
    if not rows:
        fallback = _FALLBACK.get(lang, _FALLBACK["en"])
        yield _sse("meta", {"status": "generating"})
        yield _sse("token", fallback)
        yield _sse("action", {"type": "suggest_profile"})
        yield _sse("sources", [])
        return

    # ── Phase 2: Build context ──────────────────────────────────
    context_parts = []
    sources = []
    for i, row in enumerate(rows, start=1):
        text = row.get("chunk_text", "")
        context_parts.append(f"[{i}] {text}")
        sources.append({
            "n": i,
            "name": row.get("source_id", "")[:12],
            "url": "#",
            "score": round(row.get("similarity", 0) * 10),
        })

    context = "\n".join(context_parts)
    system_prompt = _SYSTEM_PROMPT.get(lang, _SYSTEM_PROMPT["en"]).format(context=context)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query},
    ]

    # ── Phase 3: Stream LLM (with sandbox trigger detection) ────
    yield _sse("meta", {"status": "generating"})

    try:
        buffer = ""
        sandbox_triggered = False

        async for token in _stream_groq(messages):
            buffer += token

            # Check if the trigger is being formed
            if _SANDBOX_TRIGGER.startswith(buffer):
                # Still forming — don't yield yet, keep buffering
                if buffer == _SANDBOX_TRIGGER:
                    # Full trigger detected!
                    sandbox_triggered = True
                    logger.warning(
                        "SANDBOX TRIGGERED: context irrelevant for query=%r",
                        query[:80],
                    )
                    break
                continue
            elif buffer and not _SANDBOX_TRIGGER.startswith(buffer):
                # Buffer doesn't match trigger — flush it and reset
                yield _sse("token", buffer)
                buffer = ""

        # Flush any remaining buffer
        if not sandbox_triggered and buffer:
            yield _sse("token", buffer)

        # If sandbox was triggered, abort and yield fallback
        if sandbox_triggered:
            yield _sse("meta", {"status": "sandbox_triggered"})
            fallback = _FALLBACK.get(lang, _FALLBACK["en"])
            yield _sse("token", fallback)
            yield _sse("action", {"type": "suggest_profile"})
            yield _sse("sources", [])
            return

    except httpx.HTTPStatusError as exc:
        logger.exception("Groq API HTTP %s", exc.response.status_code)
        yield _sse("error", {
            "message": f"LLM unavailable (HTTP {exc.response.status_code})",
            "code": "llm_http_error",
        })
        return
    except httpx.ConnectError:
        logger.exception("Groq API connection failed")
        yield _sse("error", {
            "message": "LLM service unreachable — check GROQ_API_KEY and network",
            "code": "llm_connection_error",
        })
        return
    except Exception as exc:
        logger.exception("LLM stream error")
        yield _sse("error", {"message": str(exc), "code": "llm_stream_error"})
        return

    # ── Phase 4: Sources (always last) ──────────────────────────
    yield _sse("sources", sources)


# ── SSE formatter (module-level, reused by routes_chat) ─────────
def _sse(event: str, data: str | dict | list) -> str:
    payload = json.dumps(data, ensure_ascii=False) if isinstance(data, (dict, list)) else str(data)
    return f"event: {event}\ndata: {payload}\n\n"
