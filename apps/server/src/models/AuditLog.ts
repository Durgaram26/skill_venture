import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog ?? mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
