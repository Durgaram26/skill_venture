import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { api } from '../lib/api';
import { MarketplaceShell } from '../components/AppShell';
import { BrandWordmark } from '../components/BrandWordmark';

/* ────────────────────────────────────────────────────────────
   SkillVentures home — reference mockup styling, real DB data.
   Featured courses / bootcamps / hackathons are pulled from the
   live listings API and link to real detail pages, so the same
   programs appear in Explore and can be enquired (guest or
   logged-in). Marketing sections (hero, stats, testimonials,
   CTA) are static.
   ──────────────────────────────────────────────────────────── */

function formatPriceINR(amount: number, isFree: boolean): string {
  if (isFree || amount === 0) return 'FREE';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : 'TBA');

export function HomePage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);

  useEffect(() => {
    void api.listListings(new URLSearchParams()).then((res) => {
      const sorted = [...res.items].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
      setListings(sorted);
    });
  }, []);

  const byType = (t: ListingSummary['type']) => listings.filter((l) => l.type === t);
  const courses = byType('course').slice(0, 3);
  const bootcamps = byType('bootcamp').slice(0, 3);
  const hackathons = byType('hackathon').slice(0, 2);

  return (
    <MarketplaceShell fullWidth hideFooter>
      <div className="sv-mock sv-home-theme bg-white">
      {/* Hero */}
      <section className="sv-home-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 md:grid-cols-[.92fr_1.08fr] md:px-10 md:py-16">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 md:text-5xl">
              Launch Your<br /><span className="text-orange-500">SkillVentures</span> Journey
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-600 md:text-base">
              Master new skills through interactive courses, live bootcamps, and group learning experiences. Learn better together.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/listings?type=course" className="sv-home-blue-btn"><i className="fas fa-book-open" />Explore Courses</Link>
              <Link to="/listings?type=hackathon" className="sv-home-outline-btn"><i className="fas fa-trophy" />Join Hackathons</Link>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-slate-700"><span className="sv-avatar-stack"><i /> <i /> <i /> <i /></span> Join <strong className="text-blue-700">10,000+</strong> learners building their future</div>
          </div>
          <div className="sv-home-hero-visual" aria-label="Learning illustration placeholder">
            <div className="sv-progress-card"><small>Your Progress</small><strong>75%</strong><span>Keep going!</span></div>
            <div className="sv-hero-image-slot"><img src="/images/home-girl.png" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div>
            <div className="sv-certificate-card">▣ &nbsp; Certificates Earned<br /><strong>12</strong></div>
            <div className="sv-hero-dots" />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon="fa-book-open"
            iconColor="text-blue-600"
            title="Featured Courses"
            sub="Handpicked courses to kickstart your learning journey"
            linkTo="/listings?type=course"
            linkLabel="View All Courses"
            linkColor="text-purple-600 hover:text-purple-800"
          />
          <Grid empty="No courses listed yet." items={courses}>
            {courses.map((l) => (
              <CourseCard key={l.id} listing={l} />
            ))}
          </Grid>
        </div>
      </section>

      {/* Featured Bootcamps */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon="fa-person-chalkboard"
            iconColor="text-orange-500"
            title="Live Bootcamps"
            sub="Interactive, intensive learning experiences starting soon"
            linkTo="/listings?type=bootcamp"
            linkLabel="View All Bootcamps"
            linkColor="text-orange-600 hover:text-orange-800"
          />
          <Grid empty="No bootcamps listed yet." items={bootcamps}>
            {bootcamps.map((l) => (
              <BootcampCard key={l.id} listing={l} />
            ))}
          </Grid>
        </div>
      </section>

      {/* Featured Hackathons */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon="fa-trophy"
            iconColor="text-yellow-400"
            title="Upcoming Hackathons"
            sub="Compete, learn, and win amazing prizes"
            titleColor="text-white"
            subColor="text-gray-300"
            linkTo="/listings?type=hackathon"
            linkLabel="View All Hackathons"
            linkColor="text-yellow-400 hover:text-yellow-300"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {hackathons.length === 0 ? (
              <p className="text-gray-400">No hackathons listed yet.</p>
            ) : (
              hackathons.map((l) => <HackathonCard key={l.id} listing={l} />)
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 section-title">What Our Students Say</h2>
            <p className="text-gray-600 mt-8 max-w-3xl mx-auto">
              Join thousands of successful learners who transformed their careers with SkillVentures
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial
              img="https://randomuser.me/api/portraits/women/32.jpg"
              name="Priya Sharma"
              role="Full Stack Developer"
              quote='"The Full Stack Bootcamp completely changed my career. Landed a job at a tech startup with 100% salary hike!"'
            />
            <Testimonial
              img="https://randomuser.me/api/portraits/men/54.jpg"
              name="Rahul Verma"
              role="Data Scientist"
              quote='"The Data Science course provided real-world projects that helped me build an impressive portfolio. Got 3 job offers!"'
            />
            <Testimonial
              img="https://randomuser.me/api/portraits/women/67.jpg"
              name="Ananya Patel"
              role="UX Designer"
              quote='"Won my first hackathon through SkillVentures! The experience and prize money kickstarted my freelance career."'
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sv-home-cta py-16 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="relative mx-auto max-w-[1580px] px-4 sm:px-8 lg:px-12 text-center">
          <div className="sv-cta-rocket"><img src="/images/home-rocket.png" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div>
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who have already started their journey with SkillVentures
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/listings" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-lg">
              <i className="fas fa-book-open mr-2" />Start Learning
            </Link>
            <Link to="/listings?type=hackathon" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors text-lg">
              <i className="fas fa-trophy mr-2" />Join Competition
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4"><BrandWordmark compact onDark /></div>
              <p className="text-gray-400">
                Launch your learning journey with interactive courses, bootcamps, and hackathons.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/listings?type=course" className="hover:text-white">Courses</Link></li>
                <li><Link to="/listings?type=bootcamp" className="hover:text-white">Bootcamps</Link></li>
                <li><Link to="/listings?type=hackathon" className="hover:text-white">Hackathons</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><i className="fas fa-envelope mr-2" /> hello@skillventures.com</li>
                <li><i className="fas fa-phone mr-2" /> +91 98765 43210</li>
                <li><i className="fas fa-map-marker-alt mr-2" /> Bengaluru, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 SkillVentures. All rights reserved. | Prices in Indian Rupees (₹)</p>
          </div>
        </div>
      </footer>
      </div>
    </MarketplaceShell>
  );
}

/* ──────────────── Sub-components ──────────────── */

function SectionHead({
  icon,
  iconColor,
  title,
  sub,
  titleColor = 'text-gray-900',
  subColor = 'text-gray-600',
  linkTo,
  linkLabel,
  linkColor,
}: {
  icon: string;
  iconColor: string;
  title: string;
  sub: string;
  titleColor?: string;
  subColor?: string;
  linkTo: string;
  linkLabel: string;
  linkColor: string;
}) {
  return (
    <div className="flex justify-between items-center mb-12">
      <div>
        <h2 className={`text-3xl font-bold ${titleColor} section-title`}>
          <i className={`fas ${icon} ${iconColor} mr-3`} aria-hidden="true" />
          {title}
        </h2>
        <p className={`${subColor} mt-8`}>{sub}</p>
      </div>
      <Link to={linkTo} className={`${linkColor} font-medium flex items-center`}>
        {linkLabel} <i className="fas fa-arrow-right ml-2" />
      </Link>
    </div>
  );
}


function Grid({
  items,
  empty,
  children,
}: {
  items: ListingSummary[];
  empty: string;
  children: React.ReactNode;
}) {
  if (items.length === 0) return <p className="text-gray-500">{empty}</p>;
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{children}</div>;
}

function CoverImage({ listing, className }: { listing: ListingSummary; className: string }) {
  const cover = listing.images?.[0];
  if (cover) return <img src={cover} alt={listing.title} className={className} />;
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white`}
      aria-hidden
    >
      <i className="fas fa-graduation-cap text-4xl opacity-80" />
    </div>
  );
}

function ModeBadge({ mode }: { mode: ListingSummary['mode'] }) {
  const cls =
    mode === 'online'
      ? 'bg-green-100 text-green-800'
      : mode === 'offline'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-purple-100 text-purple-800';
  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{cap(mode)}</span>;
}

function CourseCard({ listing }: { listing: ListingSummary }) {
  return (
    <div className="course-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl border border-gray-200">
      <Link to={`/listings/${listing.slug}`}>
        <CoverImage listing={listing} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">{listing.title}</h3>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded whitespace-nowrap ml-2">
            {listing.category}
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{listing.description}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-yellow-500 font-semibold">
              <i className="fas fa-star mr-1" aria-hidden />
              {listing.rating.avg.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm ml-1">({listing.rating.count})</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {formatPriceINR(listing.fee.amount, listing.fee.isFree)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>
            <i className="fas fa-calendar-alt mr-1" aria-hidden />
            {listing.duration.value} {listing.duration.unit}
          </span>
          <ModeBadge mode={listing.mode} />
        </div>
        <Link to={`/listings/${listing.slug}`} className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200">
          View Details
        </Link>
      </div>
    </div>
  );
}

function BootcampCard({ listing }: { listing: ListingSummary }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-orange-200 hover:shadow-xl transition-all duration-300">
      <div className="relative">
        <Link to={`/listings/${listing.slug}`}>
          <CoverImage listing={listing} className="w-full h-48 object-cover" />
        </Link>
        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          <i className="fas fa-fire mr-1" />Live Bootcamp
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1">{listing.title}</h3>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded whitespace-nowrap ml-2">
            {listing.category}
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{listing.description}</p>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Starts:</span>
            <span className="text-sm font-semibold">{shortDate(listing.bootcamp?.startDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Duration:</span>
            <span className="text-sm font-semibold">{listing.duration.value} {listing.duration.unit}</span>
          </div>
          {typeof listing.bootcamp?.seatsAvailable === 'number' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Seats left:</span>
              <span className="text-sm font-semibold">{listing.bootcamp.seatsAvailable}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-yellow-500 font-semibold">
              <i className="fas fa-star mr-1" aria-hidden />
              {listing.rating.avg.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm ml-1">({listing.rating.count})</span>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatPriceINR(listing.fee.amount, listing.fee.isFree)}
          </span>
        </div>
        <Link to={`/listings/${listing.slug}`} className="block w-full text-center bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors duration-200">
          <i className="fas fa-bolt mr-2" />Enroll Now
        </Link>
      </div>
    </div>
  );
}

function HackathonCard({ listing }: { listing: ListingSummary }) {
  const prize = listing.hackathon?.prizePool;
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-700">
      <Link to={`/listings/${listing.slug}`}>
        <CoverImage listing={listing} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white line-clamp-2 flex-1">{listing.title}</h3>
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap ml-2">
            {listing.category}
          </span>
        </div>
        <p className="text-gray-300 mb-4 line-clamp-2">{listing.description}</p>
        <div className="space-y-3 mb-4">
          {typeof prize === 'number' && prize > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Prize Pool:</span>
              <span className="text-sm font-semibold text-yellow-400">{formatPriceINR(prize, false)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Duration:</span>
            <span className="text-sm font-semibold">{listing.duration.value} {listing.duration.unit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Registration Fee:</span>
            <span className="text-sm font-semibold text-green-400">
              {formatPriceINR(listing.fee.amount, listing.fee.isFree)}
            </span>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Deadline:</span>
            <span className="font-semibold">{shortDate(listing.hackathon?.endDate ?? listing.hackathon?.startDate)}</span>
          </div>
        </div>
        <Link to={`/listings/${listing.slug}`} className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors duration-200">
          <i className="fas fa-trophy mr-2" />Register Now
        </Link>
      </div>
    </div>
  );
}

function Testimonial({ img, name, role, quote }: { img: string; name: string; role: string; quote: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-4">
        <img src={img} alt={name} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <h4 className="font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
      <div className="flex mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <i key={i} className="fas fa-star text-yellow-500" />
        ))}
      </div>
      <p className="text-gray-700">{quote}</p>
    </div>
  );
}
