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

  if (user) return <Navigate to='/dashboard' replace />;

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
