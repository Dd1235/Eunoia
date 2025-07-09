// frontend/src/hooks/useChatAgent.ts
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const api = (path: string) => `${API_BASE}${path}`;

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
}

export function useChatAgent() {
  const { user } = useAuth();
  const uid = user?.id ?? '';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  /** Grab fresh JWT for every request */
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  /** Helper that always sends the Authorization header */
  const authFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      return fetch(api(path), {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
    },
    [getToken]
  );

  /* ---------- session helpers ---------- */

  const checkSessionExists = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/chat/session/exists');
    const data = await res.json();
    setLoading(false);
    if (data.session_id) setSessionId(data.session_id);
    return data.session_id as string | null;
  }, [authFetch]);

  const fetchFullSession = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/chat/session/full');
    const data = await res.json();
    setLoading(false);
    if (data.session_id) {
      setSessionId(data.session_id);
      setLogs(data.logs);
      setHistory(data.history ?? []);
    }
    return data;
  }, [authFetch]);

  const startNewSession = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/chat/session', {
      method: 'POST',
      body: JSON.stringify({ user_id: uid }),
    });
    const data = await res.json();
    setLoading(false);
    setSessionId(data.session_id);
    setLogs(null);
    setHistory(data.reply ? [{ role: 'agent', content: data.reply }] : []);
    return data;
  }, [authFetch, uid]);

  /* ---------- messaging ---------- */

  const sendMessage = useCallback(
    async (text: string, model: 'openai' | 'gemini' = 'openai') => {
      if (!sessionId) return 'No session';
      setLoading(true);

      try {
        const res = await authFetch('/chat/message', {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionId,
            user_id: uid,
            message: text,
            model,
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Request failed');
        }

        const data = await res.json();
        setHistory((h) => [
          ...h,
          { role: 'user', content: text },
          { role: 'agent', content: data.reply },
        ]);
        setLoading(false);
        return null;
      } catch (err: any) {
        setLoading(false);
        return err.message ?? 'Unknown error';
      }
    },
    [authFetch, sessionId, uid]
  );

  return {
    /* state */
    sessionId,
    logs,
    history,
    loading,
    /* actions */
    checkSessionExists,
    fetchFullSession,
    startNewSession,
    sendMessage,
  };
}
