import asyncio
import logging
import os
from io import BytesIO
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

from app.tts_pipeline import generate_transcript, mix_with_background, tts_to_wav_bytes
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Form, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from jose import JWTError, jwt
from pydantic import BaseModel

from .agent_logic import get_intro_reply
from .memory_store import create_session, get_session

app = FastAPI()
load_dotenv()

from .supabase_logs import fetch_logs

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

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


def verify_user_real(authorization: str = Header(...)) -> str:

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header."
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="Invalid token payload: 'sub' missing"
            )

        print(f"Verified user_id: {user_id}")
        return user_id

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"JWT decoding failed: {str(e)}")


def verify_user_fake(authorization: str = Header(default=None)) -> str:
    # TEMPORARY OVERRIDE FOR LOCAL TESTING (REMOVE THIS LINE LATER)
    return "2186bc0f-cc85-4d97-b066-39c625aff1f4"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header."
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="Invalid token payload: 'sub' missing"
            )

        print(f"Verified user_id: {user_id}")
        return user_id

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"JWT decoding failed: {str(e)}")


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


# Session creation
@app.post("/chat/session", response_model=StartSessionResponse)
async def start_chat_session(
    req: StartSessionRequest, user_id: str = Depends(verify_user_fake)
):
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="User mismatch")

    session_id = str(uuid4())
    logs = fetch_logs(user_id)
    create_session(user_id, session_id, logs)

    logger.info(f"Session {session_id} created for user {user_id}")
    intro = get_intro_reply(logs)
    return {"session_id": session_id, "reply": intro}


# Chat message
@app.post("/chat/message", response_model=ChatMessageResponse)
async def chat_message(
    req: ChatMessageRequest, user_id: str = Depends(verify_user_fake)
):
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="User mismatch")

    session = get_session(user_id, req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["history"].append({"role": "user", "content": req.message})
    reply = f"(Agent): Based on your logs, you asked: {req.message}"
    session["history"].append({"role": "agent", "content": reply})

    return {"reply": reply, "history": session["history"]}


@app.get("/debug/logs")
def get_user_logs(user_id: str, authorization: str = Header(None)):
    print(f"[debug] Fetching logs for: {user_id}")

    if authorization is None:
        print("[debug] No auth header provided — bypassing verification")
    else:
        print("[debug] Auth header received (not verifying in test mode)")

    try:
        logs = fetch_logs(user_id)
        print(f"[debug] Found {len(logs)} logs")
        return logs
    except Exception as e:
        print(f"[debug] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
