# backend/app/schemas/logs.py

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class StudyLog(BaseModel):
    started_at: datetime
    ended_at: Optional[datetime]
    total_break_secs: int
    productivity: Optional[int]
    note: Optional[str]


class SleepLog(BaseModel):
    date: date
    score: int
    note: Optional[str]


class MoodLog(BaseModel):
    at: datetime
    score: int
    note: Optional[str]
