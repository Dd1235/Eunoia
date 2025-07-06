# backend/app/memory_store.py

from typing import Dict, List

chat_sessions: Dict[str, Dict[str, any]] = {}  # user_id -> session_id -> data


# create a new session, session has the associated logs, this could be turned into a rag thing instead for incorporating larger context
def create_session(user_id: str, session_id: str, logs: Dict):
    if user_id not in chat_sessions:
        chat_sessions[user_id] = {}
    chat_sessions[user_id][session_id] = {
        "logs": logs,
        "history": [],
        "first": True,
    }


def get_session(user_id: str, session_id: str):
    return chat_sessions.get(user_id, {}).get(session_id)
