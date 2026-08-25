import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const jobPostSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 3000 },
    /** Legacy primary category; kept for existing records and API consumers. */
    category: { type: String, required: true, index: true },
    /** Categories from the institution's listings that this job is relevant to. */
    categories: { type: [String], default: [], index: true },
    keywords: { type: [String], default: [] },
    location: { type: String, default: 'Remote' },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
      default: 'full-time',
    },
    salaryRange: { type: String },
    applyUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

jobPostSchema.index({ institutionId: 1, status: 1 });
jobPostSchema.index({ category: 1, status: 1, createdAt: -1 });
jobPostSchema.index({ categories: 1, status: 1, createdAt: -1 });

export type JobPostDocument = InferSchemaType<typeof jobPostSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const JobPost: Model<JobPostDocument> =
  mongoose.models.JobPost ?? mongoose.model<JobPostDocument>('JobPost', jobPostSchema);
