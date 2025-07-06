# backend/app/ai/base.py
from typing import Dict, List


def format_logs_input(
    study_logs: List[Dict],
    sleep_logs: List[Dict],
    mood_logs: List[Dict],
    user_message: str,
) -> str:
    return f"""User Message: {user_message}

Recent Logs:
Study Logs: {study_logs}
Sleep Logs: {sleep_logs}
Mood Logs: {mood_logs}
"""
