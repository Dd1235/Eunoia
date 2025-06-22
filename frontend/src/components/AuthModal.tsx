import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type AuthModalProps = { close: () => void };

export const AuthModal: FC<AuthModalProps> = ({ close }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error: supabaseError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password: pass })
      : await supabase.auth.signUp({ email, password: pass });

    if (supabaseError) setError(supabaseError.message);
    else close();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <form onSubmit={handleSubmit} className='w-80 space-y-4 rounded-xl bg-white p-6 dark:bg-gray-900'>
        <h2 className='text-center text-lg font-semibold'>{isLogin ? 'Log In' : 'Sign Up'}</h2>

        <input
          className='w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type='email'
          required
        />
        <input
          className='w-full rounded bg-gray-100 p-2 dark:bg-gray-800'
          type='password'
          placeholder='Password'
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />

        {error && <p className='text-sm text-red-500'>{error}</p>}

        <button
          type='submit'
          className='w-full rounded bg-black py-2 text-white hover:opacity-90 dark:bg-white dark:text-black'
        >
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>

        <button
          type='button'
          className='block w-full text-center text-sm underline'
          onClick={() => setIsLogin((v) => !v)}
        >
          {isLogin ? 'New here? Sign Up' : 'Have an account? Log In'}
        </button>

        <button type='button' onClick={close} className='mt-2 block w-full text-center text-xs text-gray-400'>
          Close
        </button>
      </form>
    </div>
  );
};
