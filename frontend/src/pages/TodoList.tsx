import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  listeners: any;
  attributes: any;
  transform: any;
  transition: string | undefined;
};

const TodoElement = ({ todo, onToggle, onDelete, listeners, attributes, transform, transition }: TodoElementProps) => {
  return (
    <li
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className='flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900'
    >
      <label className='flex flex-1 items-start gap-3'>
        <span className='mt-1 cursor-grab text-gray-400 dark:text-gray-500'>⋮⋮</span>

        <input
          type='checkbox'
          checked={todo.done}
          onChange={onToggle}
          className='mt-1 h-5 w-5 shrink-0 appearance-none rounded-sm border border-gray-400 bg-white transition-colors checked:border-black checked:bg-black dark:border-gray-500 dark:bg-gray-800 dark:checked:border-white dark:checked:bg-white'
        />
        <span
          className={`break-words text-sm leading-snug ${
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

const SortableTodo = ({ todo, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
  });

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

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo, deleteDoneTodos, reorderTodos } = useTodos();

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
                <ul className='space-y-2'>
                  {todos.map((todo) => (
                    <SortableTodo
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleTodo.mutate(todo)}
                      onDelete={() => deleteTodo.mutate(todo.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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
