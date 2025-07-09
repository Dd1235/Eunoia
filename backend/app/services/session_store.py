# backend/app/services/session_store.py
import json
from uuid import uuid4

from app.services.supabase_client import supabase


class SessionStore:
    """
    Supabase-backed session store for managing user chat sessions.
    """

    @classmethod
    def create(cls, user_id: str, logs: dict) -> str:
        sid = str(uuid4())

        # Remove any previous session for this user
        supabase.table("chat_sessions").delete().eq("user_id", user_id).execute()

        # Insert new session row
        supabase.table("chat_sessions").insert(
            {
                "user_id": user_id,
                "session_id": sid,
                "logs": json.dumps(logs),
                "history": json.dumps([]),
            }
        ).execute()
        return sid

    @classmethod
    def get(cls, user_id: str, sid: str) -> dict | None:
        res = (
            supabase.table("chat_sessions")
            .select("logs,history")
            .eq("user_id", user_id)
            .eq("session_id", sid)
            .single()
            .execute()
        )
        if not res or not res.data:
            return None

        import json

        row = res.data
        return {
            "logs": (
                row["logs"]
                if isinstance(row["logs"], dict)
                else json.loads(row["logs"])
            ),
            "history": (
                row["history"]
                if isinstance(row["history"], list)
                else json.loads(row["history"])
            ),
        }

    @classmethod
    def append(cls, user_id: str, sid: str, role: str, content: str) -> None:
        res = (
            supabase.table("chat_sessions")
            .select("history")
            .eq("user_id", user_id)
            .eq("session_id", sid)
            .single()
            .execute()
        )
        if not res or not res.data:
            return

        import json

        history = (
            res.data["history"]
            if isinstance(res.data["history"], list)
            else json.loads(res.data["history"])
        )
        history.append({"role": role, "content": content})

        supabase.table("chat_sessions").update({"history": json.dumps(history)}).eq(
            "user_id", user_id
        ).eq("session_id", sid).execute()

    @classmethod
    def exists(cls, user_id: str) -> str | None:
        res = (
            supabase.table("chat_sessions")
            .select("session_id")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return res.data["session_id"] if res and res.data else None
