import mongoose, { Schema, Model } from 'mongoose';
import { ITodoDocument } from '@/types/todo';

const TodoSchema = new Schema<ITodoDocument>(
    {
        title: {
            type: String,
            required: [true, 'Please provide a title'],
            trim: true,
            maxLength: [100, 'Title cannot be more than 100 character']
        },
        description: {
            type: String,
            required: [true, 'Please provide a description'],
            trim: true,
            maxilength: [500, 'Description cannot be more than 500 characters'],

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