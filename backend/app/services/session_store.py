from typing import Dict
from uuid import uuid4


class SessionStore:
    """
    A simple in-memory session store for managing user sessions.
    """

    _store: Dict[str, Dict[str, dict]] = {}

    @classmethod
    def create(cls, user_id: str, logs: dict) -> str:
        sid = str(uuid4())
        cls._store.setdefault(user_id, {})[sid] = {"logs": logs, "history": []}
        return sid

    @classmethod
    def get(cls, user_id: str, sid: str) -> dict | None:
        return cls._store.get(user_id, {}).get(sid)

    @classmethod
    def append(cls, user_id: str, sid: str, role: str, content: str) -> None:
        cls._store[user_id][sid]["history"].append({"role": role, "content": content})
