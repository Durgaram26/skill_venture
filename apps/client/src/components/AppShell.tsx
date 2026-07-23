import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { UserProfileMenu } from './UserProfileMenu';
import { SearchAutocomplete } from './SearchAutocomplete';

function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconCompare(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M7 4v16M17 4v16" strokeLinecap="round" />
      <path d="M4 8h6M14 16h6" strokeLinecap="round" />
    </svg>
  );
}

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z" strokeLinejoin="round" />
      <path d="M8 7h8M8 11h6" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M7 4h10v16l-5-3-5 3V4z" strokeLinejoin="round" />
    </svg>
  );
}

function IconBuilding(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6M9 10h.01M12 10h.01M15 10h.01M9 14h.01M15 14h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'is-active' : undefined;
}

export function MarketplaceShell({
  children,
  title,
  subtitle,
  bare,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  bare?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSurface, setHeaderSurface] = useState<'dark' | 'light'>(bare ? 'dark' : 'light');

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // Absolute position drives surface (debug skill Bug 1/2) — never rely on delta alone
      if (bare) {
        const heroBand = Math.round(window.innerHeight * 0.55);
        const next = y < heroBand ? 'dark' : 'light';
        document.body.dataset.headerSurface = next;
        setHeaderSurface(next);
      } else {
        document.body.dataset.headerSurface = 'light';
        setHeaderSurface('light');
      }

      if (y < 24) {
        document.body.classList.remove('sv-scroll-down');
      } else if (y > lastY + 4) {
        document.body.classList.add('sv-scroll-down');
        setMenuOpen(false);
      } else if (y < lastY - 4) {
        document.body.classList.remove('sv-scroll-down');
      }
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('sv-scroll-down');
      delete document.body.dataset.headerSurface;
    };
  }, [bare]);

  function onSearch(term: string) {
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    navigate(`/listings?${params.toString()}`);
    setMenuOpen(false);
  }

  const dark = headerSurface === 'dark';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const mobileLinks: { to: string; label: string; end?: boolean }[] = [
    { to: '/listings', label: 'Explore' },
    { to: '/compare', label: 'Compare' },
  ];
  if (user?.role === 'student') {
    mobileLinks.push(
      { to: '/student/enquiries', label: 'My learning' },
      { to: '/student/payments', label: 'Payments' },
      { to: '/student/bookmarks', label: 'Saved' },
    );
  }
  if (user?.role === 'institution') {
    mobileLinks.push(
      { to: '/institution', label: 'Instructor hub' },
      { to: '/institution/billing', label: 'Billing' },
    );
  }
  if (isAdmin) {
    mobileLinks.push({ to: '/admin', label: 'Admin panel' });
  }
  if (!user) {
    mobileLinks.push({ to: '/login', label: 'Log in' }, { to: '/register', label: 'Join free' });
  }

  return (
    <div className="min-h-screen bg-chalk text-ink" data-header-surface={headerSurface}>
      <header
        data-site-header
        data-header-surface={headerSurface}
        className={`sticky top-0 z-50 border-b ${
          dark
            ? 'border-white/10 bg-void text-white shadow-[0_1px_0_rgba(255,255,255,0.06)]'
            : 'border-line bg-paper text-ink shadow-sm'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:gap-4 md:px-6 md:py-3">
          <Link
            to="/"
            className={`shrink-0 font-display text-xl font-extrabold tracking-tight md:text-2xl ${
              dark ? 'text-white' : 'text-ink'
            }`}
          >
            Skill<span className={dark ? 'text-teal-bright' : 'text-teal'}>Ventures</span>
          </Link>

          {!bare ? (
            <SearchAutocomplete
              value={q}
              onChange={setQ}
              onSubmit={onSearch}
              dark={dark}
              className="hidden md:block"
            />
          ) : (
            <div className="flex-1" />
          )}

          <nav className="sv-nav-rail ml-auto hidden lg:inline-flex" aria-label="Primary">
            <NavLink to="/listings" className={navClass}>
              <IconCompass />
              Explore
            </NavLink>
            <NavLink to="/compare" className={navClass}>
              <IconCompare />
              Compare
            </NavLink>
            {user?.role === 'student' ? (
              <>
                <NavLink to="/student/enquiries" className={navClass}>
                  <IconBook />
                  My learning
                </NavLink>
                <NavLink to="/student/payments" className={navClass}>
                  Payments
                </NavLink>
                <NavLink to="/student/bookmarks" className={navClass}>
                  <IconBookmark />
                  Saved
                </NavLink>
              </>
            ) : null}
            {user?.role === 'institution' ? (
              <>
                <NavLink to="/institution" end className={navClass}>
                  <IconBuilding />
                  Hub
                </NavLink>
                <NavLink to="/institution/billing" className={navClass}>
                  Billing
                </NavLink>
              </>
            ) : null}
            {isAdmin ? (
              <NavLink to="/admin" className={navClass}>
                <IconShield />
                Admin
              </NavLink>
            ) : null}
            {user ? <UserProfileMenu dark={dark} /> : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className={`hidden sm:inline-flex ${
                    dark
                      ? 'rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20'
                      : 'sv-btn-ghost'
                  }`}
                >
                  Log in
                </Link>
                <Link to="/register" className="sv-btn-accent">
                  Join free
                </Link>
              </>
            ) : null}
            <button
              type="button"
              className={
                dark
                  ? 'inline-flex items-center justify-center rounded-md border border-white/25 px-3 py-2 text-white lg:hidden'
                  : 'sv-btn-ghost lg:hidden'
              }
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div
          className={`sv-ripple-menu absolute inset-x-0 top-full z-30 border-b px-4 py-5 lg:hidden ${
            menuOpen ? 'is-open' : ''
          } ${dark ? 'border-white/10 bg-void text-white' : 'border-line bg-paper text-ink'}`}
        >
          {user ? (
            <UserProfileMenu
              dark={dark}
              variant="mobile"
              onNavigate={() => setMenuOpen(false)}
            />
          ) : null}
          <SearchAutocomplete
            value={q}
            onChange={setQ}
            onSubmit={onSearch}
            dark={dark}
            className="mb-4 max-w-none"
            placeholder="Search programs…"
          />
          <div className="sv-mobile-nav-list">
            {mobileLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.label}</span>
                <IconChevron className="h-4 w-4 opacity-50" />
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className={bare ? '' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10'}>
        {title ? (
          <div className="mb-8 animate-rise">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">SkillVentures</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-mute">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>

      {!bare ? (
        <footer className="sv-site-footer mt-auto">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-3 md:px-6">
            <div>
              <p className="font-display text-xl font-bold text-[#f1f5f4]">
                Skill<span className="sv-footer-brand-accent">Ventures</span>
              </p>
              <p className="sv-footer-muted mt-2 text-sm">
                The discovery layer for India&apos;s courses, bootcamps, and hackathons.
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[#f1f5f4]">Quick links</p>
              <div className="sv-capsule-nav">
                <Link to="/listings">Explore</Link>
                <Link to="/compare">Compare</Link>
                <Link to="/register?role=institution">Partner</Link>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-[#f1f5f4]">For institutions</p>
              <Link className="mt-2 block" to="/institution/billing">
                Plans & billing
              </Link>
            </div>
          </div>
          <p className="sv-footer-muted mx-auto mt-8 max-w-7xl px-4 text-xs md:px-6">
            © {new Date().getFullYear()} SkillVentures
          </p>
        </footer>
      ) : null}
    </div>
  );
}

/** @deprecated use MarketplaceShell */
export const AppShell = MarketplaceShell;
