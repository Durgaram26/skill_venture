import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type {
  InstitutionType,
  SubscriptionPlan,
  VerificationStatus,
} from '@skillventures/shared-types';

const geoSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    address: { type: String },
    geo: { type: geoSchema },
  },
  { _id: false },
);

const ratingSchema = new Schema(
  {
    avg: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const institutionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'college',
        'university',
        'training-institute',
        'edtech',
        'bootcamp-provider',
      ] satisfies InstitutionType[],
      required: true,
    },
    description: { type: String },
    logo: { type: String },
    coverImage: { type: String },
    website: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'] satisfies VerificationStatus[],
      default: 'pending',
      index: true,
    },
    verificationDocs: { type: [String], default: [] },
    location: { type: locationSchema, required: true },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'standard', 'premium'] satisfies SubscriptionPlan[],
      default: 'free',
    },
    subscriptionExpiresAt: { type: Date },
    rating: { type: ratingSchema, default: () => ({ avg: 0, count: 0 }) },
    /** Mock payout profile — bank/UPI for receiving student enrollment net amounts. */
    payoutDetails: {
      method: {
        type: String,
        enum: ['bank', 'upi'],
        default: 'upi',
      },
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true, uppercase: true },
      upiId: { type: String, trim: true },
      /** mock | pending | verified — mock means saved locally only */
      status: {
        type: String,
        enum: ['none', 'mock', 'pending', 'verified'],
        default: 'none',
      },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true },
);

institutionSchema.index({ 'location.geo': '2dsphere' });

export type InstitutionDocument = InferSchemaType<typeof institutionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Institution: Model<InstitutionDocument> =
  mongoose.models.Institution ??
  mongoose.model<InstitutionDocument>('Institution', institutionSchema);
