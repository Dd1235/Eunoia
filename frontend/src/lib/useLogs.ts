// filename: frontend/src/lib/useLogs.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function useLogs() {
  const [logs, setLogs] = useState<{ study: any[]; sleep: any[]; mood: any[] } | null>(() => {
    const cached = sessionStorage.getItem('logsData');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(logs === null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 15);
      const [study, sleep, mood] = await Promise.all([
        supabase.from('study_sessions').select('*').gte('started_at', since.toISOString()).order('started_at', { ascending: false }),
        supabase.from('sleep_logs').select('*').gte('date', since.toISOString().slice(0, 10)).order('date', { ascending: false }),
        supabase.from('mood_logs').select('*').gte('at', since.toISOString()).order('at', { ascending: false }),
      ]);
      const logsData = {
        study: study.data ?? [],
        sleep: sleep.data ?? [],
        mood: (mood.data ?? []).map((m) => ({ ...m, formatted: formatDateTime(m.at) })),
      };
      setLogs(logsData);
      sessionStorage.setItem('logsData', JSON.stringify(logsData));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (logs === null) fetchLogs();
    // else, do not refetch on mount
    // eslint-disable-next-line
  }, []);

  return { logs, loading, error, refetch: fetchLogs };
} 