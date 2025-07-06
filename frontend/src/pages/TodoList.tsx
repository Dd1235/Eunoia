import { useState } from 'react';
import { Container } from '@components/Layout/Container';
import { useTodos } from '@/hooks/useTodos';
import { TrashIcon } from '@heroicons/react/24/outline';

type TodoElementProps = {
  todo: {
    id: string;
    content: string;
    done: boolean;
  };
  onToggle: () => void;
  onDelete: () => void;
};

const TodoElement = ({ todo, onToggle, onDelete }: TodoElementProps) => {
  return (
    <li className='flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
      <label className='flex flex-1 cursor-pointer items-center gap-3'>
        <input
          type='checkbox'
          checked={todo.done}
          onChange={onToggle}
          className='h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-white transition-colors checked:border-black checked:bg-black dark:border-gray-500 dark:bg-gray-800 dark:checked:border-white dark:checked:bg-white'
        />
        <span
          className={`break-words text-sm ${
            todo.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {todo.content}
        </span>
      </label>
      <button
        onClick={onDelete}
        className='text-sm text-red-500 transition-colors hover:text-red-700 dark:hover:text-red-400'
      >
        <TrashIcon className='h-5 w-5' />
      </button>
    </li>
  );
};

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo, deleteDoneTodos } = useTodos();

  const handleAdd = () => {
    const trimmed = newTodo.trim();
    if (trimmed) {
      addTodo.mutate(trimmed);
      setNewTodo('');
    }
  };

  return (
    <Container>
      <div className='mb-6 ml-6 mt-8 max-w-3xl rounded-xl bg-white px-6 py-8 shadow-sm dark:bg-gray-800'>
        <h1 className='mb-2 text-2xl font-semibold text-gray-900 dark:text-white'>Todo List</h1>
        <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>Reflect and stay productive. Add a task below.</p>

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

        <div className='max-h-[60vh] space-y-2 overflow-y-auto pr-2'>
          {isLoading ? (
            <p className='text-sm text-gray-500 dark:text-gray-400'>Loading...</p>
          ) : (
            <ul className='space-y-2'>
              {todos?.map((todo) => (
                <TodoElement
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo.mutate(todo)}
                  onDelete={() => deleteTodo.mutate(todo.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className='mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
          <span>{todos?.filter((t) => !t.done).length ?? 0} remaining</span>
          <button onClick={() => deleteDoneTodos.mutate()} className='hover:underline'>
            Clear Completed
          </button>
        </div>
      </div>
    </Container>
  );
};

export default TodoList;
