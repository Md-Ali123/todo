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
    comparePassword(candidatePassword: string ): Promise<boolean>;
}

export interface SignupFormData{
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
}