import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type {
  DurationUnit,
  ListingMode,
  ListingStatus,
  ListingType,
} from '@skillventures/shared-types';

const feeSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    isFree: { type: Boolean, default: false },
  },
  { _id: false },
);

const durationSchema = new Schema(
  {
    value: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'hours'] satisfies DurationUnit[],
      required: true,
    },
  },
  { _id: false },
);

const curriculumItemSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
  },
  { _id: false },
);

const bootcampFieldsSchema = new Schema(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    sessionMode: { type: String },
    seatsAvailable: { type: Number, min: 0 },
  },
  { _id: false },
);

const hackathonFieldsSchema = new Schema(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    prizePool: { type: Number, min: 0 },
    teamSizeMax: { type: Number, min: 1 },
    sponsors: { type: [String], default: [] },
  },
  { _id: false },
);

const statsSchema = new Schema(
  {
    views: { type: Number, default: 0, min: 0 },
    enquiries: { type: Number, default: 0, min: 0 },
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

const listingLocationSchema = new Schema(
  {
    city: { type: String },
    state: { type: String },
    address: { type: String },
  },
  { _id: false },
);

const listingSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['course', 'bootcamp', 'hackathon'] satisfies ListingType[],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    fee: { type: feeSchema, required: true },
    duration: { type: durationSchema, required: true },
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'] satisfies ListingMode[],
      required: true,
      index: true,
    },
    location: { type: listingLocationSchema },
    eligibility: { type: String },
    curriculum: { type: [curriculumItemSchema], default: [] },
    placementSupport: { type: Boolean, default: false },
    certificateProvided: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'published',
        'paused',
        'rejected',
      ] satisfies ListingStatus[],
      default: 'draft',
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    bootcamp: { type: bootcampFieldsSchema },
    hackathon: { type: hackathonFieldsSchema },
    stats: { type: statsSchema, default: () => ({ views: 0, enquiries: 0 }) },
    rating: { type: ratingSchema, default: () => ({ avg: 0, count: 0 }) },
  },
  { timestamps: true },
);

listingSchema.index({ title: 'text', description: 'text', category: 'text' });
listingSchema.index({ category: 1, mode: 1, 'fee.amount': 1 });
listingSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });

export type ListingDocument = InferSchemaType<typeof listingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Listing: Model<ListingDocument> =
  mongoose.models.Listing ?? mongoose.model<ListingDocument>('Listing', listingSchema);
