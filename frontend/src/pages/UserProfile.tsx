import { useAuth } from '../context/AuthContext';
import { Accordion } from '../components/ui/accordion';

const UserProfile = () => {
  const { user } = useAuth();

  const items = [
    {
      title: 'User Info',
      content: user ? (
        <ul className='space-y-2'>
          <li>
            <span className='font-medium'>UID:</span> {user.id}
          </li>
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
    <div className='mx-auto max-w-xl p-8'>
      <h2 className='mb-8 text-center font-sans text-3xl font-semibold text-neutral-900 drop-shadow-sm dark:text-neutral-100'>
        Profile
      </h2>

      <Accordion items={items} defaultOpen={0} />
    </div>
  );
};

export default UserProfile;
