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
  'Use the same category as your listings so students who enquired about that category see this job.';

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
  category: '',
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

  useEffect(() => {
    if (user?.role !== 'institution') return;
    void api
      .myJobs()
      .then((data) => setJobs(data.items))
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load jobs'),
      )
      .finally(() => setLoading(false));
  }, [user]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setShowForm(true);
  }

  function openEdit(job: JobSummary) {
    setEditId(job.id);
    setForm({
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.location,
      jobType: job.jobType,
      salaryRange: job.salaryRange ?? '',
      applyUrl: job.applyUrl ?? '',
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '',
    });
    setSaveError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
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

              <label className="sv-job-label">
                Category *
                <input
                  className="sv-input mt-1"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  placeholder="e.g. Web Development"
                />
                <span className="mt-1 block text-xs text-mute">{JOB_CATEGORY_HINT}</span>
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
                <button type="submit" className="sv-btn-primary" disabled={saving}>
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
                    {job.category}
                    {' · '}
                    <i className="fas fa-location-dot mr-1" aria-hidden />
                    {job.location}
                    {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                    {job.expiresAt
                      ? ` · Expires ${new Date(job.expiresAt).toLocaleDateString()}`
                      : ''}
                  </p>
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
