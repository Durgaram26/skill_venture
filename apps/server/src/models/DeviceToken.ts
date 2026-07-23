import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const deviceTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

export type DeviceTokenDocument = InferSchemaType<typeof deviceTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DeviceToken: Model<DeviceTokenDocument> =
  mongoose.models.DeviceToken ??
  mongoose.model<DeviceTokenDocument>('DeviceToken', deviceTokenSchema);
