// src/pages/Logs.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container } from '../components/Layout/Container';
import { fetchAllLogs } from '../lib/sleepMood';
import { LogCard } from '../components/Logs/LogCard';

import { FilterBar } from '../components/Logs/FilterBar';

const Logs = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAllLogs>> | null>(null);

  const [show, setShow] = useState({ study: true, sleep: true, mood: true });
  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  useEffect(() => {
    if (!user) return;
    const load = () => fetchAllLogs().then(setData).catch(console.error);
    load();
    window.addEventListener('refresh-logs', load);
    return () => window.removeEventListener('refresh-logs', load);
  }, [user]);

  if (loading) return null;
  if (!user)
    return (
      <Container>
        <p className='py-10 text-center'>Log in to view your logs ✨</p>
      </Container>
    );

  return (
    <Container>
      <h1 className='py-8 text-2xl font-semibold text-black dark:text-gray-100'>Your Logs</h1>
      <FilterBar show={show} toggle={toggle} />
      {!data && <p>Loading…</p>}
      {data && (
        <div className='space-y-4 pb-24'>
          {show.study &&
            data.study.map((s) => (
              <LogCard
                key={s.id}
                type='study'
                title={`Study – ${new Date(s.started_at).toLocaleDateString()}`}
                subtitle={`Duration: ${Math.floor(((new Date(s.ended_at ?? Date.now()).getTime() - new Date(s.started_at).getTime()) / 1000 - s.total_break_secs) / 60)} min • Break ${s.total_break_secs}s`}
                note={s.note}
              />
            ))}
          {show.sleep &&
            data.sleep.map((sl) => (
              <LogCard
                key={sl.id}
                type='sleep'
                title={`Sleep – ${sl.date}`}
                subtitle={`Score: ${sl.score}/10`}
                note={sl.note}
              />
            ))}
          {show.mood &&
            data.mood.map((m) => (
              <LogCard
                key={m.id}
                type='mood'
                title={`Mood – ${new Date(m.at).toLocaleTimeString()}`}
                subtitle={`Score: ${m.score}/5`}
                note={m.note}
              />
            ))}
        </div>
      )}
    </Container>
  );
};

export default Logs;
