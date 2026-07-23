import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type { SubscriptionPlan, SubscriptionStatus } from '@skillventures/shared-types';

const invoiceSchema = new Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, required: true },
    pdfUrl: { type: String },
  },
  { _id: false },
);

const subscriptionSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'standard', 'premium'] satisfies SubscriptionPlan[],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    razorpaySubscriptionId: { type: String, index: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due'] satisfies SubscriptionStatus[],
      required: true,
      index: true,
    },
    currentPeriodEnd: { type: Date, required: true },
    invoices: { type: [invoiceSchema], default: [] },
  },
  { timestamps: true },
);

export type SubscriptionDocument = InferSchemaType<typeof subscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Subscription: Model<SubscriptionDocument> =
  mongoose.models.Subscription ??
  mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema);
