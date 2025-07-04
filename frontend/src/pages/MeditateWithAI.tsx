import { useState } from 'react';
import { Container } from '../components/Layout/Container';
import ModeSelector from '../components/Meditate/ModeSelector';
import PresetPlayer from '../components/Meditate/PresetPlayer';
import GeneratedMeditation from '../components/Meditate/GeneratedMeditation';

const MeditateWithAI = () => {
  const [mode, setMode] = useState<'preset' | 'generate'>('preset');

  return (
    <Container className='max-w-3xl space-y-8 pt-24'>
      <div className='space-y-2'>
        {/* <h1 className='pt-10 text-4xl font-bold text-gray-900 dark:text-gray-100'>Meditate With AI</h1> */}
        <p className='pb-5 pt-10 text-center text-gray-600 dark:text-gray-400'>
          Choose a calming background or generate a personalized meditation.
        </p>
      </div>

      <ModeSelector currentMode={mode} setMode={setMode} />

      {mode === 'preset' ? <PresetPlayer /> : <GeneratedMeditation />}
    </Container>
  );
};

export default MeditateWithAI;
