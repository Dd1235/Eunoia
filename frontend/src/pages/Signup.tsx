import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to='/' replace />;

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error: e } = await supabase.auth.signUp({ email, password: pass });
    if (e) setError(e.message);
    setLoading(false);
  };

  return (
    <main className='flex min-h-screen items-center justify-center'>
      <div className='w-80 space-y-4 rounded-xl bg-white p-6 shadow dark:bg-gray-900'>
        <h1 className='text-center text-xl font-semibold text-gray-800 dark:text-gray-100'>Sign Up</h1>

        <input
          className='w-full rounded bg-gray-100 p-2 placeholder-gray-400 dark:bg-gray-800 dark:placeholder-gray-500'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type='email'
          required
        />
        <input
          className='w-full rounded bg-gray-100 p-2 placeholder-gray-400 dark:bg-gray-800 dark:placeholder-gray-500'
          placeholder='Password'
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type='password'
          required
        />

        {error && <p className='text-sm text-red-500'>{error}</p>}

        <button
          onClick={handleSignup}
          disabled={loading}
          className='w-full rounded bg-black py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black'
          type='button'
        >
          {loading ? '…' : 'Create Account'}
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'github',
              options: {
                redirectTo: 'http://localhost:5173/', // update for prod
              },
            });
          }}
          className='group flex w-full items-center justify-center gap-2 rounded border border-gray-400 bg-white py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className='h-5 w-5 transition-transform group-hover:scale-110'
          >
            <path d='M12 .5C5.37.5 0 5.87 0 12.5c0 5.29 3.44 9.77 8.21 11.36.6.11.79-.26.79-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.3 0 .32.19.7.8.58C20.56 22.27 24 17.79 24 12.5 24 5.87 18.63.5 12 .5Z' />
          </svg>
          Continue with GitHub
        </button>

        <p className='text-center text-sm text-gray-700 dark:text-gray-300'>
          Already registered?{' '}
          <Link to='/login' className=' underline'>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
