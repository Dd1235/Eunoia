import { supabase } from './supabaseClient';
import type { StudySession } from '../types/study';

/** create a new row and return it */
export async function startSession(): Promise<StudySession> {
    console.log('current user ⇒', supabase.auth.getUser());

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ started_at: new Date().toISOString(), total_break_secs: 0 })
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
