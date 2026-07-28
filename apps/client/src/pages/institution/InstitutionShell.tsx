import { Link, NavLink, useLocation } from 'react-router-dom';
import type { ReactNode, SVGProps } from 'react';
import { MarketplaceShell } from '../../components/AppShell';
import { useAuthStore } from '../../features/auth/authStore';

function IconHub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

function IconChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <path d="M8 15v-3M12 15V8M16 15v-6" strokeLinecap="round" />
    </svg>
  );
}

function IconBilling(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 5h16v14H4z" strokeLinejoin="round" />
      <path d="M4 15h4l1.5 2h5L16 15h4" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { to: '/institution', end: true, label: 'Hub', Icon: IconHub },
  { to: '/institution?tab=enquiries', end: true, label: 'Enquiries', Icon: IconInbox },
  { to: '/institution/analytics', end: false, label: 'Analytics', Icon: IconChart },
  { to: '/institution/billing', end: false, label: 'Billing', Icon: IconBilling },
] as const;

export function InstitutionGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'institution') {
    return (
      <MarketplaceShell title="Instructor hub">
        <div className="sv-ticket rounded-md p-8 text-center">
          <p className="font-display text-xl font-bold">Institution access only</p>
          <p className="mt-2 text-sm text-mute">Sign in with a partner account to manage programs.</p>
          <Link to="/register?role=institution" className="sv-btn-primary mt-4 inline-flex">
            Become a partner
          </Link>
        </div>
      </MarketplaceShell>
    );
  }

  return <>{children}</>;
}

export function InstitutionShell({
  title,
  subtitle,
  children,
  error,
  actions,
  enquiryCount = 0,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  error?: string | null;
  actions?: ReactNode;
  enquiryCount?: number;
}) {
  const location = useLocation();
  return (
    <InstitutionGate>
      <MarketplaceShell>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Partner</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-mute">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <nav aria-label="Institution sections" className="sv-admin-tabs mb-6">
          {NAV.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => {
                const enquiriesActive = to.includes('tab=enquiries') && location.search.includes('tab=enquiries');
                const hubActive = to === '/institution' && location.pathname === '/institution' && !location.search;
                const active = to.includes('tab=enquiries')
                  ? enquiriesActive
                  : to === '/institution'
                    ? hubActive
                    : isActive;
                return active ? 'is-active' : undefined;
              }}
            >
              <Icon />
              {label}
              {label === 'Enquiries' && enquiryCount > 0 ? (
                <span className="sv-tab-count" aria-label={`${enquiryCount} enquiries`}>
                  {enquiryCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {error ? (
          <p
            className="mb-5 rounded-lg bg-spark-soft px-4 py-3 text-sm font-semibold text-[#b45309]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {children}
      </MarketplaceShell>
    </InstitutionGate>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="sv-inst-empty rounded-md border border-dashed border-line bg-paper px-6 py-12 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-mute">{hint}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  const tone =
    status === 'published'
      ? 'sv-inst-badge--published'
      : status === 'pending_review'
        ? 'sv-inst-badge--pending'
        : status === 'draft'
          ? 'sv-inst-badge--draft'
          : status === 'new'
            ? 'sv-inst-badge--new'
            : status === 'contacted'
              ? 'sv-inst-badge--contacted'
              : status === 'converted'
                ? 'sv-inst-badge--converted'
                : 'sv-inst-badge--muted';

  return <span className={`sv-inst-badge ${tone}`}>{label}</span>;
}
