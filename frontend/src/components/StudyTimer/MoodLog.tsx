import { useAuth } from '../../context/AuthContext';
import { insertMood } from '../../lib/studySleepMood';
import { useState, useEffect } from 'react';
import { load, save } from 'lib/persist';
import { useQueryClient } from '@tanstack/react-query';

const moodEmojis = [
  { value: 1, label: '😞', desc: 'Very sad' },
  { value: 2, label: '🙁', desc: 'Sad' },
  { value: 3, label: '😐', desc: 'Neutral' },
  { value: 4, label: '🙂', desc: 'Happy' },
  { value: 5, label: '😃', desc: 'Very happy' },
];

interface MoodLogProps {
  coloredEmojis?: boolean;
}

export const MoodLog = ({ coloredEmojis }: MoodLogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [moodScore, setMoodScore] = useState<number | null>(load('focus.moodScore', null));
  const [moodNote, setMoodNote] = useState(load('focus.moodNote', ''));
  useEffect(() => save('focus.moodScore', moodScore), [moodScore]);
  useEffect(() => save('focus.moodNote', moodNote), [moodNote]);
  const handleMoodSave = async () => {
    if (moodScore == null) return;
    await insertMood(moodScore, moodNote);
    queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
    setMoodScore(null);
    setMoodNote('');
    save('focus.moodScore', null);
    save('focus.moodNote', '');
  };
  return (
    <div className='rounded-2xl border border-gray-200 bg-white/70 p-4 shadow dark:border-gray-800 dark:bg-black/50'>
      <h3 className='mb-2 text-base font-semibold dark:text-gray-100'>Mood Log</h3>
      <div className='flex items-center justify-between gap-2 py-1'>
        {moodEmojis.map((emoji) => (
          <button
            key={emoji.value}
            type='button'
            aria-label={emoji.desc}
            className={`rounded-full border-2 p-1.5 text-2xl transition
              ${moodScore === emoji.value ? 'border-indigo-500 bg-gray-200 dark:bg-gray-700' : 'border-transparent bg-transparent'}
              text-black hover:border-indigo-400 focus:outline-none focus:ring-2
              focus:ring-indigo-400 dark:text-white`}
            onClick={() => setMoodScore(emoji.value)}
          >
            <span role='img' aria-label={emoji.desc} style={coloredEmojis ? {} : { filter: 'grayscale(100%)' }}>
              {emoji.label}
            </span>
          </button>
        ))}
      </div>
      <textarea
        className='mt-2 h-16 w-full rounded bg-gray-100 p-2 text-sm dark:bg-gray-800'
        placeholder='Remarks…'
        value={moodNote}
        onChange={(e) => setMoodNote(e.target.value)}
      />
      <button
        type='button'
        onClick={handleMoodSave}
        disabled={moodScore == null}
        className='mt-2 w-full rounded bg-indigo-600/90 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-40'
      >
        Save Mood
      </button>
    </div>
  );
};

export default MoodLog;
