from datetime import datetime, timedelta
from typing import Dict

from app.core.config import settings
from supabase import Client, create_client

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def fetch_logs(user_id: str) -> Dict:
    """Return study/sleep/mood logs for the last 15 days."""
    since = (datetime.utcnow() - timedelta(days=15)).isoformat()

    study = (
        supabase.table("study_sessions")
        .select("*")
        .eq("user_id", user_id)
        .gte("started_at", since)
        .order("started_at", desc=True)
        .execute()
        .data
    )
    sleep = (
        supabase.table("sleep_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", since[:10])
        .order("date", desc=True)
        .execute()
        .data
    )
    mood = (
        supabase.table("mood_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("at", since)
        .order("at", desc=True)
        .execute()
        .data
    )

    return {"study": study or [], "sleep": sleep or [], "mood": mood or []}
