import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

/* ---------- types ---------- */
export type ModelType = 'openai' | 'gemini';
export interface ChatMsg {
  role: 'user' | 'agent';
  content: string;
}

interface Ctx {
  sessionId: string | null;
  history: ChatMsg[];
  logs: any;
  loading: boolean;
  model: ModelType;
  setModel: (m: ModelType) => void;
  checkSessionExists: () => Promise<string | null>;
  fetchFullSession: () => Promise<void>;
  startNewSession: () => Promise<void>;
  sendMessage: (txt: string) => Promise<string | null>;
  clear: () => void;
  logsConfig: { study: boolean; sleep: boolean; mood: boolean };
  setLogsConfig: (cfg: { study: boolean; sleep: boolean; mood: boolean }) => void;
}

const ChatSessionContext = createContext<Ctx | undefined>(undefined);
export const useChatSession = () => useContext(ChatSessionContext!);

/* ---------- helper --------- */
const LS_KEY = 'eunoia-chat-session';

const api = (p: string) => `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${p}`;

export const ChatSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.id ?? '';

  /* ---------- state ---------- */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [logs, setLogs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<ModelType>('openai');
  const [logsConfig, setLogsConfig] = useState<{ study: boolean; sleep: boolean; mood: boolean }>(() => {
    const raw = sessionStorage.getItem('logsConfig');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return { study: true, sleep: true, mood: true };
  });

  /* ---------- persistence ---------- */
  useEffect(() => {
    const cached = sessionStorage.getItem(LS_KEY);
    if (cached) {
      try {
        const { s, h, l } = JSON.parse(cached);
        setSessionId(s);
        setHistory(h);
        setLogs(l);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(LS_KEY, JSON.stringify({ s: sessionId, h: history, l: logs }));
    sessionStorage.setItem('logsConfig', JSON.stringify(logsConfig));
  }, [sessionId, history, logs, logsConfig]);

  /* ---------- helpers ---------- */
  const jwt = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  };

  const authFetch = async (path: string, init: RequestInit = {}) =>
    fetch(api(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${await jwt()}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

  /* ---------- session ops ---------- */
  const checkSessionExists = async () => {
    if (!uid) return null;
    const res = await authFetch('/chat/session/exists');
    const { session_id } = await res.json();
    if (session_id) setSessionId(session_id);
    return session_id;
  };

  const fetchFullSession = async () => {
    if (!uid) return;
    setLoading(true);
    const res = await authFetch('/chat/session/full');
    const data = await res.json();
    setLoading(false);
    if (data.session_id) {
      setSessionId(data.session_id);
      setHistory(data.history ?? []);
      setLogs(data.logs);
    }
  };

  const startNewSession = async () => {
    if (!uid) return;
    setLoading(true);
    const res = await authFetch('/chat/session', {
      method: 'POST',
      body: JSON.stringify({ user_id: uid }),
    });
    const data = await res.json();
    setLoading(false);
    setSessionId(data.session_id);
    setHistory(data.reply ? [{ role: 'agent', content: data.reply }] : []);
    setLogs(null);
  };

  const sendMessage = async (txt: string) => {
    if (!sessionId || !uid) return 'No session';
    setLoading(true);
    try {
      const res = await authFetch('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          user_id: uid,
          message: txt,
          model,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { reply } = await res.json();
      setHistory((h) => [...h, { role: 'user', content: txt }, { role: 'agent', content: reply }]);
      setLoading(false);
      return null;
    } catch (e: any) {
      setLoading(false);
      return e.message ?? 'Unknown error';
    }
  };

  const clear = () => {
    setSessionId(null);
    setHistory([]);
    setLogs(null);
  };

  /* ---------- ctx value ---------- */
  const value: Ctx = {
    sessionId,
    history,
    logs,
    loading,
    model,
    setModel,
    checkSessionExists,
    fetchFullSession,
    startNewSession,
    sendMessage,
    clear,
    logsConfig,
    setLogsConfig,
  };

  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
};

export default ChatSessionProvider;
