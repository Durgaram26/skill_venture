import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EnquiryStatus, EnquirySummary } from '@skillventures/shared-types';
import { AppShell } from '../components/AppShell';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';

const PIPELINE: { key: EnquiryStatus | 'enquired'; label: string }[] = [
  { key: 'new', label: 'Enquired' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'converted', label: 'Enrolled' },
  { key: 'lost', label: 'Closed' },
];

function stepIndex(status: EnquiryStatus): number {
  if (status === 'new') return 0;
  if (status === 'contacted') return 1;
  if (status === 'converted') return 2;
  return 3;
}

export function StudentEnquiriesPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<EnquirySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    void api
      .myStudentEnquiries()
      .then((data) => setItems(data.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load');
      });
  }, [user]);

  if (user?.role !== 'student') {
    return (
      <AppShell>
        <p>Student access only.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Application tracker">
      <p className="mb-4 text-sm text-ink/70">
        Track every enquiry: Enquired → Contacted → Enrolled.
      </p>
      {error ? <p className="text-coral">{error}</p> : null}
      <ul className="mt-4 space-y-6">
        {items.map((e) => {
          const active = stepIndex(e.status);
          return (
            <li key={e.id} className="border-b border-mist pb-5">
              <p className="font-semibold text-ink">
                {e.listing ? (
                  <Link className="text-lagoon" to={`/listings/${e.listing.slug}`}>
                    {e.listing.title}
                  </Link>
                ) : (
                  'Listing'
                )}
              </p>
              <ol className="mt-3 flex flex-wrap gap-2">
                {PIPELINE.map((step, idx) => (
                  <li
                    key={step.key}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      idx <= active && e.status !== 'lost'
                        ? 'bg-lagoon text-white'
                        : e.status === 'lost' && idx === 3
                          ? 'bg-coral text-white'
                          : 'bg-mist text-ink/60'
                    }`}
                  >
                    {step.label}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-sm text-ink/80">{e.message}</p>
              <p className="mt-1 text-xs text-ink/55">
                Sent {new Date(e.createdAt).toLocaleDateString()} · Updated{' '}
                {new Date(e.updatedAt).toLocaleDateString()}
              </p>
            </li>
          );
        })}
        {items.length === 0 ? (
          <li className="text-sm text-ink/60">
            No applications yet.{' '}
            <Link className="text-lagoon" to="/listings">
              Browse programs
            </Link>
          </li>
        ) : null}
      </ul>
    </AppShell>
  );
}
