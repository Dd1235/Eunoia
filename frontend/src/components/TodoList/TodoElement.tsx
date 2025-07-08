import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CSS } from '@dnd-kit/utilities';
import type { Todo } from '../../types/todo';

interface TodoElementProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (id: string, newContent: string) => void;
  listeners: any;
  attributes: any;
  transform: any;
  transition: string | undefined;
}

const TodoElement = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  listeners,
  attributes,
  transform,
  transition,
}: TodoElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(todo.content);

  const handleDoubleClick = () => {
    if (!todo.done) setIsEditing(true);
  };

  const handleSave = () => {
    if (editedContent.trim() && editedContent.trim() !== todo.content) {
      onEdit(todo.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <li
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className='flex items-center gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900'
    >
      <span className='mt-1 cursor-grab select-none text-gray-400 dark:text-gray-500'>⋮⋮</span>

      <label className='flex items-center gap-3'>
        <input
          type='checkbox'
          checked={todo.done}
          onChange={onToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className='mt-1 h-5 w-5 shrink-0 appearance-none rounded-sm border border-gray-400 bg-white transition-colors checked:border-black checked:bg-black dark:border-gray-500 dark:bg-gray-800 dark:checked:border-white dark:checked:bg-white'
        />
      </label>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={handleSave}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className='flex-1 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-white'
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex-1 break-words text-sm leading-snug ${
            todo.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {todo.content}
        </span>
      )}

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        className='text-sm text-red-500 transition-colors hover:text-red-700 dark:hover:text-red-400'
      >
        <TrashIcon className='h-5 w-5' />
      </button>
    </li>
  );
};

export default TodoElement;
