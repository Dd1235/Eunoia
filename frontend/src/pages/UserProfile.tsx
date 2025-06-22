import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className='p-10'>
      <h2 className='text-2xl font-semibold'>Profile</h2>
      {user ? (
        <ul className='mt-4 space-y-2'>
          <li>
            <span className='font-medium'>UID:</span> {user.id}
          </li>
          <li>
            <span className='font-medium'>Email:</span> {user.email}
          </li>
        </ul>
      ) : (
        <p className='mt-2 text-gray-600 dark:text-gray-300'>Not logged in.</p>
      )}
    </div>
  );
};

export default UserProfile;
