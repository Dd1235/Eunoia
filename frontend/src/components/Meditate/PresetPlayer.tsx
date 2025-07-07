import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

const tracks = [
  { label: 'Flowing Focus', src: '/src/assets/Flowing_Focus.mp3' },
  { label: 'Mellow Focus', src: '/src/assets/Mellow_Focus.mp3' },
  { label: 'Rain', src: '/src/assets/rain.mp3' },
  { label: 'Ocean', src: '/src/assets/ocean.mp3' },
];

const PresetPlayer = () => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.load();
      audio.loop = true;
      audio.muted = isMuted;
      if (isPlaying) audio.play();
    }
  }, [trackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className='space-y-4 pb-10'>
      <div className='text-center text-lg font-medium'>{tracks[trackIndex].label}</div>

      <div className='flex justify-center gap-4'>
        <Button onClick={togglePlayPause} size='icon'>
          {isPlaying ? <PauseIcon className='h-6 w-6' /> : <PlayIcon className='h-6 w-6' />}
        </Button>

        <Button
          onClick={() => {
            setIsPlaying(false);
            setTrackIndex((i) => (i + 1) % tracks.length);
          }}
        >
          Switch Track
        </Button>

        <Button onClick={toggleMute} size='icon' variant='ghost'>
          {isMuted ? (
            <SpeakerXMarkIcon className='h-6 w-6 text-gray-700 dark:text-gray-200' />
          ) : (
            <SpeakerWaveIcon className='h-6 w-6 text-gray-700 dark:text-gray-200' />
          )}
        </Button>
      </div>

      <audio ref={audioRef} src={tracks[trackIndex].src} loop />
    </div>
  );
};

export default PresetPlayer;
