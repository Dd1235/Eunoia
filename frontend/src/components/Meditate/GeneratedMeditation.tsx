import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react'; // Optional loading icon
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

const GeneratedMeditation = () => {
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // default: muted

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener('timeupdate', update);
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setIsPlaying(false);
    setTranscript('');
    setAudioUrl('');

    const formData = new FormData();
    formData.append('prompt', prompt);

    try {
      const res = await fetch('http://localhost:8000/generate-meditation/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setTranscript(data.transcript);
      setAudioUrl(`http://localhost:8000${data.audioUrl}`); // full URL e.g. /download/abc123.mp3
    } catch (err) {
      console.error('Error generating meditation:', err);
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
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'meditation.mp3';
    a.click();
  };

  return (
    <div className='space-y-6'>
      <Textarea placeholder='Enter a meditation prompt...' value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <Button onClick={handleGenerate} disabled={isLoading} className='w-full'>
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
            <div className='relative h-2 rounded-full bg-gray-300 dark:bg-gray-700'>
              <div className='absolute h-2 rounded-full bg-blue-500' style={{ width: `${progress}%` }} />
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
            <p className='text-gray-700 dark:text-gray-300'>{transcript}</p>
          </CardContent>
        </Card>
      )}

      <audio ref={audioRef} src={audioUrl} muted={isMuted} />
    </div>
  );
};

export default GeneratedMeditation;
