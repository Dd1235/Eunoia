import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend origin here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Prompt(BaseModel):
    prompt: str

class Transcript(BaseModel):
    transcript: str

@app.post("/api/generate-transcript")
def generate_transcript(prompt: Prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a meditation guide. Generate a 2-minute meditation script based on the user's prompt.",
                },
                {"role": "user", "content": prompt.prompt},
            ],
        )
        return {"transcript": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-audio")
def generate_audio(transcript: Transcript):
    try:
        # response = client.audio.speech.create(
        #     model="tts-1",
        #     voice="shimmer",
        #     input=transcript.transcript,
        # )
        # In a real application, you would save the audio file and return a URL.
        # For now, we'll just return a placeholder.
        return {"audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

