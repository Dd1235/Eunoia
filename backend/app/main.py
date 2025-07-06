import asyncio
import logging
import os
from io import BytesIO
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

from agent_logic import get_intro_reply
from app.tts_pipeline import generate_transcript, mix_with_background, tts_to_wav_bytes
from fastapi import Depends, FastAPI, Form, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from memory_store import create_session, get_session
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


OUTPUT_DIR = Path("generated_audios")
OUTPUT_DIR.mkdir(exist_ok=True)

from pathlib import Path

BASE_DIR = Path(__file__).parent  # this will be `.../app/`
BG_MUSIC_PATH = BASE_DIR / "background.mp3"

logger = logging.getLogger("eunoia")
logging.basicConfig(level=logging.INFO)

chat_sessions: Dict[str, Dict[str, Dict]] = {}  # user_id -> session_id -> session_data


def verify_user(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return authorization.removeprefix("Bearer ").strip()


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
async def start_chat_session(
    req: StartSessionRequest,
    user_id: str = Depends(verify_user),
):
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    session_id = str(uuid4())
    if user_id not in chat_sessions:
        chat_sessions[user_id] = {}
    chat_sessions[user_id][session_id] = {"history": [], "first": True}

    logger.info(f"[Session] Created session {session_id} for user {user_id}")
    return {"session_id": session_id}


@app.post("/chat/message", response_model=ChatMessageResponse)
async def chat_message(
    req: ChatMessageRequest,
    user_id: str = Depends(verify_user),
):
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    user_sessions = chat_sessions.get(user_id, {})
    session = user_sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=400, detail="Invalid session")

    session["history"].append({"role": "user", "content": req.message})
    logger.info(
        f"[Chat] User {user_id} sent message in session {req.session_id}: {req.message}"
    )

    if session["first"]:
        session["first"] = False
        await asyncio.sleep(2)  # Simulate agent loading
        reply = "I'm going through your logs and context. Please wait..."
        session["history"].append({"role": "agent", "content": reply})
        return {"reply": reply, "history": session["history"], "loading": True}

    reply = f"(Agent) You said: {req.message}"
    session["history"].append({"role": "agent", "content": reply})
    return {"reply": reply, "history": session["history"], "loading": False}
