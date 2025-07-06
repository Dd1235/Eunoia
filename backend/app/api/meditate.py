from pathlib import Path
from uuid import uuid4

from app.services.meditation import generate_transcript, mix_with_bg, tts_to_wav
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/meditate", tags=["meditation"])

OUTPUT_DIR = Path("generated_audios")
OUTPUT_DIR.mkdir(exist_ok=True)
BG_PATH = Path(__file__).parent.parent / "background.mp3"


@router.post("/")
async def create(prompt: str = Form(...)):
    transcript = generate_transcript(prompt)
    wav = await tts_to_wav(transcript)
    mp3 = mix_with_bg(wav, BG_PATH)

    fname = f"{uuid4().hex}.mp3"
    with open(OUTPUT_DIR / fname, "wb") as f:
        f.write(mp3.read())

    return {"transcript": transcript, "audioUrl": f"/meditate/download/{fname}"}


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
