import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ITodo } from '@/types/todo';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Fetch single todo by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ITodo>>> {
  try {
    await dbConnect();
    const { id } = await params;
    
    const todo = await Todo.findById(id);
    
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

// PUT - Update todo by ID
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ITodo>>> {
  try {
    await dbConnect();
    const { id } = await params;
    
    const body: Partial<ITodo> = await request.json();
    const todo = await Todo.findByIdAndUpdate(
      id,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

// DELETE - Delete todo by ID
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{}>>> {
  try {
    await dbConnect();
    const { id } = await params;
    
    const todo = await Todo.findByIdAndDelete(id);
    
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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}