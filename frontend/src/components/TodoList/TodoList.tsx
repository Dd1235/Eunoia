import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableTodo from './SortableTodo';
import type { Todo } from '../../types/todo';
import { useState } from 'react';

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  addTodo: { mutate: (content: string) => void };
  toggleTodo: { mutate: (todo: Todo) => void };
  deleteTodo: { mutate: (id: string) => void };
  deleteDoneTodos: { mutate: () => void };
  reorderTodos: { mutate: (ordered: Todo[]) => void };
  editContent: { mutate: (args: { id: string; content: string }) => void };
}

const TodoList = ({
  todos,
  isLoading,
  addTodo,
  toggleTodo,
  deleteTodo,
  deleteDoneTodos,
  reorderTodos,
  editContent,
}: TodoListProps) => {
  const [newTodo, setNewTodo] = useState('');
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
    <div className='rounded-xl bg-white px-6 py-8 shadow-sm dark:bg-gray-800'>
      <h1 className='mb-2 text-2xl font-semibold text-gray-900 dark:text-white'>Todo List</h1>
      <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>Reflect and stay productive. Add a task below.</p>

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
  );
};

export default TodoList;
