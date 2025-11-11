import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ITodo } from '@/types/todo';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<ITodo[]>>> {
    try {
        await dbConnect();

        const todos = await Todo.find({}).sort({ createdAt: -1 });

        return NextResponse.json(
            {
                success: true,
                data: todos,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ITodo>>> {
    try {
        await dbConnect();

        const body: ITodo = await request.json();
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
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 400 }
        );
    }
}
