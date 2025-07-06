// src/pages/Logs.tsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container } from '../components/Layout/Container';
import { useLogs } from '../lib/useLogs';
import { LogCard } from '../components/Logs/LogCard';
import { useChatSession } from '../context/ChatSessionContext';
import { LogsPanel } from '../components/Logs/LogsPanel';
import { ChatPanel } from '../components/Logs/ChatPanel';

import { FilterBar } from '../components/Logs/FilterBar';

// LogsPanel: scrollable, independent, with classic toggle UI and sessionStorage persistence
const logTypes = [
  { key: 'study', label: 'Study' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'mood', label: 'Mood' },
];

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
  const { logsConfig, setLogsConfig } = useChatSession();

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
        <LogsPanel logs={logs} logsConfig={logsConfig} setLogsConfig={setLogsConfig} />
        {/* Right: Chat */}
        <ChatPanel />
      </div>
    </Container>
  );
};

export default Logs;
