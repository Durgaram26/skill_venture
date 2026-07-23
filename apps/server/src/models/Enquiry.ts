import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type { EnquiryStatus } from '@skillventures/shared-types';

const contactInfoSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false },
);

const enquirySchema = new Schema(
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
    message: { type: String, required: true, maxlength: 2000 },
    contactInfo: { type: contactInfoSchema, required: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'lost'] satisfies EnquiryStatus[],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true },
);

enquirySchema.index({ institutionId: 1, status: 1 });
enquirySchema.index({ studentId: 1, createdAt: -1 });

export type EnquiryDocument = InferSchemaType<typeof enquirySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Enquiry: Model<EnquiryDocument> =
  mongoose.models.Enquiry ?? mongoose.model<EnquiryDocument>('Enquiry', enquirySchema);
