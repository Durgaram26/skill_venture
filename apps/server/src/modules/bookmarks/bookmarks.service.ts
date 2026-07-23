import { Bookmark } from '../../models/Bookmark.js';
import { Listing } from '../../models/Listing.js';
import { AppError } from '../../utils/AppError.js';
import { toListingSummary } from '../listings/listings.service.js';

export async function addBookmark(studentId: string, listingId: string) {
  const listing = await Listing.findById(listingId);
  if (!listing || listing.status !== 'published') {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  try {
    await Bookmark.create({ studentId, listingId });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      throw new AppError('Already bookmarked', 409, 'BOOKMARK_EXISTS');
    }
    throw error;
  }

  return { bookmarked: true, listingId };
}

export async function removeBookmark(studentId: string, listingId: string) {
  const result = await Bookmark.findOneAndDelete({ studentId, listingId });
  if (!result) {
    throw new AppError('Bookmark not found', 404, 'BOOKMARK_NOT_FOUND');
  }
  return { bookmarked: false, listingId };
}

export async function listBookmarks(studentId: string) {
  const bookmarks = await Bookmark.find({ studentId }).sort({ createdAt: -1 });
  const listingIds = bookmarks.map((b) => b.listingId);
  const listings = await Listing.find({
    _id: { $in: listingIds },
    status: 'published',
  });
  const map = new Map(listings.map((l) => [String(l._id), l]));

  return bookmarks
    .map((b) => {
      const listing = map.get(String(b.listingId));
      if (!listing) return null;
      return {
        id: String(b._id),
        listingId: String(b.listingId),
        createdAt: (b as typeof b & { createdAt: Date }).createdAt.toISOString(),
        listing: toListingSummary(listing),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);
}

export async function isBookmarked(studentId: string, listingId: string): Promise<boolean> {
  const found = await Bookmark.exists({ studentId, listingId });
  return Boolean(found);
}
