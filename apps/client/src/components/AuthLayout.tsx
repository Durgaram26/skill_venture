import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Solid dark auth chrome — never rely on Tailwind bg-void alone
 * (same failure mode as Bug 8: light text with missing dark fill).
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="sv-auth-page min-h-screen">
      <div className="mx-auto grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="sv-auth-aside relative hidden flex-col justify-between overflow-hidden p-10 text-[#f1f5f4] lg:flex xl:p-12">
          {/* Full-opacity photo — detail sits on the right; left stays calm for copy */}
          <img
            src="/images/auth-workshop.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
            decoding="async"
          />
          {/* Scrim: stronger on the LEFT for text, lighter on the RIGHT so the photo reads */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(30, 27, 46,0.88) 0%, rgba(30, 27, 46,0.72) 38%, rgba(30, 27, 46,0.35) 68%, rgba(30, 27, 46,0.55) 100%)',
            }}
            aria-hidden
          />

          <div className="relative z-[1]">
            <Link to="/" className="font-display text-2xl font-extrabold tracking-tight drop-shadow-sm">
              Skill<span className="text-[#a78bfa]">Ventures</span>
            </Link>
          </div>

          <div className="relative z-[1] max-w-md py-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a78bfa]">
              Skill discovery
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold leading-[1.1] tracking-tight drop-shadow-sm xl:text-5xl">
              Your next program, one enquiry away.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#f1f5f4]/90">
              Courses, bootcamps, and hackathons — verified listings, clear fees, tracked replies.
            </p>
            <ul className="mt-8 space-y-3 border-l-2 border-[#a78bfa]/60 pl-4 text-sm leading-relaxed text-[#f1f5f4]/85">
              <li>Browse freely — sign in only to enquire</li>
              <li>One profile fills every application</li>
              <li>Reviews from converted applicants only</li>
            </ul>
          </div>

          <p className="relative z-[1] text-xs font-semibold text-[#f1f5f4]/75">
            © {new Date().getFullYear()} SkillVentures
          </p>
        </aside>

        <main className="sv-auth-main flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="mb-8 inline-block font-display text-xl font-extrabold tracking-tight text-[#111827] lg:hidden"
            >
              Skill<span className="text-[#7c3aed]">Ventures</span>
            </Link>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-5 text-sm text-[#4b5563]">{footer}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
