import { Document } from "mongoose";

export interface User{
    fullName: string,
    email: string,
    password: string,
    createdAt?: Date,
    updatedAt: Date
}

export interface UserDocument extends User, Document {
    _id: string;
}