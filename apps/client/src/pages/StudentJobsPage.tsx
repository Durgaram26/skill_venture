import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { api, ApiError, type JobSummary } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
  freelance: 'Freelance',
};

export function StudentJobsPage() {
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    void api.studentJobFeed()
      .then((data) => { setJobs(data.items); setCategories(data.categories); })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load job alerts'))
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== 'student') return <AppShell><p>Student access only.</p></AppShell>;

  return (
    <AppShell title="My jobs" subtitle="Job alerts matched to the learning categories and interests you have explored.">
      {error ? <p className="mb-4 text-coral">{error}</p> : null}
      {categories.length ? (
        <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Your job alert topics</p>
          <div className="mt-2 flex flex-wrap gap-2">{categories.map((category) => <span key={category} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-800 shadow-sm">{category}</span>)}</div>
        </div>
      ) : null}
      {loading ? <div className="space-y-3"><div className="h-28 animate-pulse rounded-2xl bg-slate-100" /><div className="h-28 animate-pulse rounded-2xl bg-slate-100" /></div> : jobs.length ? (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id} className="sv-job-card">
              <div className="flex flex-wrap items-start gap-3">
                <div className="sv-job-feed-icon" aria-hidden><i className="fas fa-briefcase" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-slate-900">{job.title}</h2><span className="sv-job-type-chip">{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</span></div>
                  <p className="mt-1 text-xs text-mute">{job.institutionName ?? 'Institution'} · {(job.categories?.length ? job.categories : [job.category]).join(' · ')} · {job.location}</p>
                  {job.keywords?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{job.keywords.map((keyword) => <span key={keyword} className="sv-job-type-chip">#{keyword}</span>)}</div> : null}
                  <p className="mt-3 text-sm leading-6 text-ink/75">{job.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-mute"><span>{job.salaryRange ?? 'Opportunity'}{job.expiresAt ? ` · Apply by ${new Date(job.expiresAt).toLocaleDateString()}` : ''}</span>{job.applyUrl ? <a className="sv-btn-primary px-4 py-2 text-xs" href={job.applyUrl} target="_blank" rel="noreferrer">Apply now ↗</a> : null}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="sv-job-empty"><i className="fas fa-bell text-4xl text-mute" aria-hidden /><p className="mt-4 font-display text-lg font-bold">No job alerts yet</p><p className="mt-2 text-sm text-mute">Enquire about or save a course, bootcamp, or hackathon to start receiving matching opportunities.</p></div>
      )}
    </AppShell>
  );
}
