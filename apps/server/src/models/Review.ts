import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type { ModerationStatus } from '@skillventures/shared-types';

const institutionReplySchema = new Schema(
  {
    text: { type: String, required: true },
    repliedAt: { type: Date, required: true },
  },
  { _id: false },
);

const reviewSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
    // Integrity rule (§6): only true when enquiry.status === 'converted'
    isVerifiedApplicant: { type: Boolean, default: false, required: true },
    institutionReply: { type: institutionReplySchema },
    moderationStatus: {
      type: String,
      enum: ['visible', 'flagged', 'removed'] satisfies ModerationStatus[],
      default: 'visible',
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reviewSchema.index({ listingId: 1, studentId: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof reviewSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Review: Model<ReviewDocument> =
  mongoose.models.Review ?? mongoose.model<ReviewDocument>('Review', reviewSchema);
