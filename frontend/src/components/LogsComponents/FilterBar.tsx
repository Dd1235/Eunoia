import { FC } from 'react';
import { CalendarDaysIcon, ClockIcon, HeartIcon } from '@heroicons/react/24/outline';

interface Props {
  show: { study: boolean; sleep: boolean; mood: boolean };
  toggle: (key: keyof Props['show']) => void;
}

const Item: FC<{
  active: boolean;
  onClick: () => void;
  Icon: typeof ClockIcon;
  label: string;
}> = ({ active, onClick, Icon, label }) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm ring-1 ${
      active
        ? 'bg-black text-white ring-black dark:bg-white dark:text-black dark:ring-white'
        : 'text-gray-600 ring-gray-300 dark:text-gray-300 dark:ring-gray-600'
    }`}
  >
    <Icon className='h-4 w-4' /> {label}
  </button>
);

export const FilterBar: FC<Props> = ({ show, toggle }) => (
  <div className='mb-4 flex gap-3'>
    <Item active={show.study} onClick={() => toggle('study')} Icon={ClockIcon} label='Study' />
    <Item active={show.sleep} onClick={() => toggle('sleep')} Icon={CalendarDaysIcon} label='Sleep' />
    <Item active={show.mood} onClick={() => toggle('mood')} Icon={HeartIcon} label='Mood' />
  </div>
);
