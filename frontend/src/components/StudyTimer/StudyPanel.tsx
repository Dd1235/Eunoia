// src/components/StudyTimer/StudyPanel.tsx
import { StudyTimer } from './StudyTimer';
import { SleepMoodPanel } from './SleepMoodPanel';
import { Container } from '@components/Layout/Container';

export const StudyPanel = () => (
  <Container>
    <section className='mx-auto mt-10 grid max-w-6xl gap-6 px-4 sm:grid-cols-2'>
      {/* left card */}
      <div className='rounded-2xl border border-gray-200 bg-white/70 p-8 shadow backdrop-blur-md dark:border-gray-800 dark:bg-black/50'>
        <StudyTimer />
      </div>

      {/* right card */}
      <div className='rounded-2xl border border-gray-200 bg-white/70 p-8 shadow backdrop-blur-md dark:border-gray-800 dark:bg-black/50'>
        <SleepMoodPanel />
      </div>
    </section>
  </Container>
);
