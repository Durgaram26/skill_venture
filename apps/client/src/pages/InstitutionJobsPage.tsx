import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type JobSummary, type JobCreatePayload } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { InstitutionShell } from './institution/InstitutionShell';

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
  freelance: 'Freelance',
};

const JOB_CATEGORY_HINT =
  'Select every listing category this job belongs to. Students who engaged with any selected category can see it.';

function JobStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`sv-job-pill ${status === 'active' ? 'sv-job-pill--active' : 'sv-job-pill--closed'}`}
    >
      {status === 'active' ? 'Active' : 'Closed'}
    </span>
  );
}

const EMPTY_FORM: JobCreatePayload = {
  title: '',
  description: '',
  categories: [],
  keywords: [],
  location: 'Remote',
  jobType: 'full-time',
  salaryRange: '',
  applyUrl: '',
  expiresAt: '',
};

export function InstitutionJobsPage() {
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JobCreatePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listingCategories, setListingCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (user?.role !== 'institution') return;
    void Promise.all([api.myJobs(), api.myListings()])
      .then(([jobData, listingData]) => {
        setJobs(jobData.items);
        setListingCategories([...new Set(listingData.items.map((listing) => listing.category).filter(Boolean))]);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load jobs'),
      )
      .finally(() => setLoading(false));
  }, [user]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setCustomCategory('');
    setKeywordInput('');
    setSaveError(null);
    setShowForm(true);
  }

  function openEdit(job: JobSummary) {
    setEditId(job.id);
    setForm({
      title: job.title,
      description: job.description,
      categories: job.categories?.length ? job.categories : [job.category],
      keywords: job.keywords ?? [],
      location: job.location,
      jobType: job.jobType,
      salaryRange: job.salaryRange ?? '',
      applyUrl: job.applyUrl ?? '',
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '',
    });
    setCustomCategory('');
    setKeywordInput((job.keywords ?? []).join(', '));
    setSaveError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const categories = [...new Set([...form.categories, ...customCategory.split(',').map((v) => v.trim()).filter(Boolean)])];
      const keywords = [...new Set([...form.keywords, ...keywordInput.split(',').map((v) => v.trim()).filter(Boolean)])];
      const payload = {
        ...form,
        categories,
        category: categories[0],
        keywords,
        salaryRange: form.salaryRange || undefined,
        applyUrl: form.applyUrl || undefined,
        expiresAt: form.expiresAt || undefined,
      };
      if (editId) {
        const { job } = await api.updateJob(editId, payload);
        setJobs((prev) => prev.map((j) => (j.id === editId ? job : j)));
      } else {
        const { job } = await api.createJob(payload);
        setJobs((prev) => [job, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save job');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(job: JobSummary) {
    setBusyId(job.id);
    try {
      const next = job.status === 'active' ? 'closed' : 'active';
      const { job: updated } = await api.updateJob(job.id, { status: next });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this job posting?')) return;
    setBusyId(id);
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete job');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <InstitutionShell
      title="Job postings"
      subtitle="Post opportunities matched to students by course category."
      error={error}
      actions={
        <button type="button" className="sv-btn-accent" onClick={openCreate}>
          + Post a job
        </button>
      }
    >
      {/* ── Form modal overlay ── */}
      {showForm && (
        <div className="sv-job-modal-bg" onClick={() => setShowForm(false)}>
          <div
            className="sv-job-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editId ? 'Edit job posting' : 'Create job posting'}
          >
            <div className="sv-job-modal-header">
              <h2 className="font-display text-xl font-bold">
                {editId ? 'Edit job posting' : 'Post a new job'}
              </h2>
              <button
                type="button"
                className="sv-job-modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="sv-job-form space-y-4">
              <label className="sv-job-label">
                Job title *
                <input
                  className="sv-input mt-1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  minLength={3}
                  placeholder="e.g. React Developer Intern"
                />
              </label>

              <div className="sv-job-label">
                Listing categories *
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {listingCategories.map((category) => (
                    <label key={category} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={form.categories.includes(category)}
                        onChange={(e) => setForm({ ...form, categories: e.target.checked ? [...form.categories, category] : form.categories.filter((item) => item !== category) })}
                      />
                      {category}
                    </label>
                  ))}
                </div>
                <input
                  className="sv-input mt-2"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Add another category, e.g. Java (comma separated)"
                />
                <span className="mt-1 block text-xs text-mute">{JOB_CATEGORY_HINT}</span>
              </div>

              <label className="sv-job-label">
                Keywords
                <input
                  className="sv-input mt-1"
                  value={keywordInput}
                  onChange={(e) => { setKeywordInput(e.target.value); setForm({ ...form, keywords: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }); }}
                  placeholder="e.g. Java, React, backend, internship"
                />
                <span className="mt-1 block text-xs text-mute">Add comma-separated skills so relevant jobs are easier to match.</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sv-job-label">
                  Job type
                  <select
                    className="sv-input mt-1"
                    value={form.jobType}
                    onChange={(e) =>
                      setForm({ ...form, jobType: e.target.value as JobCreatePayload['jobType'] })
                    }
                  >
                    {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sv-job-label">
                  Location
                  <input
                    className="sv-input mt-1"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Remote / City"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sv-job-label">
                  Salary / stipend
                  <input
                    className="sv-input mt-1"
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    placeholder="e.g. ₹20,000 – ₹30,000/mo"
                  />
                </label>

                <label className="sv-job-label">
                  Expires on
                  <input
                    type="date"
                    className="sv-input mt-1"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </label>
              </div>

              <label className="sv-job-label">
                Apply URL
                <input
                  type="url"
                  className="sv-input mt-1"
                  value={form.applyUrl}
                  onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
                  placeholder="https://…"
                />
              </label>

              <label className="sv-job-label">
                Description *
                <textarea
                  className="sv-input mt-1"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  minLength={20}
                  placeholder="Role overview, responsibilities, skills required…"
                />
              </label>

              {saveError && <p className="text-sm text-spark">{saveError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="sv-btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={saving || (form.categories.length === 0 && !customCategory.trim())}>
                  {saving ? 'Saving…' : editId ? 'Update job' : 'Post job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Job list ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sv-job-skeleton animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="sv-job-empty">
          <i className="fas fa-briefcase text-4xl text-mute" aria-hidden />
          <p className="mt-4 font-display text-lg font-bold">No job postings yet</p>
          <p className="mt-2 text-sm text-mute">
            Post your first opportunity. Students who studied relevant categories will see it in
            their profile.
          </p>
          <button type="button" className="sv-btn-primary mt-5" onClick={openCreate}>
            Post a job
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id} className="sv-job-card">
              <div className="flex flex-wrap items-start gap-3">
                <div className="sv-job-icon-wrap" aria-hidden>
                  <i className="fas fa-briefcase" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold">{job.title}</h3>
                    <JobStatusPill status={job.status} />
                    <span className="sv-job-type-chip">
                      {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-mute">
                    <i className="fas fa-tag mr-1" aria-hidden />
                    {(job.categories?.length ? job.categories : [job.category]).join(' · ')}
                    {' · '}
                    <i className="fas fa-location-dot mr-1" aria-hidden />
                    {job.location}
                    {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                    {job.expiresAt
                      ? ` · Expires ${new Date(job.expiresAt).toLocaleDateString()}`
                      : ''}
                  </p>
                  {job.keywords?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{job.keywords.map((keyword) => <span key={keyword} className="sv-job-type-chip">#{keyword}</span>)}</div> : null}
                  <p className="mt-2 line-clamp-2 text-sm text-ink/75">{job.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  className="sv-inst-action"
                  onClick={() => openEdit(job)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`sv-inst-action ${
                    job.status === 'active' ? 'sv-inst-action--muted' : 'sv-inst-action--success'
                  }`}
                  disabled={busyId === job.id}
                  onClick={() => void toggleStatus(job)}
                >
                  {job.status === 'active' ? 'Close listing' : 'Re-open'}
                </button>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sv-inst-action text-teal"
                  >
                    View apply link ↗
                  </a>
                )}
                <button
                  type="button"
                  className="sv-inst-action sv-inst-action--danger ml-auto"
                  disabled={busyId === job.id}
                  onClick={() => void handleDelete(job.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </InstitutionShell>
  );
}
