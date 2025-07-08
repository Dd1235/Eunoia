import { useAuth } from '../../context/AuthContext';
import { insertSleep } from '../../lib/studySleepMood';
import { useState, useEffect } from 'react';
import { load, save } from 'lib/persist';
import { useQueryClient } from '@tanstack/react-query';

export const SleepLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sleepScore, setSleepScore] = useState<string>(
    load('focus.sleepScore', null) !== null ? String(load('focus.sleepScore', null)) : '',
  );
  const [sleepNote, setSleepNote] = useState(load('focus.sleepNote', ''));
  useEffect(() => save('focus.sleepScore', sleepScore ? Number(sleepScore) : null), [sleepScore]);
  useEffect(() => save('focus.sleepNote', sleepNote), [sleepNote]);
  const handleSleepSave = async () => {
    await insertSleep(Number(sleepScore), sleepNote);
    queryClient.invalidateQueries({ queryKey: ['logs', user?.id] });
    setSleepScore('');
    setSleepNote('');
    save('focus.sleepScore', null);
    save('focus.sleepNote', '');
  };
  const handleSleepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/^0+/, '');
    if (val === '') {
      setSleepScore('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setSleepScore(val);
    }
  };
  return (
    <div className='rounded-2xl border border-gray-200 bg-white/70 p-4 shadow dark:border-gray-800 dark:bg-black/50'>
      <h3 className='mb-2 text-base font-semibold dark:text-gray-100'>Sleep Log</h3>
      <label className='block text-xs dark:text-gray-300'>
        Score (1-10)
        <input
          type='number'
          min={1}
          max={10}
          value={sleepScore}
          onChange={handleSleepInput}
          className='mt-1 w-full rounded bg-gray-100 p-2 text-sm dark:bg-gray-800'
          inputMode='numeric'
          pattern='[0-9]*'
        />
      </label>
      <textarea
        className='mt-2 h-16 w-full rounded bg-gray-100 p-2 text-sm dark:bg-gray-800'
        placeholder='Notes…'
        value={sleepNote}
        onChange={(e) => setSleepNote(e.target.value)}
      />
      <button
        type='button'
        onClick={handleSleepSave}
        disabled={sleepScore === ''}
        className='mt-2 w-full rounded bg-indigo-600/90 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-40'
      >
        Save Sleep
      </button>
    </div>
  );
};

export default SleepLog;
