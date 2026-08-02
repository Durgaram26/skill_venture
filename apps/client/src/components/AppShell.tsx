import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { UserProfileMenu } from './UserProfileMenu';
import { SearchAutocomplete } from './SearchAutocomplete';
import { BrandWordmark } from './BrandWordmark';

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
  hideSearch = false,
  fullWidth = false,
  hideFooter = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  bare?: boolean;
  hideSearch?: boolean;
  fullWidth?: boolean;
  hideFooter?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
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
  const listingType = new URLSearchParams(location.search).get('type');

  const mobileLinks: { to: string; label: string; end?: boolean }[] = [
    { to: '/listings', label: 'Explore' },
    // Compare is intentionally hidden for now; the route remains available for later.
  ];
  if (user?.role === 'student') {
    mobileLinks.push(
      { to: '/student/enquiries', label: 'My learning' },
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
    mobileLinks.push({ to: '/login', label: 'Login' });
  }

  return (
    <div className="sv-app-shell min-h-screen bg-chalk text-ink" data-header-surface={headerSurface}>
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
            className="flex shrink-0 items-center"
          >
            <BrandWordmark compact />
          </Link>

          {!bare && !hideSearch ? (
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
            <NavLink to="/" end className={location.pathname === '/' ? 'is-active' : undefined}>
              <i className="fas fa-home" aria-hidden />
              Home
            </NavLink>
            <NavLink
              to="/listings?type=course"
              className={location.pathname === '/listings' && listingType === 'course' ? 'is-active' : undefined}
            >
              <i className="fas fa-book-open" aria-hidden />
              Courses
            </NavLink>
            <NavLink
              to="/listings?type=bootcamp"
              className={location.pathname === '/listings' && listingType === 'bootcamp' ? 'is-active' : undefined}
            >
              <i className="fas fa-fire" aria-hidden />
              Bootcamps
            </NavLink>
            <NavLink
              to="/listings?type=hackathon"
              className={location.pathname === '/listings' && listingType === 'hackathon' ? 'is-active' : undefined}
            >
              <i className="fas fa-trophy" aria-hidden />
              Hackathons
            </NavLink>
            {user?.role === 'institution' ? (
              <NavLink to="/institution" className={navClass}>
                <i className="fas fa-layer-group" aria-hidden />
                Hub
              </NavLink>
            ) : null}
            {user?.role === 'student' ? (
              <>
                <NavLink to="/student/enquiries" className={navClass}>
                  <IconBook />
                  My learning
                </NavLink>
                {/* Student payments are temporarily disabled; keep this route for future use. */}
                <NavLink to="/student/bookmarks" className={navClass}>
                  <IconBookmark />
                  Saved
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
                      Login
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
          {!hideSearch ? (
            <SearchAutocomplete
              value={q}
              onChange={setQ}
              onSubmit={onSearch}
              dark={dark}
              className="mb-4 max-w-none"
              placeholder="Search programs…"
            />
          ) : null}
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

      <main className={bare || fullWidth ? '' : 'mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10'}>
        {title ? (
          <div className="mb-8 animate-rise">
            <div className="mb-2"><BrandWordmark compact /></div>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-mute">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>

      {!bare && !hideFooter ? (
        <footer className="mt-auto bg-gray-900 py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="mb-4"><BrandWordmark compact onDark /></div>
                <p className="text-gray-400">
                  The discovery layer for India&apos;s courses, bootcamps, and hackathons.
                </p>
              </div>
              <div>
                <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link to="/listings" className="hover:text-white">
                      Explore
                    </Link>
                  </li>
                  {/* Compare navigation is temporarily hidden; restore when the feature is ready. */}
                  <li>
                    <Link to="/register?role=institution" className="hover:text-white">
                      Become a partner
                    </Link>
                  </li>
                  <li>
                    <Link to="/institution/billing" className="hover:text-white">
                      Plans &amp; billing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-lg font-semibold">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <i className="fas fa-envelope mr-2" aria-hidden /> hello@skillventures.com
                  </li>
                  <li>
                    <i className="fas fa-phone mr-2" aria-hidden /> +91 98765 43210
                  </li>
                  <li>
                    <i className="fas fa-map-marker-alt mr-2" aria-hidden /> Bengaluru, India
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>© {new Date().getFullYear()} SkillVentures. All rights reserved. | Prices in Indian Rupees (₹)</p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

/** @deprecated use MarketplaceShell */
export const AppShell = MarketplaceShell;
