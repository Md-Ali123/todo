'use client';

import { useState, useEffect } from 'react';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';
import { ITodoDocument, TodoFormData } from '@/types/todo';

type FilterType = 'all' | 'incomplete' | 'complete';

export default function Home() {
  const [todos, setTodos] = useState<ITodoDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingTodo, setEditingTodo] = useState<ITodoDocument | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch all todos
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const url = filter !== 'all' ? `/api/todos?status=${filter}` : '/api/todos';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTodos(data.data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      alert('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  // Create new todo
  const handleCreateTodo = async (formData: TodoFormData) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        alert('Todo created successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo');
    }
  };

  // Update existing todo
  const handleUpdateTodo = async (formData: TodoFormData) => {
    if (!editingTodo) return;
    
    try {
      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        setEditingTodo(null);
        alert('Todo updated successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Failed to update todo');
    }
  };

  // Delete todo
  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        alert('Todo deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo');
    }
  };

  // Toggle todo status
  const handleToggleStatus = async (todo: ITodoDocument) => {
    const newStatus = todo.status === 'complete' ? 'incomplete' : 'complete';
    
    try {
      const response = await fetch(`/api/todos/${todo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleEdit = (todo: ITodoDocument) => {
    setEditingTodo(todo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  const filteredTodos = todos;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          📝 My Todo App
        </h1>

        <TodoForm
          onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
          editTodo={editingTodo}
          onCancel={handleCancelEdit}
        />

        <div className="mb-6 flex justify-center gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              filter === 'incomplete'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Incomplete
          </button>
          <button
            onClick={() => setFilter('complete')}
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              filter === 'complete'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading todos...</p>
          </div>
        ) : (
          <TodoList
            todos={filteredTodos}
            onEdit={handleEdit}
            onDelete={handleDeleteTodo}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>
    </main>
  );
}