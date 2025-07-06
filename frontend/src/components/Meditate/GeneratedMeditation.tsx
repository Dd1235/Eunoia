import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

const formatTime = (secs: number) => {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const GeneratedMeditation = () => {
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleEnded = () => setIsPlaying(false);

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

    try {
      const res = await fetch('http://localhost:8000/meditate/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      console.log('[generate] response:', data);

      setTranscript(data.transcript);
      const fullUrl = `http://localhost:8000${data.audioUrl}`;
      setAudioUrl(fullUrl);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }, 500);
    } catch (err) {
      console.error('Error during generation:', err);
      alert('Failed to generate meditation. See console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(console.error);
    setIsPlaying(true);
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
    <div className='space-y-6'>
      <Textarea placeholder='Enter a meditation prompt...' value={prompt} onChange={(e) => setPrompt(e.target.value)} />
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

      <audio ref={audioRef} src={audioUrl} muted={isMuted} />
    </div>
  );
};

export default GeneratedMeditation;
