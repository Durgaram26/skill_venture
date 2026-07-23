import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    relatedEntityId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model<NotificationDocument>('Notification', notificationSchema);
