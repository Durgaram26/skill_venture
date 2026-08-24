import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type { AuthProvider, UserRole } from '@skillventures/shared-types';

const userProfileSchema = new Schema(
  {
    avatar: { type: String },
    emojiTag: { type: String, trim: true, maxlength: 8 },
    about: { type: String, trim: true, maxlength: 500 },
    city: { type: String },
    currentEducationLevel: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['student', 'institution', 'admin', 'super_admin'] satisfies UserRole[],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    authProvider: {
      type: String,
      enum: ['local', 'google'] satisfies AuthProvider[],
      default: 'local',
    },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    profile: { type: userProfileSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', userSchema);
