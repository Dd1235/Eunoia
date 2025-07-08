import { StudyTimer } from '../components/StudyTimer/StudyTimer';
import { SleepLog } from '../components/StudyTimer/SleepLog';
import { MoodLog } from '../components/StudyTimer/MoodLog';
import Dashboard from './Dashboard';
import { Container } from '../components/Layout/Container';

export const Home = () => (
  <Container>
    <div className='flex flex-col gap-8 py-10 md:flex-row'>
      {/* Left: stacked loggers in styled boxes */}
      <div className='flex w-full max-w-xs flex-col gap-6 pt-10'>
        <div className='rounded-2xl border border-gray-200 bg-white/70 p-4 shadow dark:border-gray-800 dark:bg-black/50'>
          <StudyTimer />
        </div>
        <SleepLog />
        <MoodLog coloredEmojis />
      </div>
      {/* Right: Dashboard */}
      <div className='flex-1 pt-2'>
        <Dashboard />
      </div>
    </div>
  </Container>
);

export default Home;
