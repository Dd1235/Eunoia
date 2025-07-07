import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Container } from '../components/Layout/Container';
import { format, parse, addDays, subDays, startOfDay } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useLogs } from '../hooks/useLogs';

/* ------------------------------------------------------------------
 * Types + RPC helpers (re‑use existing Postgres functions)
 * ------------------------------------------------------------------*/
interface CalRow {
  dt: string;
  good: boolean;
}
const fetchCal =
  (rpc: string) =>
  async (uid: string): Promise<CalRow[]> => {
    const { data, error } = await supabase.rpc(rpc, { _uid: uid });
    if (error) throw error;
    return data ?? [];
  };
const fetchSleep = fetchCal('sleep_calendar');
const fetchStudy = fetchCal('study_calendar');
const fetchMood = fetchCal('mood_calendar');

/* ------------------------------------------------------------------
 * Re‑usable components
 * ------------------------------------------------------------------*/
const SummaryCard: FC<{ title: string; value: string; sub?: string }> = ({ title, value, sub }) => (
  <div className='rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800'>
    <p className='text-sm text-gray-500 dark:text-gray-400'>{title}</p>
    <p className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>{value}</p>
    {sub && <p className='mt-1 text-xs text-gray-400'>{sub}</p>}
  </div>
);

const WeeklyTrend: FC<{ weeks: { week: string; sleep: number; study: number; mood: number }[] }> = ({ weeks }) => (
  <ResponsiveContainer width='100%' height={220}>
    <BarChart data={weeks} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray='3 3' vertical={false} />
      <XAxis dataKey='week' dy={4} style={{ fontSize: '0.7rem' }} />
      <YAxis allowDecimals={false} width={24} style={{ fontSize: '0.7rem' }} />
      <Tooltip wrapperClassName='!text-xs' />
      <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
      <Bar dataKey='sleep' stackId='a' fill='#4f46e5' name='Sleep ✔️' />
      <Bar dataKey='study' stackId='a' fill='#22c55e' name='Study ✔️' />
      <Bar dataKey='mood' stackId='a' fill='#f59e0b' name='Mood ✔️' />
    </BarChart>
  </ResponsiveContainer>
);

/* ------------------------------------------------------------------
 * Helper analytics
 * ------------------------------------------------------------------*/
const goodDays = (rows: CalRow[]) => rows.filter((d) => d.good).length;

const streak = (rows: CalRow[]) => {
  // rows are last 30 days, latest last. Compute max streak of consecutive good days.
  const sorted = [...rows].sort((a, b) => new Date(a.dt).getTime() - new Date(b.dt).getTime());
  let max = 0,
    cur = 0;
  for (const r of sorted) {
    if (r.good) {
      cur += 1;
      max = Math.max(max, cur);
    } else {
      cur = 0;
    }
  }
  return max;
};

const bucketWeeks = (rows: CalRow[]) => {
  const out: Record<string, number> = {};
  rows.forEach(({ dt, good }) => {
    const wk = format(new Date(dt), 'yyyy-ww');
    out[wk] = (out[wk] || 0) + (good ? 1 : 0);
  });
  return out;
};

/* ------------------------------------------------------------------
 * Dashboard page
 * ------------------------------------------------------------------*/
