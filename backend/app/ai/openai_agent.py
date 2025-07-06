# backend/app/ai/openai_agent.py

import os

from app.ai.base import format_logs_input
from openai import OpenAI

client = OpenAI()


def chat_with_openai(study_logs, sleep_logs, mood_logs, user_message) -> str:
    prompt = format_logs_input(study_logs, sleep_logs, mood_logs, user_message)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a well-being assistant that answers based on logs.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content.strip()
