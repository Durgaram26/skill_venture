import { useState, type FormEvent, type ReactNode } from 'react';
import type { ListingDraft } from '../features/listings/listingDraft';
import { ListingEditorForm } from './ListingEditorForm';
import { ListingFullPagePreview } from './ListingFullPagePreview';
import type { UploadedImage } from './ListingImageUpload';

type EditorView = 'edit' | 'preview';

export function ListingEditorWorkspace({
  draft,
  onDraftChange,
  images,
  onImagesChange,
  submitForReview,
  onSubmitForReviewChange,
  loading,
  error,
  onError,
  onSubmit,
  submitLabel,
  showSubmitForReview,
  footer,
}: {
  draft: ListingDraft;
  onDraftChange: (draft: ListingDraft) => void;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  submitForReview: boolean;
  onSubmitForReviewChange: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  showSubmitForReview?: boolean;
  footer?: ReactNode;
}) {
  const [view, setView] = useState<EditorView>('edit');

  const previewDraft: ListingDraft = {
    ...draft,
    coverUrl: images[0]?.previewUrl ?? draft.coverUrl,
  };

  return (
    <section className="space-y-4">
      <nav aria-label="Editor views" className="sv-listing-editor-tabs">
        <button
          type="button"
          className={view === 'edit' ? 'is-active' : undefined}
          onClick={() => setView('edit')}
        >
          Edit listing
        </button>
        <button
          type="button"
          className={view === 'preview' ? 'is-active' : undefined}
          onClick={() => setView('preview')}
        >
          Full page preview
        </button>
      </nav>

      {view === 'edit' ? (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ListingEditorForm
            draft={draft}
            onDraftChange={onDraftChange}
            images={images}
            onImagesChange={onImagesChange}
            submitForReview={submitForReview}
            onSubmitForReviewChange={onSubmitForReviewChange}
            loading={loading}
            error={error}
            onError={onError}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
            showSubmitForReview={showSubmitForReview}
            footer={footer}
          />
          <aside className="hidden xl:block">
            <section className="sticky top-24 rounded-md border border-line bg-paper p-3 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Quick peek</p>
              <p className="mt-1 text-xs text-mute">
                Switch to <strong>Full page preview</strong> to see the complete public layout.
              </p>
            </section>
          </aside>
        </div>
      ) : (
        <section className="sv-listing-full-preview-wrap">
          <header className="sv-listing-full-preview-banner">
            <p className="font-semibold">Full page preview</p>
            <p className="text-sm text-mute">This is how students will see your live listing page.</p>
            <button type="button" className="sv-btn-ghost mt-3 text-xs" onClick={() => setView('edit')}>
              Back to editor
            </button>
          </header>
          <ListingFullPagePreview draft={previewDraft} />
        </section>
      )}
    </section>
  );
}
