import { useEffect, useRef, useState, type SVGProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { api } from '../lib/api';

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'Super admin';
    case 'admin':
      return 'Admin';
    case 'institution':
      return 'Institution';
    default:
      return 'Student';
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type UserProfileMenuProps = {
  dark?: boolean;
  variant?: 'rail' | 'mobile';
  onNavigate?: () => void;
};

export function UserProfileMenu({ dark, variant = 'rail', onNavigate }: UserProfileMenuProps) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const firstName = user.name.split(/\s+/)[0] ?? 'Profile';

  async function logout() {
    await api.logout();
    clearSession();
    setOpen(false);
    onNavigate?.();
    navigate('/');
  }

  function closeAndNavigate(path: string) {
    setOpen(false);
    onNavigate?.();
    navigate(path);
  }

  if (variant === 'mobile') {
    return (
      <div className="sv-profile-mobile-card mb-4">
        <div className="sv-profile-mobile-head">
          <span className="sv-profile-avatar" aria-hidden>
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold">{user.name}</p>
            <p className="truncate text-sm opacity-75">{user.email}</p>
            <span className="sv-profile-role-badge">{roleLabel(user.role)}</span>
          </div>
        </div>
        <div className="sv-profile-mobile-actions">
          <Link to="/profile" onClick={onNavigate}>
            Profile settings
          </Link>
          {/* Student payments are temporarily disabled; restore this link when payments launch. */}
          {user.role === 'institution' ? (
            <Link to="/institution/billing" onClick={onNavigate}>
              Billing & earnings
            </Link>
          ) : null}
          <button type="button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="sv-profile-menu relative">
      <button
        type="button"
        className={`sv-nav-rail-trigger ${open ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sv-profile-avatar sv-profile-avatar--sm" aria-hidden>
          {initials(user.name)}
        </span>
        <IconUser />
        {firstName}
      </button>

      {open ? (
        <div
          className={`sv-profile-dropdown ${dark ? 'sv-profile-dropdown--dark' : ''}`}
          role="menu"
        >
          <div className="sv-profile-dropdown-head">
            <span className="sv-profile-avatar" aria-hidden>
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-mute">{user.email}</p>
              <span className="sv-profile-role-badge">{roleLabel(user.role)}</span>
            </div>
          </div>
          <div className="sv-profile-dropdown-actions">
            <button type="button" role="menuitem" onClick={() => closeAndNavigate('/profile')}>
              Profile settings
            </button>
            {/* Student payments are temporarily disabled; restore this action when payments launch. */}
            {user.role === 'institution' ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => closeAndNavigate('/institution/billing')}
              >
                Billing & earnings
              </button>
            ) : null}
            <button type="button" role="menuitem" className="is-danger" onClick={() => void logout()}>
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
