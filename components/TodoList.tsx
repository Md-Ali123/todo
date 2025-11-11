'use client';

import TodoItem from './TodoItem';
import { ITodoDocument } from '@/types/todo';

interface TodoListProps {
  todos: ITodoDocument[];
  onEdit: (todo: ITodoDocument) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (todo: ITodoDocument) => void;
}

export default function TodoList({ todos, onEdit, onDelete, onToggleStatus }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-lg">No todos yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}