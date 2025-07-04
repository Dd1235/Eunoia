import { useEffect, useRef, useState } from 'react';

const tracks = [
  { label: 'Track 1', src: '/src/assets/Flowing_Focus.mp3' },
  { label: 'Track 2', src: '/src/assets/Mellow_Focus.mp3' },
];

const Player = (): JSX.Element => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    audio.muted = isMuted;
    audio.loop = true;

    if (isPlaying) {
      audio
        .play()
        .then(() => {})
        .catch(console.error);
    } else {
      audio.pause();
    }
  }, [currentTrackIndex, isPlaying, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }

    setIsPlaying(!isPlaying);
  };

  const switchTrack = () => {
    setIsPlaying(false); // Stop current track
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className='flex w-80 flex-col items-center gap-4 rounded-2xl bg-white p-4 shadow-xl'>
      <h2 className='text-center text-lg font-semibold'>{tracks[currentTrackIndex].label}</h2>

      <div className='flex gap-3'>
        <button
          onClick={togglePlayPause}
          className='rounded-xl bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600'
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={switchTrack}
          className='rounded-xl bg-gray-300 px-4 py-2 text-black transition hover:bg-gray-400'
        >
          Switch
        </button>

        <button onClick={toggleMute} className='rounded-xl bg-red-500 px-4 py-2 text-white transition hover:bg-red-600'>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} loop>
        <source src={tracks[currentTrackIndex].src} type='audio/mp3' />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default Player;
