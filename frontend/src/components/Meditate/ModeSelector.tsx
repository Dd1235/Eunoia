import { Button } from '../ui/button';

interface Props {
  currentMode: 'preset' | 'generate';
  setMode: (mode: 'preset' | 'generate') => void;
}

const ModeSelector = ({ currentMode, setMode }: Props) => {
  return (
    <div className='flex justify-center gap-4 pb-5'>
      <Button variant={currentMode === 'preset' ? 'default' : 'outline'} onClick={() => setMode('preset')}>
        Use Available Tracks
      </Button>
      <Button variant={currentMode === 'generate' ? 'default' : 'outline'} onClick={() => setMode('generate')}>
        Generate Meditation
      </Button>
    </div>
  );
};

export default ModeSelector;
