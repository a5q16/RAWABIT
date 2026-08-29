"""
Rawabit Platform — FastAPI Application for Vercel & Container Environments
"""

import os
import json
import httpx
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Rawabit Platform API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get(
    "GROQ_API_KEY", 
    "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"
)

BASE_DIR = Path(__file__).resolve().parent

# Comprehensive static lookup directories
STATIC_DIRS = [
    BASE_DIR,
    BASE_DIR / "public",
    BASE_DIR.parent / "public",
    BASE_DIR.parent,
    BASE_DIR / "rawabit_ui_v2"
]

def find_static_file(rel_path: str):
    # Strip leading slashes
    clean_path = rel_path.lstrip("/\\")
    for sdir in STATIC_DIRS:
        if not sdir.is_dir():
            continue
        p = (sdir / clean_path).resolve()
        if p.is_file():
            return p
    return None

def find_dir(dir_name: str):
    clean_dir = dir_name.lstrip("/\\")
    for sdir in STATIC_DIRS:
        if not sdir.is_dir():
            continue
        d = (sdir / clean_dir).resolve()
        if d.is_dir():
            return d
    return None

css_dir = find_dir("css")
if css_dir:
    app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")

js_dir = find_dir("js")
if js_dir:
    app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Rawabit Platform API", "version": "2.0.0"}

@app.get("/api/health")
def api_health():
    return health_check()

@app.post("/api/chat")
async def chat_stream(request: Request):
    """
    SSE chat streaming endpoint powered by Groq AI.
    """
    try:
        data = await request.json()
    except Exception:
        data = {}

    query = data.get("query", "مرحبا")
    context = data.get("context")

    system_prompt = (
        "أنت المساعد الذكي لمنصة روابط الجزائرية (Rawabit) للكفاءات والمواهب الوطنية. "
        "مهمتك مساعدة المستخدمين في استكشاف الكفاءات والخبراء والمشاريع في مختلف ولايات الجزائر. "
    )
    if context:
        system_prompt += f"\nالسياق الحالي للملف الشخصي: {json.dumps(context, ensure_ascii=False)}"
    system_prompt += "\nأجب بلغة عربية فصحى واضحة، مهنية وموجزة ومباشرة."

    async def event_generator():
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "openai/gpt-oss-120b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        payload["model"] = "qwen/qwen3.6-27b"
                        async with client.stream("POST", url, headers=headers, json=payload) as fallback_resp:
                            async for chunk in fallback_resp.aiter_lines():
                                if not chunk:
                                    continue
                                if chunk.startswith("data:"):
                                    line_data = chunk[5:].strip()
                                    if line_data == "[DONE]":
                                        yield "data: [DONE]\n\n"
                                        break
                                    try:
                                        parsed = json.loads(line_data)
                                        content = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if content:
                                            yield f"data: {json.dumps({'chunk': content})}\n\n"
                                    except Exception:
                                        pass
                    else:
                        async for chunk in response.aiter_lines():
                            if not chunk:
                                continue
                            if chunk.startswith("data:"):
                                line_data = chunk[5:].strip()
                                if line_data == "[DONE]":
                                    yield "data: [DONE]\n\n"
                                    break
                                try:
                                    parsed = json.loads(line_data)
                                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if content:
                                        yield f"data: {json.dumps({'chunk': content})}\n\n"
                                except Exception:
                                    pass
            except Exception as e:
                yield f"data: {json.dumps({'chunk': f'تعذر الاتصال بخدمة الذكاء الاصطناعي: {str(e)}'})}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.get("/")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    if full_path:
        f = find_static_file(full_path)
        if f:
            return FileResponse(f)
    idx = find_static_file("index.html")
    if idx:
        return FileResponse(idx)
    return HTMLResponse("<!DOCTYPE html><html><body><h1>Rawabit Platform</h1></body></html>")
