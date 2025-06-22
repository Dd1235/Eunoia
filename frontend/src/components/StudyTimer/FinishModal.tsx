import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  elapsedSecs: number;
  onSubmit: (prod: number, note: string) => void;
  onClose: () => void;
}

const pills = Array.from({ length: 10 }, (_, i) => i + 1);

export const FinishModal: FC<Props> = ({ elapsedSecs, onClose, onSubmit }) => {
  const [prod, setProd] = useState(7);
  const [note, setNote] = useState('');

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(prod, note);
  };

  const hms = (() => {
    const h = Math.floor(elapsedSecs / 3600);
    const m = Math.floor((elapsedSecs % 3600) / 60);
    const s = elapsedSecs % 60;
    return `${h}h ${m}m ${s}s`;
  })();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm'>
      <form
        onSubmit={handle}
        className='max-h-[90vh] w-80 space-y-6 overflow-y-auto rounded-2xl bg-white p-8 dark:bg-gray-900'
      >
        <h2 className='text-center text-xl font-semibold dark:text-gray-100'>
          🎉 Yay! you studied
          <br />
          <span className='font-mono text-indigo-600 dark:text-indigo-400'>{hms}</span>
        </h2>

        {/* productivity pill picker */}
        <div className='space-y-2'>
          <p className='text-sm font-medium dark:text-gray-300'>How productive was it?</p>
          <div className='grid grid-cols-5 gap-2'>
            {pills.map((p) => (
              <button
                key={p}
                type='button'
                onClick={() => setProd(p)}
                className={clsx(
                  'rounded-full py-1 text-sm ring-1',
                  prod === p
                    ? 'bg-indigo-600 text-white ring-indigo-600'
                    : 'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* notes */}
        <textarea
          placeholder='Notes (optional)'
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className='h-24 w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
        />

        <button
          type='submit'
          className='w-full rounded-lg bg-black py-2 text-white hover:opacity-90 dark:bg-white dark:text-black'
        >
          Save
        </button>

        <button type='button' onClick={onClose} className='block w-full text-center text-xs text-gray-400 underline'>
          Cancel
        </button>
      </form>
    </div>
  );
};
