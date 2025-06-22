import type { FC, ReactNode } from 'react';

export const Container: FC<{ children: ReactNode }> = ({ children }) => (
  //   <div className='mx-auto w-full max-w-6xl px-4'>{children}</div>
  <div className='mx-auto w-full max-w-6xl px-8 2xl:px-0'>{children}</div>
);
