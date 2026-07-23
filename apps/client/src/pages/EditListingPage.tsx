import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ListingEditorWorkspace } from '../components/ListingEditorWorkspace';
import type { UploadedImage } from '../components/ListingImageUpload';
import {
  buildListingPayload,
  listingToDraft,
  type ListingDraft,
} from '../features/listings/listingDraft';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { InstitutionShell } from './institution/InstitutionShell';

function imagesFromUrls(urls: string[]): UploadedImage[] {
  return urls.map((url) => ({
    id: crypto.randomUUID(),
    previewUrl: url,
    serverUrl: url,
    uploading: false,
  }));
}

export function EditListingPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [submitForReview, setSubmitForReview] = useState(false);

  useEffect(() => {
    if (!id || user?.role !== 'institution') return;
    void api
      .getMyListing(id)
      .then(({ listing }) => {
        setDraft(listingToDraft(listing, user.name ?? 'Your institution'));
        setImages(imagesFromUrls(listing.images ?? []));
        setSubmitForReview(listing.status === 'draft');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load listing');
      })
      .finally(() => setBootstrapping(false));
  }, [id, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !draft) return;
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
      await api.updateListing(id, buildListingPayload(draft, imageUrls, { submitForReview }));
      navigate('/institution');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <InstitutionShell
      title="Edit listing"
      subtitle="Update your program, then check the full page preview before saving."
      error={bootstrapping ? null : error}
      actions={
        <Link to="/institution" className="sv-btn-ghost">
          Back to hub
        </Link>
      }
    >
      {bootstrapping ? (
        <p className="text-sm text-mute">Loading listing…</p>
      ) : draft ? (
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
          submitLabel="Save changes"
        />
      ) : (
        <p className="text-sm text-spark">{error ?? 'Listing not found.'}</p>
      )}
    </InstitutionShell>
  );
}
