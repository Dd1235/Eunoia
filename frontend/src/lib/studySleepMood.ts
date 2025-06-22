import { supabase } from './supabaseClient';
import type { StudySession } from '../types/study';

/* ─────────────  STUDY  ──────────── */

// lib/studySleepMood.ts  (startSession)
export async function startSession() {
  const { error, data } = await supabase
    .from('study_sessions')
    .insert({
      started_at: new Date().toISOString(),
      total_break_secs: 0,
    })
    .select()
    .single();// no user_id column — DB fills it

  if (error) throw error;
  return data as StudySession;
}


export async function updateBreak(id: string, secs: number) {
  const { error } = await supabase
    .from('study_sessions')
    .update({ total_break_secs: secs })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function endSession(
  id: string,
  payload: { productivity: number; note: string },
) {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: new Date().toISOString(),
      productivity: payload.productivity,
      note: payload.note,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/* ─────────────  SLEEP / MOOD  ──────────── */

export async function insertSleep(score: number, note: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // ignore guests
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from('sleep_logs').upsert(
     { user_id: user.id, date: today, score, note },
     { onConflict: 'user_id,date' },      // 1 row / user / day
   );
}

export async function insertMood(score: number, note: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('mood_logs').insert({
    user_id: user.id,
    at: new Date().toISOString(),
    score,
    note,
  });
}

export async function fetchAllLogs() {
  const { data: study } = await supabase
    .from('study_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  const { data: sleep } = await supabase
    .from('sleep_logs')
    .select('*')
    .order('date', { ascending: false });

  const { data: mood } = await supabase
    .from('mood_logs')
    .select('*')
    .order('at', { ascending: false });

  return { study: study ?? [], sleep: sleep ?? [], mood: mood ?? [] };
}
