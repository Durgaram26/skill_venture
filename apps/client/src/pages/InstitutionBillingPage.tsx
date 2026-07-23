import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { EmptyState, InstitutionShell, StatusBadge } from './institution/InstitutionShell';

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

type PayoutForm = {
  method: 'bank' | 'upi';
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

const EMPTY_PAYOUT: PayoutForm = {
  method: 'upi',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
};

export function InstitutionBillingPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.mySubscription>> | null>(null);
  const [earnings, setEarnings] = useState<Awaited<ReturnType<typeof api.myEarnings>> | null>(null);
  const [payoutConfigured, setPayoutConfigured] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string>('none');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutForm, setPayoutForm] = useState<PayoutForm>(EMPTY_PAYOUT);
  const [listings, setListings] = useState<{ id: string; title: string; status: string }[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  async function reload() {
    const [sub, list, earn, payoutRes] = await Promise.all([
      api.mySubscription(),
      api.myListings(),
      api.myEarnings(),
      api.myPayoutDetails(),
    ]);
    setData(sub);
    setListings(list.items.map((l) => ({ id: l.id, title: l.title, status: l.status })));
    setEarnings(earn);
    const p = payoutRes.payout;
    setPayoutConfigured(p.configured);
    setPayoutStatus(p.status);
    setPayoutNote(p.mockNote);
    setPayoutForm({
      method: p.method,
      accountHolderName: p.accountHolderName,
      bankName: p.bankName,
      accountNumber: p.accountNumber,
      ifsc: p.ifsc,
      upiId: p.upiId,
    });
  }

  useEffect(() => {
    if (user?.role !== 'institution') return;
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load billing');
      })
      .finally(() => setBootstrapping(false));
  }, [user]);

  async function savePayout(event: FormEvent) {
    event.preventDefault();
    setSavingPayout(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.updatePayoutDetails({
        method: payoutForm.method,
        accountHolderName: payoutForm.accountHolderName,
        bankName: payoutForm.method === 'bank' ? payoutForm.bankName : undefined,
        accountNumber: payoutForm.method === 'bank' ? payoutForm.accountNumber : undefined,
        ifsc: payoutForm.method === 'bank' ? payoutForm.ifsc : undefined,
        upiId: payoutForm.method === 'upi' ? payoutForm.upiId : undefined,
      });
      setPayoutConfigured(result.payout.configured);
      setPayoutStatus(result.payout.status);
      setPayoutNote(result.payout.mockNote);
      setMessage('Payout details saved (mock). Student enrollment amounts will be marked for this account.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save payout details');
    } finally {
      setSavingPayout(false);
    }
  }

  async function buyPlan(plan: 'standard' | 'premium') {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const order = await api.createPaymentOrder({ type: 'subscription', plan });
      if (order.mock) {
        await api.confirmMockPayment(order.orderId);
        setMessage(`Upgraded to ${plan}. (Mock payment — wire Razorpay Checkout in production.)`);
      } else {
        setMessage(`Order ${order.orderId} created. Complete payment with Razorpay key ${order.keyId}.`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  async function boostListing(listingId: string) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const order = await api.createPaymentOrder({ type: 'featured', listingId, days: 7 });
      if (order.mock) {
        await api.confirmMockPayment(order.orderId);
        setMessage('Listing featured for 7 days.');
      } else {
        setMessage(`Featured order ${order.orderId} created — complete Razorpay Checkout.`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Boost failed');
    } finally {
      setLoading(false);
    }
  }

  const published = listings.filter((l) => l.status === 'published');

  return (
    <InstitutionShell
      title="Billing & earnings"
      subtitle="Payout details for student fees, partner plans, and listing boosts."
      error={error}
    >
      {message ? (
        <p className="mb-5 rounded-lg bg-teal-soft px-4 py-3 text-sm font-semibold text-teal" role="status">
          {message}
        </p>
      ) : null}

      {bootstrapping ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="sv-inst-plan animate-pulse rounded-md border border-line p-5">
              <div className="h-5 w-24 rounded bg-line" />
              <div className="mt-3 h-4 w-full rounded bg-line/80" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="mb-10 rounded-md border border-line bg-paper p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Payout details</h2>
                <p className="mt-1 text-sm text-mute">
                  Where student enrollment money should go (after SkillVentures fee).
                </p>
              </div>
              <span
                className={`sv-inst-badge ${
                  payoutConfigured ? 'sv-inst-badge--published' : 'sv-inst-badge--draft'
                }`}
              >
                {payoutConfigured ? `Saved · ${payoutStatus}` : 'Not configured'}
              </span>
            </div>

            <p className="mb-4 rounded-lg bg-chalk px-3 py-2 text-xs text-mute">{payoutNote}</p>

            <form onSubmit={savePayout} className="space-y-4">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Payout method">
                {(['upi', 'bank'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    role="tab"
                    aria-selected={payoutForm.method === method}
                    className={payoutForm.method === method ? 'sv-inst-pill is-active' : 'sv-inst-pill'}
                    onClick={() => setPayoutForm((prev) => ({ ...prev, method }))}
                  >
                    {method === 'upi' ? 'UPI' : 'Bank account'}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold">
                Account holder name
                <input
                  required
                  value={payoutForm.accountHolderName}
                  onChange={(e) =>
                    setPayoutForm((prev) => ({ ...prev, accountHolderName: e.target.value }))
                  }
                  className="sv-field-input mt-1"
                  placeholder="As on bank / UPI"
                />
              </label>

              {payoutForm.method === 'upi' ? (
                <label className="block text-sm font-semibold">
                  UPI ID
                  <input
                    required
                    value={payoutForm.upiId}
                    onChange={(e) => setPayoutForm((prev) => ({ ...prev, upiId: e.target.value }))}
                    className="sv-field-input mt-1"
                    placeholder="partner@okaxis"
                  />
                </label>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold sm:col-span-2">
                    Bank name
                    <input
                      required
                      value={payoutForm.bankName}
                      onChange={(e) =>
                        setPayoutForm((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                      className="sv-field-input mt-1"
                      placeholder="HDFC Bank"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Account number
                    <input
                      required
                      value={payoutForm.accountNumber}
                      onChange={(e) =>
                        setPayoutForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                      }
                      className="sv-field-input mt-1"
                      placeholder="XXXXXXXXXXXX"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    IFSC
                    <input
                      required
                      value={payoutForm.ifsc}
                      onChange={(e) =>
                        setPayoutForm((prev) => ({
                          ...prev,
                          ifsc: e.target.value.toUpperCase(),
                        }))
                      }
                      className="sv-field-input mt-1"
                      placeholder="HDFC0001234"
                      maxLength={11}
                    />
                  </label>
                </div>
              )}

              <button type="submit" disabled={savingPayout} className="sv-btn-primary disabled:opacity-60">
                {savingPayout ? 'Saving…' : payoutConfigured ? 'Update payout details' : 'Save payout details'}
              </button>
            </form>
          </section>

          {earnings ? (
            <section className="mb-10">
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold tracking-tight">Student enrollments</h2>
                <p className="text-sm text-mute">
                  When a student pays for your program, you receive{' '}
                  {100 - earnings.commissionPercent}% (SkillVentures keeps{' '}
                  {earnings.commissionPercent}%).
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sv-inst-stat">
                  <p className="sv-inst-stat-label">Paid enrollments</p>
                  <p className="sv-inst-stat-value">{earnings.summary.paidCount}</p>
                </div>
                <div className="sv-inst-stat">
                  <p className="sv-inst-stat-label">Gross collected</p>
                  <p className="sv-inst-stat-value">{formatInr(earnings.summary.grossPaise)}</p>
                </div>
                <div className="sv-inst-stat">
                  <p className="sv-inst-stat-label">Your payout</p>
                  <p className="sv-inst-stat-value">{formatInr(earnings.summary.netPaise)}</p>
                  <p className="sv-inst-stat-hint">
                    Platform fee {formatInr(earnings.summary.platformFeePaise)}
                  </p>
                </div>
              </div>

              {earnings.items.length === 0 ? (
                <p className="mt-4 text-sm text-mute">
                  No student payments yet. Publish programs and students can Pay & enroll from the
                  listing page.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {earnings.items.slice(0, 8).map((item) => (
                    <li key={item.id} className="sv-inst-enquiry">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-bold">{item.listingTitle}</p>
                          <p className="mt-0.5 text-sm text-mute">
                            {item.studentName} · {item.studentEmail}
                          </p>
                          <p className="mt-1 text-xs text-mute">
                            {new Date(item.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-display text-lg font-extrabold">
                            {formatInr(item.institutionPayoutPaise)}
                          </p>
                          <p className="text-xs text-mute">of {formatInr(item.amountPaise)} paid</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {data ? (
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight">Your plan</h2>
                  <p className="text-sm text-mute">
                    Currently on <strong className="capitalize text-ink">{data.plan}</strong>
                    {data.expiresAt
                      ? ` · renews ${new Date(data.expiresAt).toLocaleDateString('en-IN')}`
                      : ''}
                  </p>
                </div>
                <Link
                  to="/institution/analytics"
                  className="text-sm font-semibold text-teal hover:underline"
                >
                  View analytics →
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(['standard', 'premium'] as const).map((plan) => {
                  const meta = data.plans[plan];
                  const isCurrent = data.plan === plan;
                  return (
                    <article
                      key={plan}
                      className={isCurrent ? 'sv-inst-plan sv-inst-plan--current' : 'sv-inst-plan'}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
                        {plan}
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold">
                        ₹{(meta.amountPaise / 100).toLocaleString('en-IN')}
                        <span className="text-sm font-semibold text-mute"> / month</span>
                      </p>
                      <p className="mt-2 text-sm text-mute">
                        Up to {meta.listingLimit} live listings · analytics included
                      </p>
                      <button
                        type="button"
                        disabled={loading || isCurrent}
                        onClick={() => void buyPlan(plan)}
                        className={
                          isCurrent ? 'sv-btn-ghost mt-4 w-full' : 'sv-btn-primary mt-4 w-full'
                        }
                      >
                        {isCurrent ? 'Current plan' : `Upgrade to ${plan}`}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <div className="mb-4">
              <h2 className="font-display text-xl font-bold tracking-tight">Feature a listing</h2>
              <p className="text-sm text-mute">
                ₹{((data?.featuredBoost.amountPaise ?? 99900) / 100).toLocaleString('en-IN')} for{' '}
                {data?.featuredBoost.defaultDays ?? 7} days of homepage and search boost.
              </p>
            </div>

            {published.length === 0 ? (
              <EmptyState
                title="No live listings to boost"
                hint="Publish a program first, then spotlight it to reach more students."
                action={
                  <Link to="/institution" className="sv-btn-primary">
                    Go to hub
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {published.map((l) => (
                  <li key={l.id} className="sv-inst-enquiry">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-bold">{l.title}</p>
                        <StatusBadge status={l.status} />
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void boostListing(l.id)}
                        className="sv-inst-action"
                      >
                        Boost 7 days
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </InstitutionShell>
  );
}
