// src/hooks/useChatAgent.ts
import { useAuth } from '../context/AuthContext';
import { useChatSession } from '../context/ChatSessionContext';
import { supabase } from '../lib/supabaseClient';

export const useChatAgent = () => {
  const { user } = useAuth();
  const { sessionId, setSessionId, setHistory } = useChatSession();

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const startSession = async () => {
    const token = await getAccessToken();
    const res = await fetch('http://localhost:8000/chat/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: user?.id }),
    });
    const data = await res.json();
    if (data.session_id && data.reply) {
      setSessionId(data.session_id);
      setHistory([{ role: 'agent', content: data.reply }]);
    }
  };

  const sendMessage = async (text: string, model: 'openai' | 'gemini') => {
    const token = await getAccessToken();
    try {
      const res = await fetch('http://localhost:8000/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user?.id,
          message: text,
          model,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to send message');
      }
      const data = await res.json();
      setHistory((h) => [
        ...h,
        { role: 'user', content: text },
        { role: 'agent', content: data.reply },
      ]);
      return null;
    } catch (error: any) {
      return error.message || 'Unknown error';
    }
  };

  return { startSession, sendMessage };
};
