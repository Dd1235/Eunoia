import { useEffect, useState } from 'react';
import { useChatSession } from '../../context/ChatSessionContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { RotateCcw } from 'lucide-react';

export const ChatPanel = () => {
  const {
    sessionId,
    history,
    loading,
    model,
    setModel,
    checkSessionExists,
    fetchFullSession,
    startNewSession,
    sendMessage,
  } = useChatSession();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [checked, setChecked] = useState(false);

  /* on first mount, ask if user wants to resume */
  useEffect(() => {
    if (checked) return;
    (async () => {
      const exists = await checkSessionExists();
      if (exists) setShowPrompt(true);
      else await startNewSession();
      setChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const handleResume = async () => {
    await fetchFullSession();
    setShowPrompt(false);
  };
  const handleReplace = async () => {
    await startNewSession();
    setShowPrompt(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const err = await sendMessage(input.trim());
    if (err) setError(err);
    setInput('');
  };

  return (
    <div className='flex h-full max-h-[70vh] w-full max-w-lg flex-col justify-between rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-black/40'>
      {showPrompt && (
        <div className='mb-4 rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-900/30'>
          <p className='mb-2'>A previous chat session was found. What would you like to do?</p>
          <div className='flex gap-2'>
            <button onClick={handleResume} className='rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700'>
              Resume
            </button>
            <button
              onClick={handleReplace}
              className='rounded bg-gray-300 px-3 py-1 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
            >
              Start new
            </button>
          </div>
        </div>
      )}

      {/* ------------ history ------------- */}
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
          Chat with your agent (session survives page changes)
        </div>

        {/* model chooser */}
        <div className='mb-2 flex items-center gap-2'>
          <span className='text-xs text-gray-500'>Model:</span>
          <Select value={model} onValueChange={(v) => setModel(v as any)}>
            <SelectTrigger className='h-7 w-32 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='openai'>OpenAI</SelectItem>
              <SelectItem value='gemini'>Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className='mb-2 flex items-center gap-2 text-xs text-red-500'>
            <span>{error}</span>
            <button onClick={handleReplace} className='rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900'>
              <RotateCcw className='h-4 w-4' />
            </button>
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className='mb-2 text-xs text-gray-400'>No messages yet. Start the conversation!</div>
        )}

        {history.map((m, i) => (
          <div key={i} className='mb-2 text-sm text-gray-800 dark:text-gray-200'>
            <b>{m.role === 'user' ? 'You' : 'Agent'}:</b> {m.content}
          </div>
        ))}

        {loading && <div className='text-xs text-blue-500'>Loading…</div>}
      </div>

      {/* ------------ composer ------------- */}
      <div className='mt-2 flex'>
        <input
          className='flex-1 rounded-l border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-black'
          placeholder='Type a message…'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || showPrompt}
        />
        <button
          className='rounded-r bg-gray-300 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          onClick={handleSend}
          disabled={loading || showPrompt}
        >
          Send
        </button>
      </div>
    </div>
  );
};
