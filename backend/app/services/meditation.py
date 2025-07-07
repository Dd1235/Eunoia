# # backend/app/services/meditation.py
import os
import time
import wave
from io import BytesIO
from pathlib import Path

from app.services.supabase_client import supabase
from fastapi import HTTPException
from google import genai
from openai import AsyncOpenAI, OpenAI
from pydub import AudioSegment

client = OpenAI()
async_client = AsyncOpenAI()
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_meditation_prompt(logs: str) -> str:
    """
    Generate a meditation prompt based on the last three mood logs of the user using Gemini API.
    """
    if not logs:
        logs = "No recent mood logs."
    prompt = (
        "You are a meditation coach. Your job is to generate a short, specific prompt to feed into a specialized meditation generator. "
        "This prompt should capture the user's current emotional state and needs, based on their recent mood logs. "
        "Do NOT generate a meditation script, only a prompt for the generator.\n"
        "Mood logs are in the format: score/5, note.\n"
        "For example:\n"
        "- Mood logs: 2/5, 'I'm overwhelmed and anxious.'\n"
        "  Prompt: 'A meditation for calming anxiety and feeling overwhelmed.'\n"
        "- Mood logs: 4/5, 'Feeling focused and positive.'\n"
        "  Prompt: 'A meditation to maintain focus and positivity.'\n"
        "- Mood logs: 3/5, 'Worried about an upcoming exam.'\n"
        "  Prompt: 'A meditation to ease worry and boost confidence before an exam.'\n"
        "Now, given these recent mood logs, generate a single, short prompt for the meditation generator.\n"
        f"Recent mood logs: {logs}\nPrompt:"
    )
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
        )
        if not response or not hasattr(response, "text") or not response.text:
            return "Gemini returned no prompt."
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return "Create a meditation for relaxation."


def generate_transcript(topic: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a meditation guide. <100 words."},
            {
                "role": "user",
                "content": f"Create a 1-minute calming meditation for: {topic}",
            },
        ],
    )
    content = resp.choices[0].message.content
    return content.strip() if content else ""


async def tts_to_wav(text: str) -> BytesIO:
    resp = await async_client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="nova",
        input=text,
        response_format="pcm",
    )
    pcm = await resp.aread()
    wav = BytesIO()
    with wave.open(wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24_000)
        wf.writeframes(pcm)
    wav.seek(0)
    return wav


def mix_with_bg(voice_wav: BytesIO, bg_path: Path) -> BytesIO:
    speech = AudioSegment.from_file(voice_wav, format="wav")
    bg = AudioSegment.from_file(bg_path) - 15
    if len(bg) < len(speech):
        bg *= len(speech) // len(bg) + 1
    final = speech.overlay(bg[: len(speech)])

    out = BytesIO()
    final.export(out, format="mp3")
    out.seek(0)
    return out


async def store_meditation(user_id: str, transcript: str, audio: BytesIO) -> str:
    import time

    fname = f"{user_id}_{int(time.time())}.mp3"
    bucket = "meditations"

    # Check and log file size
    audio_bytes = audio.getvalue()
    size_bytes = len(audio_bytes)
    size_mb = size_bytes / (1024 * 1024)
    print(
        f"DEBUG: [store_meditation] Audio size: {size_bytes} bytes ({size_mb:.2f} MB)"
    )

    # Enforce max file size limit
    if size_bytes > 10 * 1024 * 1024:
        raise ValueError("Audio file exceeds 10MB limit. Cannot store in Supabase.")

    try:
        # print(f"DEBUG: [store_meditation] Uploading {fname} to bucket {bucket}")
        res = supabase.storage.from_(bucket).upload(
            fname,
            audio_bytes,
            file_options={"content-type": "audio/mpeg"},  # Must match MP3 format
        )

        public_url = supabase.storage.from_(bucket).get_public_url(fname)

        row = {
            "user_id": user_id,
            "transcript": transcript,
            "audio_url": public_url,
        }
        # print(f"DEBUG: [store_meditation] Inserting row: {row}")
        supabase.table("meditations").insert(row).execute()
        # print("DEBUG: [store_meditation] Row inserted successfully")

        return public_url
    except Exception as e:
        print(f"DEBUG: [store_meditation] Exception: {e}")
        raise


if __name__ == "__main__":

    # set up a supabase client for testing
    from supabase import create_client

    supabase = create_client(
        "",
        "",
    )

    # testing store meditation ussing the file ocean.mp3
    res = supabase.storage.from_("meditations").upload(
        "test_ocean.mp3",
        open(
            "/Users/dedeepyaavancha/Desktop/Study/Eunoia/backend/static/audios/rain.mp3",
            "rb",
        ),
        file_options={"content-type": "audio/mpeg"},
    )
    print(f"Upload response: {res}")
    if not getattr(res, "data", None):
        print(f"Upload failed, res: {res}")
    else:
        public_url = supabase.storage.from_("meditations").get_public_url(
            "test_rain.mp3"
        )
        print(f"Public URL: {public_url}")
        if not public_url:
            print("Failed to get public URL")
        else:
            print(f"Successfully uploaded and got public URL: {public_url}")
