import mongoose, { Schema, Model } from "mongoose";
import bcrypt from 'bcryptjs';
import { UserDocument } from "@/types/user";

const UserSchema = new Schema<UserDocument>(
    {
        fullName: {
            type: String,
            required: [true, 'Please provide your full name'],
            trim: true,
            minlength: [3, 'Name must be atleast 3 characters'],
            maxLength: [50, 'Name cannot exceed 50 characters']
            },

            email : {
                type: String,
                required: [true,'Please provide an email'],
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
                minlength:[6, 'Password must be atleast 6 characters'],
                select: false,
            },

        },
        {
            timestamps: true,
        }    
);

UserSchema.pre('save',async function (next){
    if (!this.isModified('password')){
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<UserDocument> =
    mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
export default User;