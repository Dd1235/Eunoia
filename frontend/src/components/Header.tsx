import type { FC } from 'react';
import {
  Bars3Icon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

import { Container } from './Layout/Container';

const pages = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Logs', href: '/logs' },
  { name: 'About', href: '/about' },
  { name: 'Meditate', href: '/meditate' },
  { name: 'Todos', href: '/todo' },
];

export const Header: FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') ?? 'system');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else root.classList.remove('dark');
  }, [theme]);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const ThemeIcon = useMemo(() => {
    if (theme === 'light') return <SunIcon className='h-5 w-5' />;
    if (theme === 'dark') return <MoonIcon className='h-5 w-5' />;
    return <ComputerDesktopIcon className='h-5 w-5' />;
  }, [theme]);

  return (
    <header className='sticky top-4 z-50 bg-transparent'>
      <Container>
        <div className='mx-4 w-full max-w-6xl rounded-2xl border border-gray-200 bg-white/70 px-6 shadow-md backdrop-blur-md dark:border-gray-800 dark:bg-black/50  lg:px-8'>
          <div className='flex h-16 items-center justify-between font-sans text-sm'>
            <button
              type='button'
              onClick={() => navigate('/')}
              className='font-eunoia text-3xl font-semibold tracking-tight text-black focus:outline-none dark:text-white'
            >
              &lambda;
            </button>

            {/* Mobile Hamburger */}
            <button
              type='button'
              onClick={() => setMobileOpen((v) => !v)}
              className='p-2 text-gray-800 dark:text-gray-200 md:hidden'
            >
              {mobileOpen ? <XMarkIcon className='h-6 w-6' /> : <Bars3Icon className='h-6 w-6' />}
            </button>

            {/* Desktop Navigation */}
            <nav className='hidden items-center gap-6 md:flex'>
              {pages.map(({ name, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={clsx(
                    'tracking-tight transition-colors hover:text-black dark:hover:text-white',
                    location.pathname === href
                      ? 'font-semibold text-black dark:text-white'
                      : 'font-normal text-gray-500 dark:text-gray-400',
                  )}
                >
                  {name}
                </Link>
              ))}

              <button
                type='button'
                onClick={handleThemeToggle}
                className='rounded-xl p-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
              >
                {ThemeIcon}
              </button>

              {user ? (
                <>
                  <Link
                    to='/user'
                    className='rounded-xl p-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    <UserIcon className='h-5 w-5' />
                  </Link>
                  <button
                    type='button'
                    onClick={logout}
                    className='rounded-xl p-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    <ArrowRightStartOnRectangleIcon className='h-5 w-5' />
                  </button>
                </>
              ) : (
                <Link
                  to='/login'
                  className='rounded-xl p-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  <UserIcon className='h-5 w-5' />
                </Link>
              )}
            </nav>
          </div>

          {/* Mobile Drop-down */}
          {mobileOpen && (
            <div className='space-y-2 py-4 md:hidden'>
              {pages.map(({ name, href }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'block rounded-md px-3 py-2 text-sm',
                    location.pathname === href
                      ? 'font-semibold text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-300',
                  )}
                >
                  {name}
                </Link>
              ))}

              <button
                type='button'
                onClick={handleThemeToggle}
                className='flex items-center gap-2 rounded-md px-3 py-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
              >
                {ThemeIcon} <span>Theme</span>
              </button>

              {user ? (
                <>
                  <Link
                    to='/user'
                    onClick={() => setMobileOpen(false)}
                    className='block px-3 py-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    Profile
                  </Link>
                  <button
                    type='button'
                    onClick={async () => {
                      await logout();
                      setMobileOpen(false);
                    }}
                    className='block w-full px-3 py-2 text-left text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to='/login'
                  onClick={() => setMobileOpen(false)}
                  className='block px-3 py-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  Login / Signup
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </header>
  );
};
