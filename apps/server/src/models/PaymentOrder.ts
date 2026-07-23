import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const paymentOrderSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['subscription', 'featured', 'enrollment'],
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['standard', 'premium'],
    },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', index: true },
    featuredDays: { type: Number, min: 1 },
    /** Gross amount charged to payer (paise). */
    amount: { type: Number, required: true, min: 0 },
    /** Platform commission kept by SkillVentures (paise). Enrollment only. */
    platformFeePaise: { type: Number, min: 0, default: 0 },
    /** Net amount owed to the institution (paise). Enrollment only. */
    institutionPayoutPaise: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },
  },
  { timestamps: true },
);

export type PaymentOrderDocument = InferSchemaType<typeof paymentOrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PaymentOrder: Model<PaymentOrderDocument> =
  mongoose.models.PaymentOrder ??
  mongoose.model<PaymentOrderDocument>('PaymentOrder', paymentOrderSchema);
