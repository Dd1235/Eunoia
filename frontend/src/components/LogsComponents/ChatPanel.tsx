// File: frontend/src/components/Logs/ChatPanel.tsx

import { useEffect, useState } from 'react';
import { useChatSession } from '../../context/ChatSessionContext';
import { useChatAgent } from '../../hooks/useChatAgent';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { RotateCcw } from 'lucide-react';

export const ChatPanel = () => {
  const { sessionId, history } = useChatSession();
  const { startSession, sendMessage } = useChatAgent();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'openai' | 'gemini'>('openai');
  const [error, setError] = useState<string | null>(null);

  // On mount, start session if not already started
  useEffect(() => {
    if (sessionId || error) return;

    const start = async () => {
      setLoading(true);
      try {
        await startSession();
      } catch (err) {
        setError('Could not connect to the chat server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    start();
  }, [sessionId, error, startSession]);

  // Persist chat history in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    setLoading(true);
    setError(null);
    const err = await sendMessage(input, model);
    if (err) setError(err);
    setInput('');
    setLoading(false);
  };

  return (
    <div className='flex h-full max-h-[70vh] min-w-0 max-w-lg flex-1 flex-col justify-between rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-black/40'>
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
          Chat with your agent (session persists while you are on the app)
        </div>

        <div className='mb-2 flex items-center gap-2'>
          <span className='text-xs text-gray-500'>Model:</span>
          <Select value={model} onValueChange={(v) => setModel(v as 'openai' | 'gemini')}>
            <SelectTrigger className='h-7 w-32 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='openai'>OpenAI</SelectItem>
              <SelectItem value='gemini'>Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='mb-2 rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200'>
          [Agent will use your selected logs to offer suggestions here]
        </div>

        {error && (
          <div className='mb-2 flex items-center gap-2 text-xs text-red-500'>
            <span>{error}</span>
            <button
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  await startSession();
                } catch (err) {
                  setError("Still couldn't connect. Please try again later.");
                } finally {
                  setLoading(false);
                }
              }}
              className='rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900'
              aria-label='Retry'
            >
              <RotateCcw className='h-4 w-4' />
            </button>
          </div>
        )}

        {history.length === 0 && (
          <div className='mb-2 text-xs text-gray-400'>No messages yet. Start the conversation!</div>
        )}

        {history.map((msg, i) => (
          <div key={i} className='mb-2 text-sm text-gray-800 dark:text-gray-200'>
            <b>{msg.role === 'user' ? 'You' : 'Agent'}:</b> {msg.content}
          </div>
        ))}

        {loading && <div className='text-xs text-blue-500'>Loading…</div>}
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
          disabled={loading || !sessionId}
        />
        <button
          className='rounded-r bg-gray-300 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          onClick={handleSend}
          disabled={loading || !sessionId}
        >
          Send
        </button>
      </div>
    </div>
  );
};
