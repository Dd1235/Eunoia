// src/pages/TodoList.tsx

import { Container } from '../components/Layout/Container';
import { useTodos } from '../hooks/useTodos';
import QuickNote from '../components/TodoList/QuickNote';
import TodoList from '../components/TodoList/TodoList';

const TodoPage = () => {
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo, deleteDoneTodos, reorderTodos, editContent } = useTodos();

  return (
    <Container>
      <div className='mx-auto mt-8 flex max-w-5xl flex-col gap-6 md:flex-row'>
        {/* ─── Left: Todo List ─── */}
        <div className='w-full md:w-2/3'>
          <TodoList
            todos={todos}
            isLoading={isLoading}
            addTodo={addTodo}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            deleteDoneTodos={deleteDoneTodos}
            reorderTodos={reorderTodos}
            editContent={editContent}
          />
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
