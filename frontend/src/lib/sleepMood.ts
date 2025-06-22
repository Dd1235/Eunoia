import { supabase } from './supabaseClient';

const { data: { user } } = await supabase.auth.getUser();


export async function insertSleep(score: number, note: string) {
  const { error } = await supabase.from('sleep_logs').insert({
    user_id: user?.id,
    date: new Date().toISOString().slice(0, 10),
    score,
    note,
  });
  if (error) throw new Error(error.message);
}

export async function insertMood(score: number, note: string) {
  const { error } = await supabase.from('mood_logs').insert({
    user_id: user?.id,
    at: new Date().toISOString(),
    score,
    note,
  });
  if (error) throw new Error(error.message);
}

export async function fetchAllLogs() {
  const [study, sleep, mood] = await Promise.all([
    supabase.from('study_sessions').select('*').order('started_at', { ascending: false }),
    supabase.from('sleep_logs').select('*').order('date', { ascending: false }),
    supabase.from('mood_logs').select('*').order('at', { ascending: false }),
  ]);
  return { study: study.data ?? [], sleep: sleep.data ?? [], mood: mood.data ?? [] };
}
