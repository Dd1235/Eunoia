import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Accordion } from '../components/ui/accordion';
import GoalsSection from '../components/UserProfile/GoalsSection';

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
