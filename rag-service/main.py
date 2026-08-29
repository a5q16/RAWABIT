"""
Rawabit Platform — FastAPI Application for Vercel
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

# Paths
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

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

# Static file serving if public directory exists
if PUBLIC_DIR.is_dir():
    if (PUBLIC_DIR / "css").is_dir():
        app.mount("/css", StaticFiles(directory=str(PUBLIC_DIR / "css")), name="css")
    if (PUBLIC_DIR / "js").is_dir():
        app.mount("/js", StaticFiles(directory=str(PUBLIC_DIR / "js")), name="js")

    @app.get("/")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str = ""):
        file_path = PUBLIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = PUBLIC_DIR / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)
        return HTMLResponse("<h1>Rawabit Platform</h1><p>Running on Vercel</p>")
