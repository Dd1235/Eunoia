from io import BytesIO
from pathlib import Path
from uuid import uuid4

from app.tts_pipeline import generate_transcript, mix_with_background, tts_to_wav_bytes
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

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
