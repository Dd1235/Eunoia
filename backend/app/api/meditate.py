# backend/app/api/meditate.py
from pathlib import Path
from uuid import uuid4

from app.api.deps import get_current_user
from app.services.meditation import (
    generate_transcript,
    mix_with_bg,
    store_meditation,
    tts_to_wav,
)
from app.services.supabase_client import supabase
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/meditate", tags=["meditation"])

OUTPUT_DIR = Path("generated_audios")
OUTPUT_DIR.mkdir(exist_ok=True)
BG_PATH = Path(__file__).parent.parent / "background.mp3"

AUDIO_MAP = {
    "ocean": Path("static/audios/ocean.mp3"),
    "rain": Path("static/audios/rain.mp3"),
    "flowing_focus": Path("static/audios/Flowing_Focus.mp3"),
    "mellow_focus": Path("static/audios/Mellow_Focus.mp3"),
}
DEFAULT_BG = AUDIO_MAP["flowing_focus"]


@router.post("/")
async def create(
    prompt: str = Form(...),
    background: str = Form("flowing_focus"),
    user_id: str = Form(...),
    uid: str = Depends(get_current_user),
):
    if user_id != uid:
        raise HTTPException(403, "User mismatch")
    transcript = generate_transcript(prompt)
    wav = await tts_to_wav(transcript)
    bg_path = AUDIO_MAP.get(background, DEFAULT_BG)
    mp3 = mix_with_bg(wav, bg_path)
    # Store in supabase
    audio_url = await store_meditation(user_id, transcript, mp3)
    return {"transcript": transcript, "audioUrl": audio_url}


@router.get("/download/{filename}")
def download(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    return StreamingResponse(
        open(path, "rb"),
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/list")
def list_meditations(uid: str = Depends(get_current_user)):
    res = (
        supabase.table("meditations")
        .select("id, transcript, audio_url, created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .execute()
    )
    meditations = res.data if hasattr(res, "data") else []
    return {"meditations": meditations}
