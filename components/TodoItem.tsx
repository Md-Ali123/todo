'use client';

import { format } from 'date-fns';
import { ITodoDocument } from '@/types/todo';

interface TodoItemProps {
  todo: ITodoDocument;
  onEdit: (todo: ITodoDocument) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (todo: ITodoDocument) => void;
}

export default function TodoItem({ todo, onEdit, onDelete, onToggleStatus }: TodoItemProps) {
  const isCompleted = todo.status === 'complete';
  const isOverdue = new Date(todo.dueDate) < new Date() && !isCompleted;

  return (
    <div
      className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${
        isCompleted
          ? 'border-green-500'
          : isOverdue
          ? 'border-red-500'
          : 'border-blue-500'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3
          className={`text-xl font-bold ${
            isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
          }`}
        >
          {todo.title}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isCompleted
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {todo.status}
        </span>
      </div>

      <p className={`text-gray-600 mb-3 ${isCompleted ? 'line-through' : ''}`}>
        {todo.description}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">
          📅 Due: {format(new Date(todo.dueDate), 'MMM dd, yyyy')}
        </span>
        {isOverdue && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
            OVERDUE
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggleStatus(todo)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition duration-200 ${
            isCompleted
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
        
        <button
          onClick={() => onEdit(todo)}
          className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition duration-200"
        >
          Edit
        </button>
        
        <button
          onClick={() => onDelete(todo._id)}
          className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}