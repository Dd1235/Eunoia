import { useEffect } from 'react';
import { LogCard } from './LogCard';
import { FilterBar } from './FilterBar';
import { useDeleteLog } from '../../hooks/useLogs';
import { useState } from 'react';
import { useRef } from 'react';

type LogsConfig = { study: boolean; sleep: boolean; mood: boolean };

type LogsPanelProps = {
  logs: { study: any[]; sleep: any[]; mood: any[] } | null;
  logsConfig: LogsConfig;
  setLogsConfig: (cfg: LogsConfig) => void;
};

export const LogsPanel = ({ logs, logsConfig, setLogsConfig }: LogsPanelProps) => {
  const { mutate: deleteLog, isPending: deleting, error: deleteError } = useDeleteLog();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const lastDelete = useRef<{ type: string; id: string } | null>(null);

  const handleDelete = (type: 'study' | 'sleep' | 'mood', id: string) => {
    console.log('[LogsPanel] Attempting to delete log:', { type, id });
    lastDelete.current = { type, id };
    setDeletingId(id);
    deleteLog({ type, id }, { onSettled: () => setDeletingId(null) });
  };

  const toggle = (key: keyof LogsConfig) => {
    setLogsConfig({ ...logsConfig, [key]: !logsConfig[key] });
  };

  return (
    <div className='max-h-[70vh] min-w-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-black/40'>
      <FilterBar show={logsConfig} toggle={toggle} />
      {!logs ? (
        <p>Loading…</p>
      ) : (
        <div className='space-y-4 pb-24'>
          {deleteError && (
            <div className='mb-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300'>
              Error deleting log: {deleteError.message}
              {lastDelete.current && (
                <span>
                  {' '}
                  (type: {lastDelete.current.type}, id: {lastDelete.current.id})
                </span>
              )}
            </div>
          )}
          {logsConfig.study &&
            logs.study.map((s: any) => (
              <LogCard
                key={s.id}
                type='study'
                title={`Study – ${new Date(s.started_at).toLocaleDateString()}`}
                subtitle={`Duration: ${Math.floor(((new Date(s.ended_at ?? Date.now()).getTime() - new Date(s.started_at).getTime()) / 1000 - s.total_break_secs) / 60)} min • Break ${s.total_break_secs}s`}
                note={s.note}
                onDelete={() => handleDelete('study', s.id)}
                isDeleting={deleting}
                isDeletingThis={deleting && deletingId === s.id}
              />
            ))}
          {logsConfig.sleep &&
            logs.sleep.map((sl: any) => (
              <LogCard
                key={sl.id}
                type='sleep'
                title={`Sleep – ${sl.date}`}
                subtitle={`Score: ${sl.score}/10`}
                note={sl.note}
                onDelete={() => handleDelete('sleep', sl.id)}
                isDeleting={deleting}
                isDeletingThis={deleting && deletingId === sl.id}
              />
            ))}
          {logsConfig.mood &&
            logs.mood.map((m: any) => (
              <LogCard
                key={m.id}
                type='mood'
                title={`Mood – ${m.formatted}`}
                subtitle={`Score: ${m.score}/5`}
                note={m.note}
                onDelete={() => handleDelete('mood', m.id)}
                isDeleting={deleting}
                isDeletingThis={deleting && deletingId === m.id}
              />
            ))}
        </div>
      )}
    </div>
  );
};
