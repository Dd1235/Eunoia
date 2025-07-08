import { useSortable } from '@dnd-kit/sortable';
import TodoElement from './TodoElement';
import type { Todo } from '../../types/todo';

interface SortableTodoProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (id: string, newContent: string) => void;
}

const SortableTodo = ({ todo, ...props }: SortableTodoProps) => {
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

export default SortableTodo;
