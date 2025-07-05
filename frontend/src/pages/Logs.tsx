// src/pages/Logs.tsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container } from '../components/Layout/Container';
import { useLogs } from '../lib/useLogs';
import { LogCard } from '../components/Logs/LogCard';
import { useChatSession } from '../context/ChatSessionContext';

import { FilterBar } from '../components/Logs/FilterBar';

// LogsPanel: scrollable, independent, with classic toggle UI and sessionStorage persistence
const logTypes = [
  { key: 'study', label: 'Study' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'mood', label: 'Mood' },
];

const LogsPanel = ({ filtered }: { filtered: any }) => {
  const { logsConfig, setLogsConfig } = useChatSession();

  // Persist logsConfig in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('logsConfig', JSON.stringify(logsConfig));
  }, [logsConfig]);

  return (
    <div className='max-h-[70vh] min-w-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-black/40'>
      <div className='mb-4 flex gap-2'>
        {logTypes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLogsConfig((cfg) => ({ ...cfg, [key]: !cfg[key as keyof typeof cfg] }))}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors
              ${
                logsConfig[key as keyof typeof logsConfig]
                  ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                  : 'border-black bg-white text-black dark:border-white dark:bg-black dark:text-white'
              }
              focus:outline-none`}
            style={{ minWidth: 70 }}
          >
            {label}
          </button>
        ))}
      </div>
      {!filtered && <p>Loading…</p>}
      {filtered && (
        <div className='space-y-4 pb-24'>
          {logsConfig.study &&
            filtered.study.map((s: any) => (
              <LogCard
                key={s.id}
                type='study'
                title={`Study – ${new Date(s.started_at).toLocaleDateString()}`}
                subtitle={`Duration: ${Math.floor(((new Date(s.ended_at ?? Date.now()).getTime() - new Date(s.started_at).getTime()) / 1000 - s.total_break_secs) / 60)} min • Break ${s.total_break_secs}s`}
                note={s.note}
              />
            ))}
          {logsConfig.sleep &&
            filtered.sleep.map((sl: any) => (
              <LogCard
                key={sl.id}
                type='sleep'
                title={`Sleep – ${sl.date}`}
                subtitle={`Score: ${sl.score}/10`}
                note={sl.note}
              />
            ))}
          {logsConfig.mood &&
            filtered.mood.map((m: any) => (
              <LogCard
                key={m.id}
                type='mood'
                title={`Mood – ${m.formatted}`}
                subtitle={`Score: ${m.score}/5`}
                note={m.note}
              />
            ))}
        </div>
      )}
    </div>
  );
};

// ChatPanel using context, with persistent session and dummy agent, and sessionStorage persistence
const ChatPanel = () => {
  const { history, setHistory } = useChatSession();
  const [input, setInput] = useState('');

  // Persist chat history in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
  }, [history]);

  const handleSend = () => {
    if (!input.trim()) return;
    setHistory((h) => [
      ...h,
      { role: 'user', content: input },
      { role: 'agent', content: 'This is a dummy agent response. (Session persists while you are on the app.)' },
    ]);
    setInput('');
  };

  return (
    <div className='flex h-full max-h-[70vh] min-w-0 max-w-lg flex-1 flex-col justify-between rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-black/40'>
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
          Chat with your agent (session persists while you are on the app)
        </div>
        <div className='mb-2 rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200'>
          [Agent will use your selected logs to offer suggestions here]
        </div>
        {history.length === 0 && (
          <div className='mb-2 text-xs text-gray-400'>No messages yet. Start the conversation!</div>
        )}
        {history.map((msg, i) => (
          <div key={i} className='mb-2'>
            <b>{msg.role === 'user' ? 'You' : 'Agent'}:</b> {msg.content}
          </div>
        ))}
      </div>
      <div className='mt-2 flex'>
        <input
          className='flex-1 rounded-l border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-black'
          placeholder='Type a message...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          className='rounded-r bg-gray-300 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Restore logsConfig and chat history from sessionStorage on mount
const useRestoreSession = () => {
  const { setLogsConfig, setHistory } = useChatSession();
  useEffect(() => {
    const logsConfigRaw = sessionStorage.getItem('logsConfig');
    if (logsConfigRaw) {
      try {
        setLogsConfig(JSON.parse(logsConfigRaw));
      } catch {}
    }
    const chatHistoryRaw = sessionStorage.getItem('chatHistory');
    if (chatHistoryRaw) {
      try {
        setHistory(JSON.parse(chatHistoryRaw));
      } catch {}
    }
  }, [setLogsConfig, setHistory]);
};

const Logs = () => {
  const { user, loading } = useAuth();
  const { logs } = useLogs();
  const [show, setShow] = useState({ study: true, sleep: true, mood: true });
  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const filtered = logs;

  if (loading) return null;
  if (!user)
    return (
      <Container>
        <p className='py-10 text-center'>Log in to view your logs ✨</p>
      </Container>
    );

  useRestoreSession();
  return (
    <Container>
      <h1 className='py-8 text-2xl font-semibold text-black dark:text-gray-100'>Your Logs</h1>
      <div className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
        Showing only the last 2 weeks of logs. (Fetching more can be added later.)
      </div>
      <div className='flex h-[70vh] flex-col gap-6 md:flex-row'>
        {/* Left: Logs */}
        <LogsPanel filtered={filtered} />
        {/* Right: Chat */}
        <ChatPanel />
      </div>
    </Container>
  );
};

export default Logs;
export { LogsPanel, ChatPanel };
