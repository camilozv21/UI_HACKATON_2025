import mongoose, { Schema, Document } from 'mongoose';

interface User extends Document {
  email: string;
  password: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false }
});

export default mongoose.models.User || mongoose.model<User>('User', UserSchema, 'users');