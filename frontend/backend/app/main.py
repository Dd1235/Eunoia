from io import BytesIO
from pathlib import Path
from uuid import uuid4

from app.tts_pipeline import generate_transcript, mix_with_background, tts_to_wav_bytes
from dotenv import load_dotenv
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv()
app = FastAPI()

# Folder to store generated MP3s
OUTPUT_DIR = Path("generated_audios")
OUTPUT_DIR.mkdir(exist_ok=True)


@app.post("/generate-meditation/")
async def generate_meditation(prompt: str = Form(...)):
    transcript = generate_transcript(prompt)
    tts_bytes = await tts_to_wav_bytes(transcript)
    final_audio = mix_with_background(tts_bytes)

    uid = uuid4().hex
    file_path = OUTPUT_DIR / f"{uid}.mp3"
    with open(file_path, "wb") as f:
        f.write(final_audio.read())

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