const Dashboard: FC = () => {
  const { user } = useAuth();
  const { data: logs, isLoading: logsLoading } = useLogs();

  const sleep = useQuery({ queryKey: ['sleep', user?.id], queryFn: () => fetchSleep(user!.id), enabled: !!user });
  const study = useQuery({ queryKey: ['study', user?.id], queryFn: () => fetchStudy(user!.id), enabled: !!user });
  const mood = useQuery({ queryKey: ['mood', user?.id], queryFn: () => fetchMood(user!.id), enabled: !!user });

  if (!user)
    return (
      <Container>
        <p className='py-10 text-center'>Log in to see your dashboard 📊</p>
      </Container>
    );

  /* ---- derived analytics ---- */
  const sleepGood = goodDays(sleep.data ?? []);
  const studyGood = goodDays(study.data ?? []);
  const moodGood = goodDays(mood.data ?? []);

  const sleepStreak = streak(sleep.data ?? []);
  const studyStreak = streak(study.data ?? []);
  const moodStreak = streak(mood.data ?? []);

  // weekly buckets (align all three datasets on the same week keys)
  const weeksSet = new Set<string>([
    ...Object.keys(bucketWeeks(sleep.data ?? [])),
    ...Object.keys(bucketWeeks(study.data ?? [])),
    ...Object.keys(bucketWeeks(mood.data ?? [])),
  ]);
  let weekArr = Array.from(weeksSet).sort();
  // Only show the last 2 or 3 weeks (change 2 to 3 if you want more)
  const NUM_WEEKS = 2;
  if (weekArr.length > NUM_WEEKS) {
    weekArr = weekArr.slice(-NUM_WEEKS);
  }
  const weeklyData = weekArr.map((wk) => {
    // wk is 'yyyy-ww', get the first day of that week
    const [year, weekNum] = wk.split('-');
    // Use ISO week: week starts on Monday
    const jan4 = new Date(Number(year), 0, 4);
    const weekStart = new Date(jan4.getTime() + (Number(weekNum) - 1) * 7 * 24 * 60 * 60 * 1000);
    // Move to Monday of that week
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return {
      week: format(weekStart, 'MMM d'),
      sleep: bucketWeeks(sleep.data ?? [])[wk] || 0,
      study: bucketWeeks(study.data ?? [])[wk] || 0,
      mood: bucketWeeks(mood.data ?? [])[wk] || 0,
    };
  });

  // ---- daily analytics for last 7 days ----
  let dailyData: {
    day: string;
    study: number;
    sleep: number;
    mood: number;
    avgSleep: number | null;
    avgMood: number | null;
  }[] = [];
  if (logs && logs.study && logs.sleep && logs.mood) {
    const today = startOfDay(new Date());
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      // Study sessions started that day
      const studyCount = logs.study.filter((s) => s.started_at && s.started_at.slice(0, 10) === dayStr).length;
      // Sleep logs for that day
      const sleepLogs = logs.sleep.filter((s) => s.date === dayStr);
      const sleepCount = sleepLogs.length;
      const avgSleep = sleepCount ? sleepLogs.reduce((sum, s) => sum + (s.score || 0), 0) / sleepCount : null;
      // Mood logs for that day
      const moodLogs = logs.mood.filter((m) => m.at && m.at.slice(0, 10) === dayStr);
      const moodCount = moodLogs.length;
      const avgMood = moodCount ? moodLogs.reduce((sum, m) => sum + (m.score || 0), 0) / moodCount : null;
      dailyData.push({
        day: format(day, 'MMM d'),
        study: studyCount,
        sleep: sleepCount,
        mood: moodCount,
        avgSleep,
        avgMood,
      });
    }
  }

  const DailyTrend: FC<{ days: typeof dailyData }> = ({ days }) => (
    <ResponsiveContainer width='100%' height={220}>
      <BarChart data={days} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' vertical={false} />
        <XAxis dataKey='day' dy={4} style={{ fontSize: '0.7rem' }} />
        <YAxis allowDecimals width={32} style={{ fontSize: '0.7rem' }} />
        <Tooltip wrapperClassName='!text-xs' />
        <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
        <Bar dataKey='study' fill='#22c55e' name='Study Sessions' />
        <Bar dataKey='sleep' fill='#4f46e5' name='Sleep Logs' />
        <Bar dataKey='mood' fill='#f59e0b' name='Mood Logs' />
      </BarChart>
    </ResponsiveContainer>
  );

  // ---- last 2 weeks analytics ----
  let twoWeekStats = null;
  if (logs && logs.study && logs.sleep && logs.mood) {
    const studyCount = logs.study.length;
    const avgSleep = logs.sleep.length
      ? (logs.sleep.reduce((sum, s) => sum + (s.score || 0), 0) / logs.sleep.length).toFixed(1)
      : 'N/A';
    const avgMood = logs.mood.length
      ? (logs.mood.reduce((sum, m) => sum + (m.score || 0), 0) / logs.mood.length).toFixed(1)
      : 'N/A';
    twoWeekStats = (
      <div className='mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <SummaryCard title='Study sessions (2 weeks)' value={String(studyCount)} />
        <SummaryCard title='Avg sleep score (2 weeks)' value={String(avgSleep)} />
        <SummaryCard title='Avg mood (2 weeks)' value={String(avgMood)} />
      </div>
    );
  }

  return (
    <Container>
      <h1 className='py-8 text-2xl font-semibold text-black dark:text-gray-100'>Dashboard</h1>

      {/* ---- quick stats ---- */}
      <div className='mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <SummaryCard title='Sleep good days' value={`${sleepGood}/30`} sub={`Best streak ${sleepStreak}`} />
        <SummaryCard title='Study goal met' value={`${studyGood}/30`} sub={`Best streak ${studyStreak}`} />
        <SummaryCard title='Mood good days' value={`${moodGood}/30`} sub={`Best streak ${moodStreak}`} />
      </div>

      {/* ---- last 2 weeks analytics ---- */}
      {logsLoading ? <p>Loading analytics…</p> : twoWeekStats}

      {/* ---- weekly trend ---- */}
      <div className='mb-20'>
        <h2 className='mb-3 text-lg font-medium text-black dark:text-gray-100'>Weekly Success Trend</h2>
        <WeeklyTrend weeks={weeklyData} />
      </div>

      {/* ---- daily analytics ---- */}
      <div className='mb-20'>
        <h2 className='mb-3 text-lg font-medium text-black dark:text-gray-100'>Daily Analytics (Last 7 Days)</h2>
        {logsLoading ? <p>Loading daily analytics…</p> : <DailyTrend days={dailyData} />}
      </div>
    </Container>
  );
};

export default Dashboard;
