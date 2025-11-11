import { Document} from 'mongoose';
export type TodoStatus = 'incomplete' | 'complete';

export interface ITodo {
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
