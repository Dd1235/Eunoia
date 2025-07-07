// src/pages/Logs.tsx
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container } from '../components/Layout/Container';
import { useLogs } from '../hooks/useLogs';
import { useChatSession } from '../context/ChatSessionContext';
import { LogsPanel } from '../components/Logs/LogsPanel';
import { ChatPanel } from '../components/Logs/ChatPanel';

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
  const { data: logs, isLoading } = useLogs();
  const { logsConfig, setLogsConfig } = useChatSession();

  useRestoreSession(); // must run unconditionally

  if (loading || !user || isLoading) {
    return (
      <Container>
        <p className='py-10 text-center text-sm text-gray-400 dark:text-gray-500'>Loading your logs…</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className='py-8 text-2xl font-semibold text-black dark:text-gray-100'>Your Logs</h1>
      <div className='mb-2 text-xs text-gray-500 dark:text-gray-400'>
        Showing only the last 2 weeks of logs. (Fetching more can be added later.)
      </div>
      <div className='flex h-[70vh] flex-col gap-6 md:flex-row'>
        <LogsPanel logs={logs} logsConfig={logsConfig} setLogsConfig={setLogsConfig} />
        <ChatPanel />
      </div>
    </Container>
  );
};
export default Logs;
