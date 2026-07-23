import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, FilterTabs } from './AdminShell';

type Ticket = Awaited<ReturnType<typeof api.adminSupportTickets>>['items'][number];
type StatusFilter = 'open' | 'in_progress' | 'resolved' | 'closed' | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export function AdminSupportPage() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<StatusFilter>('open');
  const [items, setItems] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await api.adminSupportTickets(status);
    setItems(result.items);
  }, [status]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load tickets');
      })
      .finally(() => setLoading(false));
  }, [user, reload]);

  async function updateTicket(id: string, body: { status?: string; adminNotes?: string }) {
    setBusyId(id);
    setError(null);
    try {
      await api.updateSupportTicket(id, body);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title="Support"
      subtitle="Resolve billing disputes, account issues, and partner escalations."
      error={error}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={status} options={FILTERS} onChange={setStatus} />
        <p className="text-xs font-semibold text-mute">
          {loading ? 'Loading…' : `${items.length} ticket${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-mute">Loading tickets…</p>
      ) : items.length === 0 ? (
        <EmptyQueue title="Queue clear" hint="No support tickets match this filter." />
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="sv-ticket rounded-md p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold">{t.subject}</p>
                    <span className="sv-stamp border-line text-mute">{t.status.replace('_', ' ')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-teal">
                      {t.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink">{t.body}</p>
                  <p className="mt-2 text-xs text-mute">
                    {t.reporterName ?? t.reporterEmail} ·{' '}
                    {new Date(t.createdAt).toLocaleString('en-IN')}
                  </p>
                  {t.adminNotes ? (
                    <p className="mt-2 rounded-md bg-chalk px-3 py-2 text-xs text-mute">
                      Note: {t.adminNotes}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {t.status === 'open' ? (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      className="sv-btn-primary text-xs disabled:opacity-50"
                      onClick={() => void updateTicket(t.id, { status: 'in_progress' })}
                    >
                      Start
                    </button>
                  ) : null}
                  {t.status !== 'resolved' && t.status !== 'closed' ? (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() =>
                        void updateTicket(t.id, {
                          status: 'resolved',
                          adminNotes: 'Resolved by admin',
                        })
                      }
                    >
                      Resolve
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
