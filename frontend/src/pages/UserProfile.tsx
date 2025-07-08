import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Accordion } from '../components/ui/accordion';
import { TrashIcon } from '@heroicons/react/24/outline';

const GoalsSection = ({ longGoals, shortGoals, newLongGoal, setNewLongGoal, newShortGoal, setNewShortGoal }: any) => (
  <div className='mb-10 flex flex-col gap-6 md:flex-row'>
    {/* Long Term Goals */}
    <section className='flex-1'>
      <h2 className='mb-2 text-xl font-semibold'>Long Term Goals</h2>
      <div className='mb-4 flex gap-2'>
        <input
          className='flex-1 rounded border px-2 py-1'
          placeholder='Add a long term goal...'
          value={newLongGoal}
          onChange={(e) => setNewLongGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLongGoal.trim()) {
              longGoals.addGoal(newLongGoal.trim());
              setNewLongGoal('');
            }
          }}
        />
        <Button
          onClick={async () => {
            if (newLongGoal.trim()) {
              await longGoals.addGoal(newLongGoal.trim());
              setNewLongGoal('');
            }
          }}
          disabled={!newLongGoal.trim()}
        >
          Add
        </Button>
      </div>
      {longGoals.isLoading ? (
        <div>Loading...</div>
      ) : longGoals.goals.length === 0 ? (
        <div className='text-gray-500'>No long term goals yet.</div>
      ) : (
        <ul className='space-y-2'>
          {longGoals.goals.map((goal: import('../hooks/useGoals').Goal) => (
            <li key={goal.id} className='flex items-center gap-2'>
              <span className='flex-1'>{goal.goal}</span>
              <Button variant='destructive' size='sm' onClick={() => longGoals.deleteGoal(goal.id)}>
                <TrashIcon className='h-4 w-4' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
    {/* Short Term Goals */}
    <section className='flex-1'>
      <h2 className='mb-2 text-xl font-semibold'>Short Term Goals</h2>
      <div className='mb-4 flex gap-2'>
        <input
          className='flex-1 rounded border px-2 py-1'
          placeholder='Add a short term goal...'
          value={newShortGoal}
          onChange={(e) => setNewShortGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newShortGoal.trim()) {
              shortGoals.addGoal(newShortGoal.trim());
              setNewShortGoal('');
            }
          }}
        />
        <Button
          onClick={async () => {
            if (newShortGoal.trim()) {
              await shortGoals.addGoal(newShortGoal.trim());
              setNewShortGoal('');
            }
          }}
          disabled={!newShortGoal.trim()}
        >
          Add
        </Button>
      </div>
      {shortGoals.isLoading ? (
        <div>Loading...</div>
      ) : shortGoals.goals.length === 0 ? (
        <div className='text-gray-500'>No short term goals yet.</div>
      ) : (
        <ul className='space-y-2'>
          {shortGoals.goals.map((goal: import('../hooks/useGoals').Goal) => (
            <li key={goal.id} className='flex items-center gap-2'>
              <span className='flex-1'>{goal.goal}</span>
              <Button variant='destructive' size='sm' onClick={() => shortGoals.deleteGoal(goal.id)}>
                <TrashIcon className='h-4 w-4' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

const UserProfile = () => {
  const { user } = useAuth();
  const [newLongGoal, setNewLongGoal] = useState('');
  const [newShortGoal, setNewShortGoal] = useState('');
  const userId = user?.id || '';
  const longGoals = useGoals(userId, 'long_term_goals');
  const shortGoals = useGoals(userId, 'short_term_goals');

  // Old accordion items (user info, preferences, about)
  const items = [
    {
      title: 'User Info',
      content: user ? (
        <ul className='space-y-2'>
          <li>
            <span className='font-medium'>Email:</span> {user.email}
          </li>
        </ul>
      ) : (
        <p className='text-gray-600 dark:text-gray-300'>Not logged in.</p>
      ),
    },
    {
      title: 'Preferences',
      content: (
        <div>
          <p className='mb-2'>
            Theme: <span className='font-semibold'>Auto</span>
          </p>
          <p>
            Model: <span className='font-semibold'>gpt-4o-mini by default</span>
          </p>
        </div>
      ),
    },
    {
      title: 'About Eunoia',
      content: (
        <div>
          <p className='mb-2'>Eunoia is your AI-powered study and wellness companion. ✨</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Version 1.0.0</p>
        </div>
      ),
    },
  ];

  return (
    <div className='mx-auto max-w-2xl py-10'>
      <h1 className='mb-6 text-2xl font-bold'>User Profile</h1>
      <GoalsSection
        longGoals={longGoals}
        shortGoals={shortGoals}
        newLongGoal={newLongGoal}
        setNewLongGoal={setNewLongGoal}
        newShortGoal={newShortGoal}
        setNewShortGoal={setNewShortGoal}
      />
      <Accordion items={items} defaultOpen={0} />
    </div>
  );
};

export default UserProfile;
