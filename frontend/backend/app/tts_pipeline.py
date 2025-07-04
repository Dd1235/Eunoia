import asyncio
import subprocess
import wave
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAI
from pydub import AudioSegment

load_dotenv()

client = OpenAI()
async_client = AsyncOpenAI()


def generate_transcript(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a meditation guide. Keep output under 100 words.",
            },
            {
                "role": "user",
                "content": f"Create a 1-minute calming meditation for: {prompt}",
            },
        ],
    )
    return response.choices[0].message.content.strip()


async def tts_to_wav_bytes(text: str) -> BytesIO:
    response = await async_client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="nova",
        input=text,
        response_format="pcm",
    )

    pcm_data = await response.aread()

    wav_bytes = BytesIO()
    with wave.open(wav_bytes, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit = 2 bytes
        wf.setframerate(24000)
        wf.writeframes(pcm_data)

    wav_bytes.seek(0)
    return wav_bytes


def mix_with_background(voice_wav: BytesIO, bg_path: str) -> BytesIO:
    speech = AudioSegment.from_file(voice_wav, format="wav")
    bg = AudioSegment.from_file(bg_path)

    bg = bg - 15  # reduce background volume
    if len(bg) < len(speech):
        bg *= len(speech) // len(bg) + 1

    final = speech.overlay(bg[: len(speech)])

    output = BytesIO()
    final.export(output, format="mp3")
    output.seek(0)
    return output


async def main(prompt: str, bg_path: str, save_path: Path):
    print("Generating transcript...")
    transcript = generate_transcript(prompt)
    print("Transcript:", transcript)

    print("Generating TTS audio...")
    wav_bytes = await tts_to_wav_bytes(transcript)

    print("Mixing with background...")
    final_audio = mix_with_background(wav_bytes, bg_path)

    print(f"Saving to: {save_path}")
    with open(save_path, "wb") as f:
        f.write(final_audio.read())

    try:
        subprocess.run(["afplay", str(save_path)])
    except Exception:
        print("Saved. You can play the file manually.")


if __name__ == "__main__":
    bg_file = "background.mp3"
    desktop_path = Path.home() / "Desktop" / "Audios" / "final_meditation.mp3"
    asyncio.run(
        main(prompt="relax and breathe deeply", bg_path=bg_file, save_path=desktop_path)
    )
