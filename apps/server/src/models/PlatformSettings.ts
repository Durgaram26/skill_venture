import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const platformSettingsSchema = new Schema(
  {
    key: { type: String, default: 'default', unique: true },
    heroHeadline: { type: String, default: 'Your next program, stamped and ready.' },
    heroSubheadline: {
      type: String,
      default: 'Discover courses, bootcamps, and hackathons from verified partners across India.',
    },
    categories: {
      type: [String],
      default: [
        'Web Development',
        'Data Science',
        'AI',
        'Mobile',
        'Design',
        'Business',
        'Cloud',
      ],
    },
    featureFlags: {
      registrationsOpen: { type: Boolean, default: true },
      featuredListingsEnabled: { type: Boolean, default: true },
      institutionSignupsOpen: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export type PlatformSettingsDocument = InferSchemaType<typeof platformSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlatformSettings: Model<PlatformSettingsDocument> =
  mongoose.models.PlatformSettings ??
  mongoose.model<PlatformSettingsDocument>('PlatformSettings', platformSettingsSchema);

export async function getOrCreatePlatformSettings() {
  let doc = await PlatformSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = await PlatformSettings.create({ key: 'default' });
  }
  return doc;
}
