import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketplaceShell } from '../components/AppShell';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function StudentPaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.myPayments>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    void api
      .myPayments()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load payments');
      });
  }, [user]);

  if (user?.role !== 'student') {
    return (
      <MarketplaceShell title="My payments">
        <p className="text-mute">Student access only.</p>
        <Link to="/login" className="sv-btn-primary mt-4 inline-flex">
          Log in
        </Link>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell
      title="My payments"
      subtitle="Enrollment fees you paid — institutions receive the net amount after platform fee."
    >
      {error ? (
        <p className="mb-4 rounded-lg bg-spark-soft px-4 py-3 text-sm font-semibold text-[#b45309]">
          {error}
        </p>
      ) : null}

      {data ? (
        <p className="mb-5 text-sm text-mute">
          SkillVentures keeps {data.commissionPercent}% as platform fee; the rest is marked for the
          institution.
        </p>
      ) : null}

      {!data && !error ? <p className="text-sm text-mute">Loading…</p> : null}

      {data && data.items.length === 0 ? (
        <div className="sv-ticket rounded-md p-8 text-center">
          <p className="font-display text-lg font-bold">No payments yet</p>
          <p className="mt-1 text-sm text-mute">
            When you pay to enroll in a program, it will show up here.
          </p>
          <Link to="/listings" className="sv-btn-primary mt-4 inline-flex">
            Explore programs
          </Link>
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <li key={item.id} className="sv-ticket rounded-md p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {item.listingSlug ? (
                    <Link
                      to={`/listings/${item.listingSlug}`}
                      className="font-display font-bold text-ink hover:text-teal"
                    >
                      {item.listingTitle}
                    </Link>
                  ) : (
                    <p className="font-display font-bold">{item.listingTitle}</p>
                  )}
                  <p className="mt-1 text-xs capitalize text-mute">
                    {item.status} · {new Date(item.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-display text-lg font-extrabold">{formatInr(item.amountPaise)}</p>
                  <p className="text-xs text-mute">
                    Institution: {formatInr(item.institutionPayoutPaise)} · Fee:{' '}
                    {formatInr(item.platformFeePaise)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </MarketplaceShell>
  );
}
