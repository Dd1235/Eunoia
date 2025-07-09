import type { FC, ReactNode } from 'react';

export const Container: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`mx-auto w-full max-w-6xl px-8 2xl:px-0 ${className || ''}`}>{children}</div>
);
