# backend/app/ai/gemini_agent.py

import os

import google.generativeai as genai
from app.ai.base import format_logs_input

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def chat_with_gemini(study_logs, sleep_logs, mood_logs, user_message) -> str:
    prompt = format_logs_input(study_logs, sleep_logs, mood_logs, user_message)
    response = model.generate_content(prompt)
    return response.text.strip()
