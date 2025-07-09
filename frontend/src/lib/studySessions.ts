import { supabase } from './supabaseClient';
import type { StudySession } from '../types/study';

/** Fetch the current active session (ended_at: null) for a user */
export async function getActiveSessionForUser(userId: string): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
    throw error;
  }
  if (!data) return null;
  return data as StudySession;
}

/** create a new row and return it */
export async function startSession(userId: string): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, started_at: new Date().toISOString(), total_break_secs: 0 })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudySession;
}

/** patch break seconds, e.g. on pause/resume */
export async function updateBreak(
  id: string,
  totalBreakSecs: number,
): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .update({ total_break_secs: totalBreakSecs })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** finalise row */
export async function endSession(
  id: string,
  payload: { productivity: number; note: string },
): Promise<void> {
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