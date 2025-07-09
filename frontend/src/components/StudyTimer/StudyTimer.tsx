// frontend/src/components/StudyTimer/StudyTimer.tsx

import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useReducer, useState, useRef } from 'react';
import { Clock } from './Clock';
import { FinishModal } from './FinishModal';
import { startSession, updateBreak, endSession, getActiveSessionForUser } from '../../lib/studySessions';
import { load, save } from 'lib/persist';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
const clearTimer = () => localStorage.removeItem('focus.timer');

function secondsSince(ms: number) {
  return Math.floor((Date.now() - ms) / 1000);
}

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
  pausedElapsed: number; // elapsed time at pause
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
      // Calculate elapsed at pause
      const pausedElapsed = secondsSince(state.start) - state.breakAcc;
      return { ...state, status: 'paused', breakStart: action.breakStart, pausedElapsed } as Paused;
    case 'RESUME':
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'running',
        breakAcc: state.breakAcc + action.breakSeconds,
        breakStart: null,
        pausedElapsed: undefined, // clear pausedElapsed
      } as Running;
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

export const StudyTimer = () => {
  // Restore state from localStorage, including paused state
  const [state, dispatch] = useReducer(
    reducer,
    (() => {
      const loaded = load<State>('focus.timer', { status: 'idle' } as State);
      // If restoring a paused state, ensure pausedElapsed is set
      if (loaded.status === 'paused' && loaded.breakStart) {
        // If pausedElapsed is missing (old state), calculate it
        const pausedElapsed =
          typeof loaded.pausedElapsed === 'number'
            ? loaded.pausedElapsed
            : secondsSince(loaded.start) - loaded.breakAcc;
        return {
          ...loaded,
          pausedElapsed,
        } as Paused;
      }
      return loaded;
    })(),
  );
  const [elapsed, setElapsed] = useState(() => {
    if (state.status === 'paused') {
      return (state as Paused).pausedElapsed;
    }
    return 0;
  }); // secs
  const [breakElapsed, setBreakElapsed] = useState(() => {
    if (state.status === 'paused') {
      return secondsSince((state as Paused).breakStart);
    }
    return 0;
  });
  const [showFinish, setShowFinish] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick for running
  useEffect(() => {
    if (state.status !== 'running') return;
    const runningState = state as Running;
    const tick = () => setElapsed(secondsSince(runningState.start) - runningState.breakAcc);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state]);

  // Robust break timer effect for paused state
  useEffect(() => {
    // Always clear any previous interval
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
    if (state.status === 'paused') {
      const pausedState = state as Paused;
      const tick = () => setBreakElapsed(secondsSince(pausedState.breakStart));
      tick();
      breakIntervalRef.current = setInterval(tick, 1000);
    } else {
      setBreakElapsed(0);
    }
    // Cleanup on unmount
    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    };
  }, [state.status, state.status === 'paused' ? (state as Paused).breakStart : null]);

  // Set elapsed time correctly when paused (fixes display reset on reload/tab switch)
  useEffect(() => {
    if (state.status === 'paused') {
      setElapsed((state as Paused).pausedElapsed);
    }
  }, [state]);

  // Persist or clear reducer state every time it changes
  useEffect(() => {
    if (state.status === 'idle') clearTimer();
    else save('focus.timer', state);
  }, [state]);

  // ── actions ────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!user?.id) return;
    // Check for existing active session
    const active = await getActiveSessionForUser(user.id);
    if (active) {
      console.log('[StudyTimer] Reusing existing session:', active.id);
      dispatch({ type: 'START', id: active.id, start: new Date(active.started_at).getTime() });
      return;
    }
    try {
      const s = await startSession(user.id);
      console.log('[StudyTimer] Started new session:', s.id);
      dispatch({ type: 'START', id: s.id, start: Date.now() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('startSession failed', e);
      dispatch({ type: 'START', id: crypto.randomUUID(), start: Date.now() });
    }
  }, [user]);

  const handlePause = useCallback(() => {
    if (state.status !== 'running') return;
    console.log('[StudyTimer] Paused');
    dispatch({ type: 'PAUSE', breakStart: Date.now() });
  }, [state]);

  const handleResume = useCallback(() => {
    if (state.status !== 'paused') return;
    console.log('[StudyTimer] Resumed');
    const breakSecs = secondsSince(state.breakStart);
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
        queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
        console.log('[StudyTimer] Ended session:', state.id);
      }
      dispatch({ type: 'RESET' });
      setElapsed(0);
      setBreakElapsed(0);
      setShowFinish(false);
    },
    [state, user],
  );

  // Discard session handler
  const handleDiscard = useCallback(() => {
    dispatch({ type: 'RESET' });
    setElapsed(0);
    setBreakElapsed(0);
    setShowFinish(false);
    clearTimer();
  }, []);

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

      {showFinish && (
        <FinishModal
          elapsedSecs={elapsed}
          onSubmit={saveFinish}
          onClose={() => setShowFinish(false)}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};
