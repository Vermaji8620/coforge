/**
 * Mongoose schema and model for application users.
 * Stores user credentials with hashed passwords, roles (e.g. Legal, Ops, Admin),
 * and profile department information for role-based workflows.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  department: string;
  avatarUrl?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "Ops lead" },
    department: { type: String, default: "Legal" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
