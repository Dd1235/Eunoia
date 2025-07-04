// src/App.tsx
import type { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserProfile from './pages/UserProfile';
import MeditateWithAI from 'pages/MeditateWithAI';
import Player from './components/Audio/Player';
import { ChatSessionProvider } from './context/ChatSessionContext';

const App: FC = () => (
  <ChatSessionProvider>
    <Header />

    <Routes>
      <Route path='/' element={<Home />} />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path='/logs'
        element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        }
      />
      <Route path='/about' element={<About />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route
        path='/user'
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path='/meditate'
        element={
          <ProtectedRoute>
            <MeditateWithAI />
          </ProtectedRoute>
        }
      />
      <Route path='/test/audio' element={<Player />} />

      <Route path='*' element={<Home />} />
    </Routes>
  </ChatSessionProvider>
);

export default App;
