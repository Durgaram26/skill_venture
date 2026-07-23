import { Link, NavLink } from 'react-router-dom';
import type { ReactNode, SVGProps } from 'react';
import { MarketplaceShell } from '../../components/AppShell';
import { useAuthStore } from '../../features/auth/authStore';

function IconGrid(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" strokeLinejoin="round" />
    </svg>
  );
}

function IconPartners(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function IconPrograms(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

function IconReviews(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path
        d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5M14 14.5c2.2.3 4 1.8 4 4.5" strokeLinecap="round" />
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

function IconSupport(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h4" strokeLinecap="round" />
    </svg>
  );
}

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconAudit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinejoin="round" />
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

const BASE_NAV = [
  { to: '/admin', end: true, label: 'Overview', Icon: IconGrid },
  { to: '/admin/institutions', end: false, label: 'Partners', Icon: IconPartners },
  { to: '/admin/listings', end: false, label: 'Programs', Icon: IconPrograms },
  { to: '/admin/reviews', end: false, label: 'Reviews', Icon: IconReviews },
  { to: '/admin/users', end: false, label: 'Users', Icon: IconUsers },
  { to: '/admin/support', end: false, label: 'Support', Icon: IconSupport },
  { to: '/admin/analytics', end: false, label: 'Analytics', Icon: IconChart },
] as const;

const SUPER_NAV = [
  { to: '/admin/admins', end: false, label: 'Team', Icon: IconShield },
  { to: '/admin/audit', end: false, label: 'Audit', Icon: IconAudit },
  { to: '/admin/settings', end: false, label: 'Settings', Icon: IconSettings },
] as const;

export function isAdminRole(role?: string) {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdminRole(role?: string) {
  return role === 'super_admin';
}

export function formatType(type: string): string {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!isAdminRole(user?.role)) {
    return (
      <MarketplaceShell title="Admin">
        <div className="sv-ticket rounded-md p-8 text-center">
          <p className="font-display text-xl font-bold">Admin access only</p>
          <p className="mt-2 text-sm text-mute">
            Sign in with an admin account to moderate the platform.
          </p>
          <Link to="/login" className="sv-btn-primary mt-4 inline-flex">
            Sign in
          </Link>
        </div>
      </MarketplaceShell>
    );
  }

  return <>{children}</>;
}

export function SuperAdminGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!isSuperAdminRole(user?.role)) {
    return (
      <AdminShell title="Super admin only" subtitle="This section is restricted to platform owners.">
        <div className="sv-ticket rounded-md p-8 text-center">
          <p className="font-display text-xl font-bold">Owner access required</p>
          <p className="mt-2 text-sm text-mute">
            Sign in with a super admin account to manage team, audit logs, and platform settings.
          </p>
          <Link to="/admin" className="sv-btn-primary mt-4 inline-flex">
            Back to admin
          </Link>
        </div>
      </AdminShell>
    );
  }

  return <>{children}</>;
}

export function AdminShell({
  title,
  subtitle,
  children,
  error,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  error?: string | null;
}) {
  const user = useAuthStore((s) => s.user);
  const isSuper = isSuperAdminRole(user?.role);

  return (
    <AdminGate>
      <MarketplaceShell>
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Admin</p>
            {isSuper ? (
              <span className="rounded-full bg-void px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Super admin
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-mute">{subtitle}</p> : null}
        </div>

        <nav aria-label="Admin sections" className="sv-admin-tabs mb-6">
          {BASE_NAV.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
          {isSuper
            ? SUPER_NAV.map(({ to, end, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    isActive ? 'is-active !border-spark !bg-spark !shadow-[0_3px_0_#9a4f1f]' : undefined
                  }
                >
                  <Icon />
                  {label}
                </NavLink>
              ))
            : null}
        </nav>

        {error ? (
          <p
            className="mb-5 rounded-lg bg-spark-soft px-4 py-3 text-sm font-semibold text-[#9a4f1f]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {children}
      </MarketplaceShell>
    </AdminGate>
  );
}

export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={
              active
                ? 'rounded-md bg-ink px-3 py-1.5 text-xs font-bold text-white'
                : 'rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-mute hover:text-ink'
            }
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyQueue({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-paper px-5 py-10 text-center">
      <p className="font-display font-bold">{title}</p>
      <p className="mt-1 text-sm text-mute">{hint}</p>
    </div>
  );
}
