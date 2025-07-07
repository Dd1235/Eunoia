import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { LightBulbIcon } from '@heroicons/react/24/outline';

type BackgroundOption = {
  label: string;
  value: string;
  src: string; // URL to the audio file
};

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { label: 'Ocean', value: 'ocean', src: '/src/assets/ocean.mp3' },
  { label: 'Rain', value: 'rain', src: '/src/assets/rain.mp3' },
  { label: 'Flowing Focus', value: 'flowing_focus', src: '/src/assets/Flowing_Focus.mp3' },
  { label: 'Mellow Focus', value: 'mellow_focus', src: '/src/assets/Mellow_Focus.mp3' },
];

const BackgroundSelect = ({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) => {
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = (src: string) => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }

    const audio = new Audio(src);
    audioPreviewRef.current = audio;
    audio.play().catch(console.error);

    // Stop after 3 seconds
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
  };

  const handleClick = (bg: BackgroundOption) => {
    onSelect(bg.value);
    playPreview(bg.src);
  };

  return (
    <div className='flex flex-wrap gap-2'>
      {BACKGROUND_OPTIONS.map((bg) => (
        <button
          key={bg.value}
          onClick={() => handleClick(bg)}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            selected === bg.value
              ? 'bg-black text-white dark:bg-zinc-100 dark:text-black'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          {bg.label}
        </button>
      ))}
    </div>
  );
};

const formatTime = (secs: number) => {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface MeditationListItem {
  id: string;
  transcript: string;
  audio_url: string;
  created_at: string;
}

const GeneratedMeditation = () => {
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);

  const [selectedBg, setSelectedBg] = useState('ocean');
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleEnded = () => setIsPlaying(false);

  const [myMeditations, setMyMeditations] = useState<MeditationListItem[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleTranscript = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Update mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track playback progress and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
    };
  }, []);

  // Reset state when new audio is set
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    setProgress(0);
    setIsPlaying(false);

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioUrl]);

  // Fetch all user meditations
  useEffect(() => {
    const fetchMeditations = async () => {
      if (!user || !accessToken) return;
      try {
        const res = await fetch('http://localhost:8000/meditate/list', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch meditations');
        const data = await res.json();
        setMyMeditations(data.meditations || []);
      } catch (err) {
        setMyMeditations([]);
      }
    };
    fetchMeditations();
  }, [user, accessToken]);

  // Fetch session and set accessToken
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setAccessToken(data.session?.access_token || null);
    };
    fetchSession();
  }, []);

  // Main handler
  const handleGenerate = async () => {
    console.log('[generate] called with prompt:', prompt);
    if (!prompt.trim()) {
      alert('Please enter a prompt!');
      return;
    }

    setIsLoading(true);
    setTranscript('');
    setAudioUrl('');
    setProgress(0);
    setIsPlaying(false);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('background', selectedBg);
    formData.append('user_id', user?.id || 'anonymous');

    try {
      const res = await fetch('http://localhost:8000/meditate/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      console.log('[generate] response:', data);

      setTranscript(data.transcript);
      setAudioUrl(data.audioUrl);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }, 500);
    } catch (err) {
      console.error('Error during generation:', err);
      alert(`Failed to generate meditation. ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }

    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'meditation.mp3';
    a.click();
  };

  // Seek handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * duration;
    setProgress(percent * 100);
  };

  return (
    <div className='space-y-6 pb-10'>
      <div className='flex gap-2'>
        <Textarea
          placeholder='Enter a meditation prompt...'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className='h-12 min-h-[48px] flex-1 resize-none'
        />
        <Button
          type='button'
          variant='outline'
          onClick={async () => {
            if (!accessToken) return;
            try {
              const res = await fetch('http://localhost:8000/meditate/prompt', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!res.ok) throw new Error('Failed to fetch prompt');
              const data = await res.json();
              setPrompt(data.prompt || '');
            } catch (err) {
              alert('Could not fetch prompt.');
            }
          }}
          className='flex h-12 min-h-0 items-center gap-2 px-4 text-base font-medium'
        >
          <LightBulbIcon className='h-5 w-5 text-black dark:text-white' />
          <span>Suggest Prompt</span>
        </Button>
      </div>
      <BackgroundSelect selected={selectedBg} onSelect={setSelectedBg} />
      <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className='w-full'>
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Generating...
          </>
        ) : (
          'Generate'
        )}
      </Button>

      {audioUrl && (
        <Card>
          <CardContent className='space-y-4 p-4'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500'>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <div
                className='relative h-2 flex-1 cursor-pointer rounded-full bg-gray-300 dark:bg-gray-700'
                onClick={handleSeek}
                style={{ minWidth: 0 }}
              >
                <div className='absolute h-2 rounded-full bg-blue-500' style={{ width: `${progress}%` }} />
              </div>
              <span className='text-xs text-gray-500'>{formatTime(duration)}</span>
            </div>
            <div className='flex justify-center gap-4'>
              <Button onClick={togglePlay} size='icon'>
                {isPlaying ? <PauseIcon className='h-6 w-6' /> : <PlayIcon className='h-6 w-6' />}
              </Button>
              <Button onClick={handleDownload} size='icon'>
                <ArrowDownTrayIcon className='h-6 w-6' />
              </Button>
              <Button onClick={() => setIsMuted((prev) => !prev)} size='icon' variant='ghost'>
                {isMuted ? (
                  <SpeakerXMarkIcon className='h-6 w-6 text-gray-700 dark:text-gray-300' />
                ) : (
                  <SpeakerWaveIcon className='h-6 w-6 text-gray-700 dark:text-gray-300' />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {transcript && (
        <Card>
          <CardContent className='p-4'>
            <h2 className='mb-2 text-xl font-semibold'>Transcript</h2>
            <p className='whitespace-pre-line text-gray-700 dark:text-gray-300'>{transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* My Meditations List */}
      {user && myMeditations.length > 0 && (
        <div className='mt-8'>
          <h2 className='mb-2 text-lg font-semibold'>My Meditations</h2>
          <ul className='space-y-2'>
            {myMeditations.map((m) => {
              const isExpanded = expandedId === m.id;
              return (
                <li
                  key={m.id}
                  className='flex cursor-pointer flex-col gap-1 rounded border p-2 transition hover:bg-muted/30'
                  onClick={() => toggleTranscript(m.id)}
                >
                  <span className='text-xs text-gray-500'>{new Date(m.created_at).toLocaleString()}</span>
                  <span className='whitespace-pre-wrap font-medium'>
                    {isExpanded ? m.transcript : m.transcript.slice(0, 80) + (m.transcript.length > 80 ? '...' : '')}
                  </span>
                  <audio controls src={m.audio_url} className='mt-1 w-full' />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <audio ref={audioRef} src={audioUrl} muted={isMuted} />
    </div>
  );
};

export default GeneratedMeditation;
