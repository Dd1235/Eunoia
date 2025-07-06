import os
from datetime import datetime, timedelta
from typing import Dict

from supabase import Client, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("Loaded SUPABASE_SERVICE_KEY:", SUPABASE_SERVICE_KEY[:6], "...")


def fetch_logs(user_id: str) -> Dict:
    # only last two weeks
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

    return {
        "study": study or [],
        "sleep": sleep or [],
        "mood": mood or [],
    }
