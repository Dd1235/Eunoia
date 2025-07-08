// src/pages/TodoList.tsx

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Container } from '@components/Layout/Container';
import { useTodos } from '@/hooks/useTodos';
import { useFreeNote } from '@hooks/useFreeNote';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

/* ───────────────────────────────────── Todo Row ───────────────────────────────────── */
const TodoElement = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  listeners,
  attributes,
  transform,
  transition,
}: {
  todo: { id: string; content: string; done: boolean };
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (id: string, newContent: string) => void;
  listeners: any;
  attributes: any;
  transform: any;
  transition: string | undefined;
}) => {
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

/* ─────────────────────────────── Sortable Wrapper ─────────────────────────────── */
const SortableTodo = ({ todo, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

  return (
    <div ref={setNodeRef}>
      <TodoElement
        {...props}
        todo={todo}
        attributes={attributes}
        listeners={listeners}
        transform={transform}
        transition={transition}
      />
    </div>
  );
};

/* ───────────────────────────────── Quick Note ───────────────────────────────── */
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
    <div className='h-1/3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
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

/* ─────────────────────────────────── Page ─────────────────────────────────── */
const TodoPage = () => {
  const [newTodo, setNewTodo] = useState('');
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo, deleteDoneTodos, reorderTodos, editContent } = useTodos();

  const sensors = useSensors(useSensor(PointerSensor));

  const handleAdd = () => {
    const trimmed = newTodo.trim();
    if (trimmed) {
      addTodo.mutate(trimmed);
      setNewTodo('');
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(todos, oldIndex, newIndex);

    reorderTodos.mutate(newOrder);
  };

  return (
    <Container>
      <div className='mx-auto mt-8 flex max-w-5xl flex-col gap-6 md:flex-row'>
        {/* ─── Left: Todo List ─── */}
        <div className='w-full md:w-2/3'>
          <div className='rounded-xl bg-white px-6 py-8 shadow-sm dark:bg-gray-800'>
            <h1 className='mb-2 text-2xl font-semibold text-gray-900 dark:text-white'>Todo List</h1>
            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
              Reflect and stay productive. Add a task below.
            </p>

            {/* Add form */}
            <div className='mb-6 flex items-center gap-2'>
              <input
                type='text'
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder='New todo...'
                className='flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-white'
              />
              <button
                onClick={handleAdd}
                className='rounded-md bg-black px-3 py-2 text-sm text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
              >
                +
              </button>
            </div>

            {/* List */}
            <div className='max-h-[60vh] space-y-2 overflow-y-auto pr-2'>
              {isLoading ? (
                <p className='text-sm text-gray-500 dark:text-gray-400'>Loading...</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <ul className='space-y-2'>
                      {todos.map((todo) => (
                        <SortableTodo
                          key={todo.id}
                          todo={todo}
                          onToggle={() => toggleTodo.mutate(todo)}
                          onDelete={() => deleteTodo.mutate(todo.id)}
                          onEdit={(id, content) => editContent.mutate({ id, content })}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Footer */}
            <div className='mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
              <span>{todos.filter((t) => !t.done).length} remaining</span>
              <button onClick={() => deleteDoneTodos.mutate()} className='hover:underline'>
                Clear Completed
              </button>
            </div>
          </div>
        </div>

        {/* ─── Right: Quick Note ─── */}
        <div className='w-full md:w-1/3'>
          <QuickNote />
        </div>
      </div>
    </Container>
  );
};

export default TodoPage;
