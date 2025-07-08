import type { FC } from 'react';

interface Props {
  secs: number;
  small?: boolean;
}

export const Clock: FC<Props> = ({ secs, small }) => {
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');

  return (
    <span
      className={
        small
          ? 'font-mono text-3xl tabular-nums tracking-tight text-black dark:text-white'
          : 'font-mono text-6xl tabular-nums tracking-tight text-black dark:text-white'
      }
    >
      {h}:{m}:{s}
    </span>
  );
};
