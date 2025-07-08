// src/components/StudyTimer/SleepMoodPanel.tsx

import { useAuth } from '../../context/AuthContext';
// import { insertSleep, insertMood } from '../../lib/sleepMood';
import { insertSleep, insertMood } from '../../lib/studySleepMood';

import { useState, useEffect } from 'react';

import { load, save } from 'lib/persist';
import { useQueryClient } from '@tanstack/react-query';

export const SleepMoodPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [sleepScore, setSleepScore] = useState<string>(
    load('focus.sleepScore', null) !== null ? String(load('focus.sleepScore', null)) : '',
  );
  const [sleepNote, setSleepNote] = useState(load('focus.sleepNote', ''));
  const [moodScore, setMoodScore] = useState<string>('');
  const [moodNote, setMoodNote] = useState('');

  useEffect(() => save('focus.sleepScore', sleepScore ? Number(sleepScore) : null), [sleepScore]);
  useEffect(() => save('focus.sleepNote', sleepNote), [sleepNote]);
  useEffect(() => save('focus.moodScore', moodScore ? Number(moodScore) : null), [moodScore]);
  useEffect(() => save('focus.moodNote', moodNote), [moodNote]);

  // local demo only
  const handleSleepSave = async () => {
    await insertSleep(Number(sleepScore), sleepNote);
    queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
    setSleepScore('');
    setSleepNote('');
    save('focus.sleepScore', null);
    save('focus.sleepNote', '');
  };

  const handleMoodSave = async () => {
    await insertMood(Number(moodScore), moodNote);
    queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
    setMoodScore('');
    setMoodNote('');
    save('focus.moodScore', null);
    save('focus.moodNote', '');
  };

  // Input handlers to prevent leading zero, allow empty, and restrict range
  const handleSleepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/^0+/, ''); // Remove leading zeros
    if (val === '') {
      setSleepScore('');
      return;
    }
    // Only allow numbers 1-10
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setSleepScore(val);
    }
  };

  const handleMoodInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/^0+/, ''); // Remove leading zeros
    if (val === '') {
      setMoodScore('');
      return;
    }
    // Only allow numbers 1-5
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      setMoodScore(val);
    }
  };

  return (
    <div className='space-y-8'>
      {/* sleep */}
      <div>
        <h3 className='mb-2 text-lg font-semibold dark:text-gray-100'>Sleep Log</h3>
        <label className='block text-sm dark:text-gray-300'>
          Score (1-10)
          <input
            type='number'
            min={1}
            max={10}
            value={sleepScore}
            onChange={handleSleepInput}
            className='mt-1 w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
            inputMode='numeric'
            pattern='[0-9]*'
          />
        </label>
        <textarea
          className='mt-2 h-20 w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
          placeholder='Notes…'
          value={sleepNote}
          onChange={(e) => setSleepNote(e.target.value)}
        />
        <button
          type='button'
          onClick={handleSleepSave}
          disabled={sleepScore === ''}
          className='mt-2 w-full rounded bg-indigo-600/90 py-2 text-white hover:bg-indigo-700 disabled:opacity-40'
        >
          Save Sleep
        </button>
      </div>

      {/* mood */}
      <div>
        <h3 className='mb-2 text-lg font-semibold dark:text-gray-100'>Mood Log</h3>
        <label className='block text-sm dark:text-gray-300'>
          Score (1-5)
          <input
            type='number'
            min={1}
            max={5}
            value={moodScore}
            onChange={handleMoodInput}
            className='mt-1 w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
            inputMode='numeric'
            pattern='[0-9]*'
          />
        </label>
        <textarea
          className='mt-2 h-20 w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
          placeholder='Remarks…'
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
        />
        <button
          type='button'
          onClick={handleMoodSave}
          disabled={moodScore === ''}
          className='mt-2 w-full rounded bg-indigo-600/90 py-2 text-white hover:bg-indigo-700 disabled:opacity-40'
        >
          Save Mood
        </button>
      </div>
    </div>
  );
};
