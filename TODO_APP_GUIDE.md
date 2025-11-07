# Todo Application - Complete Implementation Guide

## 📋 Project Overview

A full-stack TODO application built with:
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose

### Data Model
- **title**: string (required)
- **description**: string (required)
- **dueDate**: Date (required)
- **status**: enum ['incomplete', 'completed'] (default: 'incomplete')

---

## 🚀 Step 1: Project Setup

### 1.1 Create Next.js Project

```bash
npx create-next-app@latest todo-app
```

**Configuration options:**
- ✅ Would you like to use TypeScript? → **No** (or Yes, if preferred)
- ✅ Would you like to use ESLint? → **Yes**
- ✅ Would you like to use Tailwind CSS? → **Yes**
- ✅ Would you like to use `src/` directory? → **No**
- ✅ Would you like to use App Router? → **Yes**
- ✅ Would you like to customize the default import alias? → **No**

### 1.2 Navigate to Project

```bash
cd todo-app
```

### 1.3 Install Required Dependencies

```bash
npm install mongoose
npm install date-fns
```

### 1.4 Install Dev Dependencies (Optional)

```bash
npm install -D @types/node
```

---

## 📁 Step 2: Project Structure

```
todo-app/
├── app/
│   ├── api/
│   │   └── todos/
│   │       ├── route.js          # GET all, POST new
│   │       └── [id]/
│   │           └── route.js      # GET, PUT, DELETE by ID
│   ├── layout.js
│   └── page.js                   # Main page with UI
├── models/
│   └── Todo.js                   # Mongoose model
├── lib/
│   └── mongodb.js                # Database connection
├── components/
│   ├── TodoForm.js               # Add/Edit form
│   ├── TodoList.js               # List of todos
│   └── TodoItem.js               # Individual todo card
├── .env.local                     # Environment variables
├── package.json
└── README.md
```

---

## 🔧 Step 3: Environment Setup

### 3.1 Create `.env.local` File (Root Directory)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todoapp?retryWrites=true&w=majority
```

**Getting MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account/cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials

---

## 💾 Step 4: Database Configuration

### 4.1 Create `lib/mongodb.js`

```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

**Purpose**: Connection pooling to reuse database connections across API routes.

---

## 📊 Step 5: Database Model

### 5.1 Create `models/Todo.js`

```javascript
import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    status: {
      type: String,
      enum: ['incomplete', 'completed'],
      default: 'incomplete',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
```

---

## 🔌 Step 6: API Routes (Backend)

### 6.1 Create `app/api/todos/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';

// GET - Fetch all todos
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter
    
    let query = {};
    if (status && (status === 'completed' || status === 'incomplete')) {
      query.status = status;
    }
    
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: todos,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}

// POST - Create new todo
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const todo = await Todo.create(body);
    
    return NextResponse.json(
      {
        success: true,
        data: todo,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
```

### 6.2 Create `app/api/todos/[id]/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';

// GET - Fetch single todo by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const todo = await Todo.findById(params.id);
    
    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}

// PUT - Update todo by ID
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const todo = await Todo.findByIdAndUpdate(
      params.id,
      body,
      {
        new: true, // Return updated document
        runValidators: true, // Run model validators
      }
    );
    
    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}

// DELETE - Delete todo by ID
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const todo = await Todo.findByIdAndDelete(params.id);
    
    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {},
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
```

---

## 🎨 Step 7: Frontend Components

### 7.1 Create `components/TodoForm.js`

```javascript
'use client';

import { useState, useEffect } from 'react';

