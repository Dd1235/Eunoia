import type { FC } from 'react';

interface Props {
  secs: number;
}

export const Clock: FC<Props> = ({ secs }) => {
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');

  return (
    <span className='font-mono text-6xl tabular-nums tracking-tight text-black dark:text-white'>
      {h}:{m}:{s}
    </span>
  );
};
