import asyncio
import os
from io import BytesIO
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

import psycopg2
from app.tts_pipeline import generate_transcript, mix_with_background, tts_to_wav_bytes
from fastapi import FastAPI, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


OUTPUT_DIR = Path("generated_audios")
OUTPUT_DIR.mkdir(exist_ok=True)

from pathlib import Path

BASE_DIR = Path(__file__).parent  # this will be `.../app/`
BG_MUSIC_PATH = BASE_DIR / "background.mp3"

# In-memory chat session store (for demo)
chat_sessions: Dict[str, Dict] = {}


class StartSessionRequest(BaseModel):
    user_id: str


class StartSessionResponse(BaseModel):
    session_id: str


class ChatMessageRequest(BaseModel):
    session_id: str
    user_id: str
    message: str


class ChatMessageResponse(BaseModel):
    reply: str
    history: List[Dict[str, str]]
    loading: bool = False


@app.post("/generate-meditation/")
async def generate_meditation(prompt: str = Form(...)):
    print("[backend] Received prompt:", prompt)
    transcript = generate_transcript(prompt)
    print("[backend] Transcript:", transcript)

    tts_bytes = await tts_to_wav_bytes(transcript)
    final_audio = mix_with_background(tts_bytes, BG_MUSIC_PATH)

    uid = uuid4().hex
    file_path = OUTPUT_DIR / f"{uid}.mp3"
    with open(file_path, "wb") as f:
        f.write(final_audio.read())

    print(f"[backend] Saved audio to: {file_path}")

    return JSONResponse({"transcript": transcript, "audioUrl": f"/download/{uid}.mp3"})


@app.get("/download/{filename}")
async def download_audio(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        return JSONResponse({"error": "File not found"}, status_code=404)

    return StreamingResponse(
        open(file_path, "rb"),
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/chat/session", response_model=StartSessionResponse)
async def start_chat_session(req: StartSessionRequest):
    import uuid

    session_id = str(uuid.uuid4())
    chat_sessions[session_id] = {"user_id": req.user_id, "history": [], "first": True}
    return {"session_id": session_id}


@app.post("/chat/message", response_model=ChatMessageResponse)
async def chat_message(req: ChatMessageRequest):
    session = chat_sessions.get(req.session_id)
    if not session or session["user_id"] != req.user_id:
        return JSONResponse({"error": "Invalid session or user"}, status_code=400)
    session["history"].append({"role": "user", "content": req.message})
    # Simulate agent processing logs on first message
    if session["first"]:
        session["first"] = False
        await asyncio.sleep(2)  # Simulate delay for context processing
        agent_reply = "I'm going through your logs and context. Please wait..."
        session["history"].append({"role": "agent", "content": agent_reply})
        return {"reply": agent_reply, "history": session["history"], "loading": True}
    # Normal reply
    agent_reply = f"(Agent) You said: {req.message}"
    session["history"].append({"role": "agent", "content": agent_reply})
    return {"reply": agent_reply, "history": session["history"], "loading": False}


# --- DB Info Route for Logging/Docs ---
@app.get("/dbinfo")
async def db_info():
    # Use environment variables for DB connection
    conn = psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "postgres"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )
    cur = conn.cursor()
    cur.execute(
        """
        SELECT table_schema, table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema IN ('public', 'auth')
        ORDER BY table_schema, table_name, ordinal_position;
    """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Organize by table
    dbinfo = {}
    for schema, table, col, dtype in rows:
        key = f"{schema}.{table}"
        dbinfo.setdefault(key, []).append({"column": col, "type": dtype})
    return dbinfo