export default function TodoForm({ onSubmit, editTodo, onCancel }) {
  const [formData, setFormData] = useState({
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
        dueDate: editTodo.dueDate ? editTodo.dueDate.split('T')[0] : '',
        status: editTodo.status,
      });
    }
  }, [editTodo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
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
            <option value="completed">Completed</option>
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
```

### 7.2 Create `components/TodoItem.js`

```javascript
'use client';

import { format } from 'date-fns';

export default function TodoItem({ todo, onEdit, onDelete, onToggleStatus }) {
  const isCompleted = todo.status === 'completed';
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
```

### 7.3 Create `components/TodoList.js`

```javascript
'use client';

import TodoItem from './TodoItem';

export default function TodoList({ todos, onEdit, onDelete, onToggleStatus }) {
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
```

---

## 🖥️ Step 8: Main Page (UI Integration)

### 8.1 Update `app/page.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');

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
  const handleCreateTodo = async (formData) => {
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
  const handleUpdateTodo = async (formData) => {
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
  const handleDeleteTodo = async (id) => {
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
  const handleToggleStatus = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'incomplete' : 'completed';
    
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

  const handleEdit = (todo) => {
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
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              filter === 'completed'
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
```

### 8.2 Update `app/layout.js`

```javascript
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Todo App',
  description: 'A simple and beautiful todo application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 🎯 Step 9: Run the Application

### 9.1 Start Development Server

```bash
npm run dev
```

### 9.2 Open in Browser

Navigate to: `http://localhost:3000`

---

## 📝 Step 10: Testing CRUD Operations

### Test Checklist:

1. **CREATE**: ✅ Add a new todo with all fields
2. **READ**: ✅ View all todos on the main page
3. **UPDATE**: 
   - ✅ Edit a todo (click Edit button)
   - ✅ Toggle status (Mark Complete/Incomplete)
4. **DELETE**: ✅ Delete a todo (click Delete button)
5. **FILTER**: ✅ Test All/Incomplete/Completed filters

---

## 🚀 Step 11: Deployment (Optional)

### Deploy to Vercel:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable: `MONGODB_URI`
5. Deploy!

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos (optional: ?status=completed) |
| POST | `/api/todos` | Create new todo |
| GET | `/api/todos/[id]` | Get single todo |
| PUT | `/api/todos/[id]` | Update todo |
| DELETE | `/api/todos/[id]` | Delete todo |

---

## 🎨 Tailwind CSS Classes Used

- **Layout**: `min-h-screen`, `max-w-7xl`, `mx-auto`, `grid`, `flex`
- **Spacing**: `p-{n}`, `m-{n}`, `gap-{n}`
- **Colors**: `bg-blue-500`, `text-white`, `border-gray-300`
- **Effects**: `rounded-lg`, `shadow-md`, `hover:bg-blue-600`
- **Typography**: `text-xl`, `font-bold`, `text-center`

---

## 🔍 Key Features Implemented

✅ Full CRUD operations (Create, Read, Update, Delete)  
✅ Status management (Complete/Incomplete)  
✅ Due date tracking with overdue indicators  
✅ Filter by status (All/Incomplete/Completed)  
✅ Responsive design with Tailwind CSS  
✅ MongoDB integration with Mongoose  
✅ Form validation  
✅ Loading states  
✅ Error handling  
✅ Modern UI/UX  

---

## 💡 Tips for Implementation

1. **Start with backend first**: Create models and API routes
2. **Test APIs**: Use Postman or Thunder Client to test endpoints
3. **Build components incrementally**: Start with TodoForm, then TodoItem, then TodoList
4. **Style progressively**: Get functionality working first, then enhance UI
5. **Handle errors**: Always check for success/failure in API responses

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Solution**: Verify `.env.local` has correct `MONGODB_URI` and restart dev server

### Issue 2: Module not found error
**Solution**: Ensure all imports use correct paths and aliases (`@/` points to root)

### Issue 3: Date not displaying correctly
**Solution**: Check `date-fns` is installed: `npm install date-fns`

### Issue 4: API returning 404
**Solution**: Verify API route files are in correct folder structure

---

## 📖 Additional Enhancements (Optional)

- Add search functionality
- Add priority levels (High/Medium/Low)
- Add categories/tags
- Add user authentication
- Add dark mode
- Add pagination for large todo lists
- Add drag-and-drop reordering
- Add notifications for due dates

---

**Happy Coding! 🎉**
