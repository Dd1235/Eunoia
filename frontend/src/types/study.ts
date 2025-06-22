export interface StudySession {
  id: string;
  user_id: string;
  started_at: string;         // ISO
  ended_at: string | null;
  total_break_secs: number;
  productivity: number | null;
  note: string | null;
}
