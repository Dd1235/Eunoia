import { useState, useEffect } from 'react';
import { useFreeNote } from '../../hooks/useFreeNote';
import { CheckIcon } from '@heroicons/react/24/outline';

const QuickNote = () => {
  const { note, isLoading, updateNote } = useFreeNote();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (note) setDraft(note.content);
  }, [note]);

  const handleSave = () => {
    if (note && draft.trim() !== note.content) {
      updateNote.mutate(draft.trim());
    }
    setEditing(false);
  };

  return (
    <div className='h-1/3 min-h-[240px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
      <h2 className='mb-2 pt-2 text-sm font-medium text-gray-600 dark:text-gray-400'>Quick Note</h2>

      {editing ? (
        <div className='flex h-full flex-col gap-2'>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder='Type your thoughts...'
            className='w-full resize-none rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-white'
          />
          <button
            onClick={handleSave}
            className='self-end rounded-md bg-black px-2 py-1 text-xs text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
            title='Save note'
          >
            <CheckIcon className='h-4 w-4' />
          </button>
        </div>
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className='min-h-[96px] cursor-text overflow-y-auto rounded-md border border-dashed border-gray-300 p-2 text-sm text-gray-800 dark:border-gray-600 dark:text-gray-300'
        >
          {isLoading ? 'Loading note...' : note?.content || 'Double-click to write a note.'}
        </div>
      )}
    </div>
  );
};

export default QuickNote;
