// src/hooks/useLogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const useLogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['logs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 15);

      const [study, sleep, mood] = await Promise.all([
        supabase.from('study_sessions')
          .select('*')
          .gte('started_at', since.toISOString())
          .order('started_at', { ascending: false }),

        supabase.from('sleep_logs')
          .select('*')
          .gte('date', since.toISOString().slice(0, 10))
          .order('date', { ascending: false }),

        supabase.from('mood_logs')
          .select('*')
          .gte('at', since.toISOString())
          .order('at', { ascending: false }),
      ]);

      if (study.error || sleep.error || mood.error)
        throw new Error('Failed to fetch logs');

      return {
        study: study.data ?? [],
        sleep: sleep.data ?? [],
        mood: (mood.data ?? []).map((m) => ({
          ...m,
          formatted: formatDateTime(m.at),
        })),
      };
    },
  });
};

export function useDeleteLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ type, id }: { type: 'study' | 'sleep' | 'mood'; id: string }) => {
      let table = '';
      if (type === 'study') table = 'study_sessions';
      if (type === 'sleep') table = 'sleep_logs';
      if (type === 'mood') table = 'mood_logs';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
    },
  });
}
