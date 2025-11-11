'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { TodoFormData, ITodoDocument } from '@/types/todo';

interface TodoFormProps {
  onSubmit: (formData: TodoFormData) => void;
  editTodo: ITodoDocument | null;
  onCancel: () => void;
}

export default function TodoForm({ onSubmit, editTodo, onCancel }: TodoFormProps) {
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    dueDate: '',
    status: 'incomplete',
  });

  useEffect(() => {
    if (editTodo) {
      setFormData({
        title: editTodo.title,
        description: editTodo.description,
        dueDate: editTodo.dueDate ? editTodo.dueDate.toString().split('T')[0] : '',
        status: editTodo.status,
      });
    }
  }, [editTodo]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
    if (!editTodo) {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        status: 'incomplete',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {editTodo ? 'Edit Todo' : 'Add New Todo'}
      </h2>
      
      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter todo title"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          maxLength={500}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter todo description"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-gray-700 font-medium mb-2">
          Due Date *
        </label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {editTodo && (
        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="incomplete">Incomplete</option>
            <option value="complete">Completed</option>
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
        >
          {editTodo ? 'Update Todo' : 'Add Todo'}
        </button>
        
        {editTodo && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg transition duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}