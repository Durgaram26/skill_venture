import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const supportTicketSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    reporterEmail: { type: String, required: true, trim: true, lowercase: true },
    reporterName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['billing', 'listing', 'account', 'dispute', 'other'],
      default: 'other',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminNotes: { type: String, maxlength: 2000 },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SupportTicket: Model<SupportTicketDocument> =
  mongoose.models.SupportTicket ??
  mongoose.model<SupportTicketDocument>('SupportTicket', supportTicketSchema);
