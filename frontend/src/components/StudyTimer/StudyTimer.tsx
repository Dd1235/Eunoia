import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { Clock } from './Clock';
import { FinishModal } from './FinishModal';
import { startSession, updateBreak, endSession } from '../../lib/studySessions';
import { load, save } from 'lib/persist';
const clearTimer = () => localStorage.removeItem('focus.timer');

// function formatHms(total: number) {
//   const h = Math.floor(total / 3600);
//   const m = Math.floor((total % 3600) / 60);
//   const s = total % 60;
//   return `${h}h ${m}m ${s}s`;
// }

type Running = {
  status: 'running';
  id: string;
  start: number;
  breakAcc: number; // seconds already accounted for
  breakStart: null; // not in a break
};

type Paused = {
  status: 'paused';
  id: string;
  start: number;
  breakAcc: number;
  breakStart: number; // ms of current pause
};

type Idle = { status: 'idle' };

type State = Idle | Running | Paused;

type Action =
  | { type: 'START'; id: string; start: number }
  | { type: 'PAUSE'; breakStart: number }
  | { type: 'RESUME'; breakSeconds: number }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        status: 'running',
        id: action.id,
        start: action.start,
        breakAcc: 0,
        breakStart: null,
      } as Running;
    case 'PAUSE':
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused', breakStart: action.breakStart } as Paused;
    case 'RESUME':
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'running',
        breakAcc: state.breakAcc + action.breakSeconds,
        breakStart: null,
      } as Running;
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

function secondsSince(ms: number) {
  return Math.floor((Date.now() - ms) / 1000);
}

export const StudyTimer = () => {
  // const [state, dispatch] = useReducer(reducer, { status: 'idle' });

  const [state, dispatch] = useReducer(reducer, load<State>('focus.timer', { status: 'idle' } as State));
  const [elapsed, setElapsed] = useState(0); // secs
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [showFinish, setShowFinish] = useState(false);

  // ── tick timers ─────────────────────────────────────────

  // useEffect(() => {
  //   if (state.status === 'running') {
  //     const i = setInterval(() => {
  //       setElapsed(secondsSince(state.start) - state.breakAcc);
  //       if (state.status === 'idle') clearTimer();
  //       else save('focus.timer', state);
  //     }, 1000);
  //     return () => clearInterval(i);
  //   }
  //   return undefined;
  // }, [state]);

  // useEffect(() => {
  //   let id: number;
  //   if (state.status === 'paused') {
  //     id = window.setInterval(() => setBreakElapsed(secondsSince(state.breakStart)), 1000);
  //   } else {
  //     setBreakElapsed(0);
  //   }
  //   return () => clearInterval(id);
  // }, [state]);

  /* ── 1. tick elapsed time while running ───────────────────────── */
  useEffect(() => {
    if (state.status !== 'running') return; // early exit

    const tick = () => setElapsed(secondsSince(state.start) - state.breakAcc);

    tick(); // fire once immediately
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.status, state.start, state.breakAcc]);

  /* ── 2. tick break timer while paused ─────────────────────────── */
  useEffect(() => {
    if (state.status !== 'paused') {
      setBreakElapsed(0);
      return;
    }
    const id = window.setInterval(() => setBreakElapsed(secondsSince(state.breakStart)), 1000);
    return () => clearInterval(id);
  }, [state.status, state.breakStart]);

  /* ── 3. persist or clear reducer state every time it changes ──── */
  useEffect(() => {
    if (state.status === 'idle') clearTimer();
    else save('focus.timer', state);
  }, [state]);

  // ── actions ────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    try {
      const s = await startSession();
      dispatch({ type: 'START', id: s.id, start: Date.now() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('startSession failed', e);
      dispatch({ type: 'START', id: crypto.randomUUID(), start: Date.now() });
    }
  }, []);

  const handlePause = useCallback(async () => {
    if (state.status !== 'running') return;
    dispatch({ type: 'PAUSE', breakStart: Date.now() });
  }, [state]);

  const handleResume = useCallback(async () => {
    if (state.status !== 'paused') return;
    const breakSecs = secondsSince(state.breakStart);
    await updateBreak(state.id, state.breakAcc + breakSecs);
    dispatch({ type: 'RESUME', breakSeconds: breakSecs });
  }, [state]);

  const handleFinish = () => {
    dispatch({ type: 'PAUSE', breakStart: Date.now() });
    setShowFinish(true);
  };

  const saveFinish = useCallback(
    async (prod: number, note: string) => {
      if (state.status === 'running' || state.status === 'paused') {
        const finalBreak = state.status === 'paused' ? state.breakAcc + secondsSince(state.breakStart) : state.breakAcc;
        await endSession(state.id, { productivity: prod, note });
        await updateBreak(state.id, finalBreak);
        // if the user is currently on /logs, refresh list
        if (window.location.pathname === '/logs') {
          // quick+  dirty event
          window.dispatchEvent(new Event('refresh-logs'));
        }
      }
      dispatch({ type: 'RESET' });
      setElapsed(0);
      setBreakElapsed(0);
      setShowFinish(false);
    },
    [state],
  );

  // ── helpers ────────────────────────────────────────────
  const startedAtStr = state.status !== 'idle' ? new Date(state.start).toLocaleString() : null;

  // ── UI ─────────────────────────────────────────────────
  return (
    <div className='flex h-full flex-col items-center justify-center space-y-6'>
      <Clock secs={elapsed} />

      {startedAtStr && <p className='text-xs text-gray-500 dark:text-gray-400'>Started at {startedAtStr}</p>}

      {state.status === 'paused' && (
        <p className='text-sm text-yellow-600 dark:text-yellow-400'>
          Break: {breakElapsed.toString().padStart(2, '0')} s
        </p>
      )}

      {/* buttons */}
      {state.status === 'idle' && (
        <button
          onClick={handleStart}
          className='flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700'
        >
          <PlayIcon className='h-5 w-5' /> Start
        </button>
      )}

      {state.status === 'running' && (
        <div className='flex gap-4'>
          <button
            onClick={handlePause}
            className='flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-700'
          >
            <PauseIcon className='h-5 w-5' /> Pause
          </button>
          <button
            onClick={handleFinish}
            className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700'
          >
            <StopIcon className='h-5 w-5' /> End
          </button>
        </div>
      )}

      {state.status === 'paused' && (
        <div className='flex gap-4'>
          <button
            onClick={handleResume}
            className='flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'
          >
            <PlayIcon className='h-5 w-5' /> Resume
          </button>
          <button
            onClick={handleFinish}
            className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700'
          >
            <StopIcon className='h-5 w-5' /> End
          </button>
        </div>
      )}

      {showFinish && <FinishModal elapsedSecs={elapsed} onClose={() => setShowFinish(false)} onSubmit={saveFinish} />}
    </div>
  );
};
