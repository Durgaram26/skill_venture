import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListingEditorWorkspace } from '../components/ListingEditorWorkspace';
import type { UploadedImage } from '../components/ListingImageUpload';
import {
  buildListingPayload,
  EMPTY_LISTING_DRAFT,
  type ListingDraft,
} from '../features/listings/listingDraft';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { InstitutionShell } from './institution/InstitutionShell';

export function CreateListingPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ListingDraft>({
    ...EMPTY_LISTING_DRAFT,
    institutionName: user?.name ?? 'Your institution',
  });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitForReview, setSubmitForReview] = useState(true);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (images.some((img) => img.uploading)) {
      setError('Wait for image uploads to finish.');
      return;
    }
    if (images.some((img) => img.error)) {
      setError('Remove failed uploads or try again.');
      return;
    }

    setLoading(true);
    setError(null);

    const imageUrls = images
      .map((img) => img.serverUrl)
      .filter((url): url is string => Boolean(url));

    try {
      await api.createListing(buildListingPayload(draft, imageUrls, { submitForReview }));
      navigate('/institution');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <InstitutionShell
      title="Create listing"
      subtitle="Add program details, upload a cover, and preview the full public page."
      error={error}
      actions={
        <Link to="/institution" className="sv-btn-ghost">
          Back to hub
        </Link>
      }
    >
      <ListingEditorWorkspace
        draft={draft}
        onDraftChange={setDraft}
        images={images}
        onImagesChange={setImages}
        submitForReview={submitForReview}
        onSubmitForReviewChange={setSubmitForReview}
        loading={loading}
        error={error}
        onError={setError}
        onSubmit={onSubmit}
        submitLabel="Save listing"
      />
    </InstitutionShell>
  );
}
