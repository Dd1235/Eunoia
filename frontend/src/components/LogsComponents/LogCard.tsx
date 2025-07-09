// src/components/Logs/LogCard.tsx
import { CalendarDaysIcon, ClockIcon, HeartIcon, TrashIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { useState } from 'react';

type Kind = 'study' | 'sleep' | 'mood';

interface Props {
  type: Kind;
  title: string;
  subtitle: string;
  productivity?: number | null; // study only
  note?: string | null;
  onDelete?: () => void;
  isDeleting?: boolean;
  isDeletingThis?: boolean;
}

const IconMap = {
  study: ClockIcon,
  sleep: CalendarDaysIcon,
  mood: HeartIcon,
} as const;

export const LogCard = ({ type, title, subtitle, productivity, note, onDelete, isDeletingThis }: Props) => {
  const [open, setOpen] = useState(false);
  const Icon = IconMap[type];

  return (
    <div
      className={clsx(
        'relative w-full text-left transition',
        'rounded-xl border bg-white/70 px-4 py-3 shadow-sm',
        'hover:shadow-md dark:border-gray-800 dark:bg-black/40',
      )}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className='absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400'
          aria-label='Delete log'
          disabled={isDeletingThis}
        >
          {isDeletingThis ? (
            <svg className='h-5 w-5 animate-spin' viewBox='0 0 24 24'>
              <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
            </svg>
          ) : (
            <TrashIcon className='h-5 w-5' />
          )}
        </button>
      )}
      <div
        onClick={() => setOpen((o) => !o)}
        className='flex w-full cursor-pointer items-start gap-3 focus:outline-none'
        tabIndex={-1}
      >
        <Icon className='mt-1 h-5 w-5 shrink-0 text-black dark:text-white' />
        <div className='flex-1'>
          <h4 className='font-medium text-black dark:text-gray-100'>{title}</h4>
          <p className='text-xs text-gray-600 dark:text-gray-400'>
            {subtitle}
            {productivity != null && (
              <>
                {' '}
                • Productivity
                <span className='font-semibold'>{productivity}</span>/10
              </>
            )}
          </p>
          {/* animated note toggle */}
          <div className={clsx('mt-2 overflow-hidden text-sm transition-[max-height]', open ? 'max-h-40' : 'max-h-0')}>
            {note && <p className='pt-1 text-gray-800 dark:text-gray-300'>{note}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
