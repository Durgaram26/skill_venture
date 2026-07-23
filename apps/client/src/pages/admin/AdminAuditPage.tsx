import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, SuperAdminGate } from './AdminShell';

type LogItem = Awaited<ReturnType<typeof api.adminAuditLogs>>['items'][number];

export function AdminAuditPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<LogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    setLoading(true);
    void api
      .adminAuditLogs()
      .then((r) => setItems(r.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load audit log');
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SuperAdminGate>
      <AdminShell
        title="Audit log"
        subtitle="Trace every admin action — verifications, moderation, bans, and settings."
        error={error}
      >
        {loading ? (
          <p className="text-sm text-mute">Loading audit entries…</p>
        ) : items.length === 0 ? (
          <EmptyQueue title="No entries yet" hint="Admin actions will appear here automatically." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-line bg-paper">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-chalk text-[11px] font-bold uppercase tracking-[0.1em] text-mute">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-chalk/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-mute">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{log.actor?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-mute">{log.actor?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-teal">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-mute">
                      {log.entityType} · …{log.entityId.slice(-6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminShell>
    </SuperAdminGate>
  );
}
