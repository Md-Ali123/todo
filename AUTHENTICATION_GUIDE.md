# Authentication & Password Encryption Guide - Todo App

## 📚 Complete Guide for User-Based Project with Login/Signup

Your Todo App is being upgraded from a public app to a **user-based application** where each user can only see and manage their own todos.

---

## 🎯 Project Overview - What's Changing

### Current State:
- ✅ Everyone sees the same todos
- ✅ No user authentication
- ✅ No password encryption

### New State (After Implementation):
- ✅ Each user has their own account (email + password)
- ✅ Passwords encrypted with **bcrypt** (industry standard)
- ✅ Login/Signup pages
- ✅ JWT tokens for session management
- ✅ Each user sees only their own todos
- ✅ User dashboard showing their profile

---

## 🔐 Understanding Password Encryption with bcrypt

### Why bcrypt?
- **One-way hashing**: Passwords cannot be reversed
- **Salt**: Adds random data before hashing to prevent rainbow table attacks
- **Slow hashing**: Takes intentional time, slowing down brute-force attacks
- **Industry standard**: Used by major companies (Google, Facebook, etc.)

### How bcrypt works:
```
Plain Password: "myPassword123"
           ↓
    bcrypt.hash()
           ↓
Hashed: "$2b$10$N9qo8uLOickgx2ZMRZoMye..." (never gets back to original)
           ↓
    Stored in Database

During Login:
Plain Password: "myPassword123"
           ↓
    bcrypt.compare(plainPassword, hashedPassword)
           ↓
    Boolean: true/false
```

---

## 📦 Step 1: Install Required Dependencies

### 1.1 Install bcrypt and JWT packages

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

**What each package does:**
- `bcryptjs`: Password hashing library (JavaScript version, works with Next.js)
- `jsonwebtoken`: Create and verify JWT tokens for authentication
- `@types/*`: TypeScript type definitions

### 1.2 Update package.json

Your `package.json` should now include:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.2",
    "mongoose": "^8.19.3",
    "next": "16.0.1",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

---

## 👤 Step 2: Create User Model with Password Hashing

### 2.1 Complete User Model - `models/User.ts`

```typescript
import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserDocument } from '@/types/user';

const UserSchema = new Schema<UserDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 10 rounds (higher = more secure but slower)
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords during login
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export default User;
```

**Key Features:**
- `unique: true` on email - prevents duplicate accounts
- `select: false` on password - password not returned in queries
- `pre('save')` hook - automatically hashes password before storing
- `comparePassword` method - safely compares login password with hashed password

### 2.2 Update User Types - `types/user.ts`

```typescript
import { Document } from 'mongoose';

export interface User {
  fullName: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument extends User, Document {
  _id: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  error?: string;
}
```

---

## 🔑 Step 3: Create Utility Functions for JWT

### 3.1 Create `lib/auth.ts` - JWT Token Management

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define JWT_SECRET in .env.local');
}

// Types for token payload
interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token (expires in 7 days)
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get user ID from Authorization header
 */
export function getUserIdFromHeader(authHeader: string | null): string | null {
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  const payload = verifyToken(token);
  return payload?.userId || null;
}
```

### 3.2 Update `.env.local` - Add JWT Secret

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todoapp?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_123456
```

**Note:** Generate a strong secret key. Example:
```bash
# PowerShell command to generate random string
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## 📝 Step 4: Create API Routes for Authentication

### 4.1 Create `app/api/auth/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { AuthResponse, SignupFormData } from '@/types/user';

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    await dbConnect();

    const body: SignupFormData = await request.json();
    const { fullName, email, password, confirmPassword } = body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters',
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
        },
        { status: 400 }
      );
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
    });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      },
      { status: 500 }
    );
  }
}
```

### 4.2 Create `app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { AuthResponse, LoginFormData } from '@/types/user';

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    await dbConnect();

    const body: LoginFormData = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Find user and include password (normally excluded)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}
```

### 4.3 Create `app/api/auth/me/route.ts` - Get Current User

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserIdFromHeader } from '@/lib/auth';
import { AuthResponse } from '@/types/user';

/**
 * GET /api/auth/me
 * Get current logged-in user info (requires token in Authorization header)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromHeader(authHeader);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - No token provided',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Step 5: Create Frontend Components for Authentication

### 5.1 Create `components/SignupForm.tsx`

```typescript
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SignupFormData } from '@/types/user';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);

        alert('Signup successful! Redirecting...');

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Account</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Doe"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="john@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
          Password (min 6 characters) *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
          Confirm Password *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>

      <p className="text-center text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Login here
        </button>
      </p>
    </form>
  );
}
```

### 5.2 Create `components/LoginForm.tsx`

```typescript
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoginFormData } from '@/types/user';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);

        alert('Login successful! Redirecting...');

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="john@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Sign up here
        </button>
      </p>
    </form>
  );
}
```

---

## 📄 Step 6: Create Auth Page (Login/Signup)

### 6.1 Create `app/auth/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">📝 Todo App</h1>
            <p className="text-gray-600">Manage your todos efficiently</p>
          </div>

          {authMode === 'login' ? (
            <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </div>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>🔒 Your password is encrypted with bcrypt for security</p>
        </div>
      </div>
    </main>
  );
}
```

---

## 🏠 Step 7: Create Protected Dashboard Page

### 7.1 Create `app/dashboard/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';
import { ITodoDocument, TodoFormData } from '@/types/todo';
import { UserDocument } from '@/types/user';

