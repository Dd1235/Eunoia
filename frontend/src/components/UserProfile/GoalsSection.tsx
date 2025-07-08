import { Button } from '../ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { Goal } from '../../types/user';

interface GoalsSectionProps {
  longGoals: any;
  shortGoals: any;
  newLongGoal: string;
  setNewLongGoal: (v: string) => void;
  newShortGoal: string;
  setNewShortGoal: (v: string) => void;
}

const GoalsSection = ({
  longGoals,
  shortGoals,
  newLongGoal,
  setNewLongGoal,
  newShortGoal,
  setNewShortGoal,
}: GoalsSectionProps) => (
  <div className='mb-10 flex flex-col gap-6 md:flex-row'>
    {/* Long Term Goals */}
    <section className='flex-1'>
      <h2 className='mb-2 text-xl font-semibold'>Long Term Goals</h2>
      <div className='mb-4 flex gap-2'>
        <input
          className='flex-1 rounded border px-2 py-1'
          placeholder='Add a long term goal...'
          value={newLongGoal}
          onChange={(e) => setNewLongGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLongGoal.trim()) {
              longGoals.addGoal(newLongGoal.trim());
              setNewLongGoal('');
            }
          }}
        />
        <Button
          onClick={async () => {
            if (newLongGoal.trim()) {
              await longGoals.addGoal(newLongGoal.trim());
              setNewLongGoal('');
            }
          }}
          disabled={!newLongGoal.trim()}
        >
          Add
        </Button>
      </div>
      {longGoals.isLoading ? (
        <div>Loading...</div>
      ) : longGoals.goals.length === 0 ? (
        <div className='text-gray-500'>No long term goals yet.</div>
      ) : (
        <ul className='space-y-2'>
          {longGoals.goals.map((goal: Goal) => (
            <li key={goal.id} className='flex items-center gap-2'>
              <span className='flex-1'>{goal.goal}</span>
              <Button variant='destructive' size='sm' onClick={() => longGoals.deleteGoal(goal.id)}>
                <TrashIcon className='h-4 w-4' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
    {/* Short Term Goals */}
    <section className='flex-1'>
      <h2 className='mb-2 text-xl font-semibold'>Short Term Goals</h2>
      <div className='mb-4 flex gap-2'>
        <input
          className='flex-1 rounded border px-2 py-1'
          placeholder='Add a short term goal...'
          value={newShortGoal}
          onChange={(e) => setNewShortGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newShortGoal.trim()) {
              shortGoals.addGoal(newShortGoal.trim());
              setNewShortGoal('');
            }
          }}
        />
        <Button
          onClick={async () => {
            if (newShortGoal.trim()) {
              await shortGoals.addGoal(newShortGoal.trim());
              setNewShortGoal('');
            }
          }}
          disabled={!newShortGoal.trim()}
        >
          Add
        </Button>
      </div>
      {shortGoals.isLoading ? (
        <div>Loading...</div>
      ) : shortGoals.goals.length === 0 ? (
        <div className='text-gray-500'>No short term goals yet.</div>
      ) : (
        <ul className='space-y-2'>
          {shortGoals.goals.map((goal: Goal) => (
            <li key={goal.id} className='flex items-center gap-2'>
              <span className='flex-1'>{goal.goal}</span>
              <Button variant='destructive' size='sm' onClick={() => shortGoals.deleteGoal(goal.id)}>
                <TrashIcon className='h-4 w-4' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

export default GoalsSection;
