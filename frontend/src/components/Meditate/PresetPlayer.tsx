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
  const [currentTrack, setCurrentTrack] = useState<number | null>(null); // generics, can be either number of null, and initially it is null
  const [isMuted, setIsMuted] = useState(true);
  const audioRefs = useRef<HTMLAudioElement[]>([]); // persist a mtable element across re renders

  // Pause all on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((a) => a && a.pause());
    };
  }, []);

  const togglePlay = (index: number) => {
    const currentAudio = audioRefs.current[currentTrack ?? -1];
    const newAudio = audioRefs.current[index];

    if (currentTrack === index) {
      newAudio?.pause();
      setCurrentTrack(null);
    } else {
      currentAudio?.pause();
      if (newAudio) {
        newAudio.muted = isMuted;
        newAudio.loop = true;
        newAudio.play();
        setCurrentTrack(index);
      }
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRefs.current.forEach((a) => {
      if (a) a.muted = newMuted;
    });
  };
  return (
    <div className='flex max-h-[100vh] flex-col gap-4 overflow-y-auto p-4'>
      {/* Mute/unmute button */}
      <div className='flex justify-end'>
        <Button onClick={toggleMute} size='icon' variant='ghost'>
          {isMuted ? (
            <SpeakerXMarkIcon className='h-6 w-6 text-gray-700 dark:text-gray-200' />
          ) : (
            <SpeakerWaveIcon className='h-6 w-6 text-gray-700 dark:text-gray-200' />
          )}
        </Button>
      </div>

      {/* Track list */}
      {tracks.map((track, index) => (
        <div
          key={index}
          className='flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800'
        >
          <div className='text-sm font-medium text-gray-800 dark:text-gray-100'>{track.label}</div>
          <Button onClick={() => togglePlay(index)} size='icon'>
            {currentTrack === index ? <PauseIcon className='h-5 w-5' /> : <PlayIcon className='h-5 w-5' />}
          </Button>
          <audio
            ref={(el) => {
              if (el) audioRefs.current[index] = el;
            }}
            src={track.src}
            preload='auto'
            loop
          />
        </div>
      ))}
    </div>
  );
};

export default PresetPlayer;
