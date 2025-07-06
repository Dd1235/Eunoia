import { useState } from 'react';
import { Container } from '@components/Layout/Container';
import { useAuth } from '@/context/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';

type Todo = {
  text: string;
  checked: boolean;
};

const TodoElement = ({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) => {
  return (
    <li className='flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
      <label className='flex flex-1 cursor-pointer items-center gap-3'>
        <input
          type='checkbox'
          checked={todo.checked}
          onChange={onToggle}
          className='h-5 w-5 appearance-none rounded-sm border border-gray-400 bg-white transition-colors checked:border-black checked:bg-black dark:border-gray-500 dark:bg-gray-800 dark:checked:border-white dark:checked:bg-white'
        />
        <span
          className={`break-words text-sm ${
            todo.checked ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {todo.text}
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
  const [todos, setTodos] = useState<Todo[]>([
    { text: 'Build a full-featured Todo App with Eunoia styling', checked: false },
    { text: 'Explore TypeScript', checked: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    const trimmed = newTodo.trim();
    if (trimmed) {
      setTodos([{ text: trimmed, checked: false }, ...todos]);
      setNewTodo('');
    }
  };

  const toggleTodo = (index: number) => {
    const updated = [...todos];
    updated[index].checked = !updated[index].checked;
    setTodos(updated);
  };

  const deleteTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <Container>
      <div className='ml-6 mt-8 max-w-3xl rounded-xl bg-white px-6 py-8 shadow-sm dark:bg-gray-800'>
        <h1 className='mb-2 text-2xl font-semibold text-gray-900 dark:text-white'>Todo List</h1>
        <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>Reflect and stay productive. Add a task below.</p>

        <div className='mb-6 flex items-center gap-2'>
          <input
            type='text'
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder='New todo...'
            className='flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-white'
          />
          <button
            onClick={addTodo}
            className='rounded-md bg-black px-3 py-2 text-sm text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
          >
            +
          </button>
        </div>

        <div className='max-h-64 space-y-2 overflow-y-auto pr-2'>
          <ul className='space-y-2'>
            {todos.map((todo, index) => (
              <TodoElement
                key={index}
                todo={todo}
                onToggle={() => toggleTodo(index)}
                onDelete={() => deleteTodo(index)}
              />
            ))}
          </ul>
        </div>

        <p className='mt-6 text-xs italic text-gray-500 dark:text-gray-400'>All tasks are local for now.</p>
      </div>
    </Container>
  );
};

export default TodoList;
