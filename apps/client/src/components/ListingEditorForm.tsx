import type { FormEvent, ReactNode } from 'react';
import type { ListingDraft } from '../features/listings/listingDraft';
import { ListingImageUpload, type UploadedImage } from './ListingImageUpload';

export function ListingEditorForm({
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
  showSubmitForReview = true,
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
  function patch<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-md border border-line bg-paper p-5 shadow-card">
      <ListingImageUpload images={images} onChange={onImagesChange} onError={(msg) => onError(msg)} />

      <Field label="Title" value={draft.title} onChange={(value) => patch('title', value)} required />

      <label className="block text-sm font-semibold">
        Type
        <select
          value={draft.type}
          onChange={(e) => patch('type', e.target.value as ListingDraft['type'])}
          className="sv-field-input mt-1"
        >
          <option value="course">Course</option>
          <option value="bootcamp">Bootcamp</option>
          <option value="hackathon">Hackathon</option>
        </select>
      </label>

      <label className="block text-sm font-semibold">
        Description
        <textarea
          value={draft.description}
          onChange={(e) => patch('description', e.target.value)}
          required
          minLength={20}
          rows={5}
          className="sv-field-input mt-1"
        />
      </label>

      <Field
        label="Category"
        value={draft.category}
        onChange={(value) => patch('category', value)}
        placeholder="e.g. Web Development, AI, Design"
        required
      />

      <label className="block text-sm font-semibold">
        Eligibility
        <textarea
          value={draft.eligibility ?? ''}
          onChange={(e) => patch('eligibility', e.target.value)}
          rows={2}
          className="sv-field-input mt-1"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Fee (INR)
          <input
            type="number"
            min={0}
            value={draft.amount}
            onChange={(e) => patch('amount', Number(e.target.value))}
            required
            className="sv-field-input mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Mode
          <select
            value={draft.mode}
            onChange={(e) => patch('mode', e.target.value as ListingDraft['mode'])}
            className="sv-field-input mt-1"
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Duration value
          <input
            type="number"
            min={1}
            value={draft.durationValue}
            onChange={(e) => patch('durationValue', Number(e.target.value))}
            required
            className="sv-field-input mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Unit
          <select
            value={draft.durationUnit}
            onChange={(e) => patch('durationUnit', e.target.value as ListingDraft['durationUnit'])}
            className="sv-field-input mt-1"
          >
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="days">Days</option>
            <option value="hours">Hours</option>
          </select>
        </label>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Field label="City" value={draft.city} onChange={(value) => patch('city', value)} />
        <Field label="State" value={draft.state} onChange={(value) => patch('state', value)} />
      </section>

      {draft.type === 'bootcamp' ? (
        <fieldset className="space-y-3 rounded-md border border-line p-4">
          <legend className="px-1 text-sm font-bold">Bootcamp details</legend>
          <Field
            label="Start date"
            type="date"
            value={draft.bootcampStart ?? ''}
            onChange={(value) => patch('bootcampStart', value)}
          />
          <Field
            label="End date"
            type="date"
            value={draft.bootcampEnd ?? ''}
            onChange={(value) => patch('bootcampEnd', value)}
          />
          <Field
            label="Session mode"
            value={draft.bootcampSessionMode ?? ''}
            onChange={(value) => patch('bootcampSessionMode', value)}
            placeholder="Weekday evenings"
          />
          <Field
            label="Seats available"
            type="number"
            value={draft.bootcampSeats ?? ''}
            onChange={(value) => patch('bootcampSeats', value)}
          />
        </fieldset>
      ) : null}

      {draft.type === 'hackathon' ? (
        <fieldset className="space-y-3 rounded-md border border-line p-4">
          <legend className="px-1 text-sm font-bold">Hackathon details</legend>
          <Field
            label="Start date"
            type="date"
            value={draft.hackathonStart ?? ''}
            onChange={(value) => patch('hackathonStart', value)}
          />
          <Field
            label="End date"
            type="date"
            value={draft.hackathonEnd ?? ''}
            onChange={(value) => patch('hackathonEnd', value)}
          />
          <Field
            label="Prize pool (INR)"
            type="number"
            value={draft.hackathonPrizePool ?? ''}
            onChange={(value) => patch('hackathonPrizePool', value)}
          />
          <Field
            label="Max team size"
            type="number"
            value={draft.hackathonTeamSize ?? ''}
            onChange={(value) => patch('hackathonTeamSize', value)}
          />
          <Field
            label="Sponsors (comma-separated)"
            value={draft.hackathonSponsors ?? ''}
            onChange={(value) => patch('hackathonSponsors', value)}
          />
        </fieldset>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.placementSupport}
          onChange={(e) => patch('placementSupport', e.target.checked)}
        />
        Placement support
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.certificateProvided}
          onChange={(e) => patch('certificateProvided', e.target.checked)}
        />
        Certificate provided
      </label>
      {showSubmitForReview ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={submitForReview}
            onChange={(e) => onSubmitForReviewChange(e.target.checked)}
          />
          Submit for review
        </label>
      ) : null}

      {error ? <p className="text-sm text-spark">{error}</p> : null}
      {footer}
      <button type="submit" disabled={loading} className="sv-btn-accent disabled:opacity-60">
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="sv-field-input mt-1"
      />
    </label>
  );
}