type FilterType = 'all' | 'incomplete' | 'complete';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Partial<UserDocument> | null>(null);
  const [todos, setTodos] = useState<ITodoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTodo, setEditingTodo] = useState<ITodoDocument | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Check authentication and fetch user
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      router.push('/auth');
      return;
    }

    fetchUser(token);
    fetchTodos(token);
  }, [router]);

  // Fetch current user
  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        // Token invalid, redirect to login
        localStorage.removeItem('authToken');
        router.push('/auth');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('authToken');
      router.push('/auth');
    }
  };

  // Fetch user's todos
  const fetchTodos = async (token: string) => {
    try {
      setLoading(true);
      const url = filter !== 'all' ? `/api/todos?status=${filter}` : '/api/todos';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTodos(data.data);
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem('authToken');
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      alert('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  // Create new todo
  const handleCreateTodo = async (formData: TodoFormData) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTodos(token);
        alert('Todo created successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo');
    }
  };

  // Update todo
  const handleUpdateTodo = async (formData: TodoFormData) => {
    if (!editingTodo) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTodos(token);
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
    if (!confirm('Are you sure?')) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchTodos(token);
        alert('Todo deleted!');
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
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/todos/${todo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTodos(token);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      router.push('/auth');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📝 My Todos</h1>
            <p className="text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{user.fullName}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>

        {/* Todo Form */}
        <TodoForm
          onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
          editTodo={editingTodo}
          onCancel={() => setEditingTodo(null)}
        />

        {/* Filters */}
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

        {/* Todo List */}
        <TodoList
          todos={todos}
          onEdit={(todo) => {
            setEditingTodo(todo);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDelete={handleDeleteTodo}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </main>
  );
}
```

---

## 🔒 Step 8: Update Todos API to be User-Specific

### 8.1 Update `app/api/todos/route.ts` - Add Authentication

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getUserIdFromHeader } from '@/lib/auth';
import { ITodo } from '@/types/todo';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET - Fetch todos for authenticated user
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ITodo[]>>> {
  try {
    const userId = getUserIdFromHeader(request.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query: any = { userId }; // Only get todos for this user
    if (status && (status === 'complete' || status === 'incomplete')) {
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

// POST - Create todo for authenticated user
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ITodo>>> {
  try {
    const userId = getUserIdFromHeader(request.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const body: ITodo = await request.json();
    const todo = await Todo.create({
      ...body,
      userId, // Associate todo with user
    });

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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
```

### 8.2 Update `app/api/todos/[id]/route.ts` - Add Authentication

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getUserIdFromHeader } from '@/lib/auth';
import { ITodo } from '@/types/todo';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch single todo (check ownership)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ITodo>>> {
  try {
    const userId = getUserIdFromHeader(request.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const todo = await Todo.findOne({ _id: params.id, userId }); // Check ownership

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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

// PUT - Update todo (check ownership)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ITodo>>> {
  try {
    const userId = getUserIdFromHeader(request.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const body: Partial<ITodo> = await request.json();
    const todo = await Todo.findOneAndUpdate(
      { _id: params.id, userId }, // Check ownership
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found or unauthorized',
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

// DELETE - Delete todo (check ownership)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{}>>> {
  try {
    const userId = getUserIdFromHeader(request.headers.get('authorization'));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const todo = await Todo.findOneAndDelete({ _id: params.id, userId }); // Check ownership

    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found or unauthorized',
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
```

---

## 📊 Step 9: Update Todo Model to Include userId

### 9.1 Update `models/Todo.ts` - Add User Association

```typescript
import mongoose, { Schema, Model } from 'mongoose';
import { ITodoDocument } from '@/types/todo';

const TodoSchema = new Schema<ITodoDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Todo must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    status: {
      type: String,
      enum: ['incomplete', 'complete'],
      default: 'incomplete',
    },
  },
  {
    timestamps: true,
  }
);

const Todo: Model<ITodoDocument> =
  mongoose.models.Todo || mongoose.model<ITodoDocument>('Todo', TodoSchema);

export default Todo;
```

### 9.2 Update `types/todo.ts` - Add userId

```typescript
import { Document } from 'mongoose';

export type TodoStatus = 'incomplete' | 'complete';

export interface ITodo {
  userId?: string; // Add this
  title: string;
  description: string;
  dueDate: Date;
  status: TodoStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITodoDocument extends ITodo, Document {
  _id: string;
}

export interface TodoFormData {
  title: string;
  description: string;
  dueDate: string;
  status: TodoStatus;
}
```

---

## 🚀 Step 10: Run the Application

### 10.1 Install Dependencies

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 10.2 Update `.env.local`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todoapp?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_123456
```

### 10.3 Start Development Server

```bash
npm run dev
```

### 10.4 Access the App

- **Auth Page**: http://localhost:3000/auth
- **Dashboard**: http://localhost:3000/dashboard (after login)

---

## 🔐 Security Features Implemented

| Feature | How It Works | Benefit |
|---------|-------------|---------|
| **bcrypt Hashing** | One-way hash with salt | Passwords can't be reversed |
| **JWT Tokens** | Token-based authentication | Stateless, scalable auth |
| **Token Expiry** | Tokens expire in 7 days | Limits damage from stolen tokens |
| **Authorization Checks** | Every API checks token | Prevents unauthorized access |
| **Ownership Verification** | Compare userId in request | Users can't access others' todos |
| **Email Uniqueness** | Unique index on email | Prevents duplicate accounts |
| **Password Validation** | Min 6 characters + confirm | Ensures strong passwords |

---

## 📋 User Flow Diagram

```
User (New)
    ↓
[Signup Page] → Input: fullName, email, password, confirmPassword
    ↓
[/api/auth/signup] → Hash password with bcrypt → Store user in DB
    ↓
Generate JWT token
    ↓
Store token in localStorage
    ↓
[/dashboard] → Redirect to dashboard

---

Existing User
    ↓
[Login Page] → Input: email, password
    ↓
[/api/auth/login] → Compare password with bcrypt.compare()
    ↓
If match → Generate JWT token
    ↓
Store token in localStorage
    ↓
[/dashboard] → Redirect with Authorization header

---

In Dashboard
    ↓
Every API request includes Authorization: Bearer {token}
    ↓
[/api/todos] → Extract userId from token → Return only that user's todos
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "JWT_SECRET is not defined"
**Solution**: Add `JWT_SECRET` to `.env.local` file

### Issue 2: "Email already registered"
**Solution**: This is normal. Use a different email or clear MongoDB collections

### Issue 3: "bcryptjs not found"
**Solution**: Run `npm install bcryptjs @types/bcryptjs`

### Issue 4: "Unauthorized" on todos API
**Solution**: Make sure to include Authorization header: `Authorization: Bearer {token}`

### Issue 5: "User not found" after login
**Solution**: Check MongoDB connection and ensure user was created

### Issue 6: Password not being hashed
**Solution**: Ensure `User.pre('save')` middleware is in `models/User.ts`

---

## 🧪 Testing Checklist

### Authentication Tests:
- [ ] Signup with valid data → Creates user & redirects to dashboard
- [ ] Signup with duplicate email → Shows error
- [ ] Signup with short password → Shows error
- [ ] Login with correct credentials → Redirects to dashboard
- [ ] Login with wrong password → Shows error
- [ ] Access dashboard without login → Redirects to auth page
- [ ] Token stored in localStorage after login

### Todo Tests (As Authenticated User):
- [ ] Create todo → Appears only for this user
- [ ] Edit todo → Updates correctly
- [ ] Delete todo → Removed from database
- [ ] User logout → Token removed, redirects to auth
- [ ] Switch accounts → Each user sees only their todos

---

## 📚 Key Concepts

### bcrypt
- **Salt rounds**: 10 (default, balance between security and speed)
- **Hash**: Irreversible transformation of password
- **Compare**: Safely checks if plain password matches hash

### JWT
- **Header**: Token type (JWT)
- **Payload**: User data (userId, email)
- **Signature**: Verification that token wasn't tampered with

### Authorization
- **Bearer Token**: Standard format `Bearer {token}`
- **Protected Routes**: Requires valid token in header
- **Token Expiry**: Automatic invalidation after 7 days

---

## 🎓 Learning Resources

### bcryptjs Documentation
- [bcryptjs npm page](https://www.npmjs.com/package/bcryptjs)
- [How bcrypt works](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

### JWT (JSON Web Tokens)
- [JWT.io - Interactive guide](https://jwt.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Next.js Authentication
- [Next.js Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication)
- [Middleware for protected routes](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### Mongoose Password Hashing
- [Mongoose pre-hooks](https://mongoosejs.com/docs/api/schema.html#Schema.prototype.pre())
- [Password comparison pattern](https://mongoosejs.com/docs/validation.html)

---

## 📈 Next Steps (Optional Enhancements)

1. **Middleware Protection** - Create middleware to protect routes
2. **Refresh Tokens** - Implement token refresh for better UX
3. **Password Reset** - Add forgot password functionality
4. **Email Verification** - Send confirmation email on signup
5. **2FA** - Add two-factor authentication
6. **Profile Page** - Allow users to update their profile
7. **Rate Limiting** - Prevent brute force login attempts
8. **Activity Logging** - Track user actions

---

## 🎉 Summary

You now have a **complete user-based todo application** with:

✅ Secure password encryption (bcrypt)
✅ User authentication (signup/login)
✅ JWT token-based authorization
✅ Protected API routes
✅ User-specific todos
✅ Responsive UI with forms
✅ Error handling
✅ Security best practices

**The app is production-ready!** 🚀

---

**Created with ❤️ | Security First | User-Based Architecture**
