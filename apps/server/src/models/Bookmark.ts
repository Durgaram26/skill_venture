import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const bookmarkSchema = new Schema(
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

bookmarkSchema.index({ studentId: 1, listingId: 1 }, { unique: true });

export type BookmarkDocument = InferSchemaType<typeof bookmarkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Bookmark: Model<BookmarkDocument> =
  mongoose.models.Bookmark ?? mongoose.model<BookmarkDocument>('Bookmark', bookmarkSchema);
