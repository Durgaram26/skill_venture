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

  // mobileLinks removed — menu now uses rich card-based layout below

  return (
    <div className={`sv-app-shell min-h-screen bg-chalk text-ink ${location.pathname === '/' ? 'sv-home-shell' : ''}`} data-header-surface={headerSurface}>
      <header
        data-site-header
        data-header-surface={headerSurface}
        className={`sv-site-header sticky top-0 z-50 border-b ${
          dark
            ? 'border-white/10 bg-void text-white shadow-[0_1px_0_rgba(255,255,255,0.06)]'
            : 'border-line bg-paper text-ink shadow-sm'
        }`}
      >
        <div className="sv-site-header-row mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:gap-4 md:px-6 md:py-3">
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

          {/* Desktop nav — wrapped in plain div so hidden/lg:flex works without being overridden by .sv-nav-rail { display: inline-flex } */}
          <div className="ml-auto hidden lg:flex items-center">
            <nav className="sv-nav-rail" aria-label="Primary">
              <NavLink to="/" end className={location.pathname === '/' ? 'is-active' : undefined}>
                <i className="fas fa-home" aria-hidden />
                Home
              </NavLink>
              <Link
                to="/listings?type=course"
                className={location.pathname === '/listings' && listingType === 'course' ? 'is-active' : undefined}
              >
                <i className="fas fa-book-open" aria-hidden />
                Courses
              </Link>
              <Link
                to="/listings?type=bootcamp"
                className={location.pathname === '/listings' && listingType === 'bootcamp' ? 'is-active' : undefined}
              >
                <i className="fas fa-fire" aria-hidden />
                Bootcamps
              </Link>
              <Link
                to="/listings?type=hackathon"
                className={location.pathname === '/listings' && listingType === 'hackathon' ? 'is-active' : undefined}
              >
                <i className="fas fa-trophy" aria-hidden />
                Hackathons
              </Link>
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
                  <NavLink to="/student/jobs" className={navClass}>
                    <i className="fas fa-briefcase" aria-hidden />
                    My jobs
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
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
            <div className="lg:hidden">
              <button
                type="button"
                className={`sv-mobile-hamburger${menuOpen ? ' is-open' : ''}${dark ? ' dark' : ''}`}
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>

        {/* ── Premium Mobile Menu (DNA: ripple-reveal, icon cards, tactile CTA) ── */}
        <div
          className={`sv-ripple-menu absolute inset-x-0 top-full z-30 lg:hidden${menuOpen ? ' is-open' : ''}`}
        >
          <div className={`sv-mobile-menu-inner${dark ? ' dark' : ''}`}>

            {/* Search */}
            {!hideSearch ? (
              <div className="sv-mm-search">
                <SearchAutocomplete
                  value={q}
                  onChange={setQ}
                  onSubmit={onSearch}
                  dark={dark}
                  className="max-w-none"
                  placeholder="Search programs…"
                />
              </div>
            ) : null}

            {/* Logged-in profile strip */}
            {user ? (
              <div className="sv-mm-section">
                <UserProfileMenu dark={dark} variant="mobile" onNavigate={() => setMenuOpen(false)} />
              </div>
            ) : null}

            {/* Browse cards */}
            <div className="sv-mm-section">
              <p className="sv-mm-label">Browse</p>
              <div className="sv-mm-grid">
                <NavLink to="/" end className="sv-mm-card" onClick={() => setMenuOpen(false)}>
                  <span className="sv-mm-icon" style={{ background: 'linear-gradient(135deg,#1455d9,#3b82f6)' }}>
                    <i className="fas fa-home" />
                  </span>
                  <span className="sv-mm-card-text"><strong>Home</strong><small>Back to start</small></span>
                  <IconChevron className="sv-mm-chevron" />
                </NavLink>

                <Link to="/listings?type=course" className="sv-mm-card" onClick={() => setMenuOpen(false)}>
                  <span className="sv-mm-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                    <i className="fas fa-book-open" />
                  </span>
                  <span className="sv-mm-card-text"><strong>Courses</strong><small>Learn at your pace</small></span>
                  <IconChevron className="sv-mm-chevron" />
                </Link>

                <Link to="/listings?type=bootcamp" className="sv-mm-card" onClick={() => setMenuOpen(false)}>
                  <span className="sv-mm-icon" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                    <i className="fas fa-fire" />
                  </span>
                  <span className="sv-mm-card-text"><strong>Bootcamps</strong><small>Live intensive training</small></span>
                  <IconChevron className="sv-mm-chevron" />
                </Link>

                <Link to="/listings?type=hackathon" className="sv-mm-card" onClick={() => setMenuOpen(false)}>
                  <span className="sv-mm-icon" style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}>
                    <i className="fas fa-trophy" />
                  </span>
                  <span className="sv-mm-card-text"><strong>Hackathons</strong><small>Compete &amp; win prizes</small></span>
                  <IconChevron className="sv-mm-chevron" />
                </Link>
              </div>
            </div>

            {/* Student account links */}
            {user?.role === 'student' ? (
              <div className="sv-mm-section">
                <p className="sv-mm-label">My Account</p>
                <div className="sv-mm-list">
                  <NavLink to="/student/enquiries" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <IconBook className="sv-mm-row-icon" /><span>My Learning</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                  <NavLink to="/student/jobs" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-briefcase sv-mm-row-icon" /><span>My Jobs</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                  <NavLink to="/student/bookmarks" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <IconBookmark className="sv-mm-row-icon" /><span>Saved</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                </div>
              </div>
            ) : null}

            {/* Institution links */}
            {user?.role === 'institution' ? (
              <div className="sv-mm-section">
                <p className="sv-mm-label">Instructor</p>
                <div className="sv-mm-list">
                  <NavLink to="/institution" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-layer-group sv-mm-row-icon" /><span>Instructor Hub</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                  <NavLink to="/institution/billing" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-credit-card sv-mm-row-icon" /><span>Billing</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                </div>
              </div>
            ) : null}

            {/* Admin link */}
            {isAdmin ? (
              <div className="sv-mm-section">
                <div className="sv-mm-list">
                  <NavLink to="/admin" className="sv-mm-row" onClick={() => setMenuOpen(false)}>
                    <IconShield className="sv-mm-row-icon" /><span>Admin Panel</span><IconChevron className="sv-mm-chevron" />
                  </NavLink>
                </div>
              </div>
            ) : null}

            {/* Guest CTA */}
            {!user ? (
              <div className="sv-mm-cta">
                <Link to="/login" className="sv-mm-cta-login" onClick={() => setMenuOpen(false)}>
                  <i className="fas fa-sign-in-alt" /> Login
                </Link>
                <Link to="/register" className="sv-mm-cta-register" onClick={() => setMenuOpen(false)}>
                  <i className="fas fa-rocket" /> Get Started Free
                </Link>
              </div>
            ) : null}

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
        <footer className="sv-site-footer mt-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div>
                <div className="mb-4"><BrandWordmark compact onDark /></div>
                <p className="sv-footer-muted max-w-sm leading-7">Discover. Learn. Compete. Get Hired.</p>
                <p className="sv-footer-muted mt-3 max-w-sm text-sm leading-6">SkillVentures is a student-focused platform that helps you discover courses, join bootcamps, participate in hackathons, explore job opportunities, and build your professional profile—all in one place.</p>
              </div>
              <div>
                <h4 className="mb-4 text-lg font-semibold">Explore</h4>
                <ul className="sv-footer-muted space-y-2 text-sm">
                  <li><Link to="/listings?type=course">Courses</Link></li>
                  <li><Link to="/listings?type=bootcamp">Bootcamps</Link></li>
                  <li><Link to="/listings?type=hackathon">Hackathons</Link></li>
                  <li><Link to="/listings">Job Updates</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-lg font-semibold">For Students</h4>
                <ul className="sv-footer-muted space-y-2 text-sm">
                  <li><Link to="/profile/view">Create Your Profile</Link></li>
                  <li><Link to="/listings">Discover Courses</Link></li>
                  <li><Link to="/listings?type=bootcamp">Find Bootcamps</Link></li>
                  <li><Link to="/listings?type=hackathon">Join Hackathons</Link></li>
                  <li><Link to="/listings">Explore Job Opportunities</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-lg font-semibold">For Institutions</h4>
                <ul className="sv-footer-muted space-y-2 text-sm">
                  <li><Link to="/register?role=institution">List Your Courses</Link></li>
                  <li><Link to="/register?role=institution">Promote Bootcamps</Link></li>
                  <li><Link to="/register?role=institution">Host Hackathons</Link></li>
                  <li><Link to="/register?role=institution">Reach Students</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-3">
              <div><h4 className="mb-3 font-semibold">Company</h4><ul className="sv-footer-muted space-y-2 text-sm"><li><Link to="/">About SkillVentures</Link></li><li><a href="mailto:helloskillventures@gmail.com">Contact Us</a></li></ul></div>
              <div><h4 className="mb-3 font-semibold">Stay Connected</h4><p className="sv-footer-muted text-sm leading-6">Discover new learning opportunities, competitions, and career updates with SkillVentures.</p></div>
              <div><h4 className="mb-3 font-semibold">Email</h4><a className="sv-footer-muted text-sm" href="mailto:helloskillventures@gmail.com">helloskillventures@gmail.com</a></div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>© 2026 SkillVentures. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

/** @deprecated use MarketplaceShell */
export const AppShell = MarketplaceShell;
