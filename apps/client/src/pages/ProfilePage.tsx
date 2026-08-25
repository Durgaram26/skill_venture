import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarketplaceShell } from '../components/AppShell';
import { useAuthStore } from '../features/auth/authStore';
import { api, type PublicProfile, type JobSummary } from '../lib/api';

export function ProfilePage() {
  const { id } = useParams();
  const authUser = useAuthStore((state) => state.user);
  const isOwn = !id || id === authUser?.id;
  const [publicUser, setPublicUser] = useState<PublicProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<{ id: string; listing: { slug: string; title: string; type: string } }[]>([]);
  const [enquiries, setEnquiries] = useState<{ id: string; status: string; listing?: { slug?: string; title?: string; type?: string } }[]>([]);
  const [jobFeed, setJobFeed] = useState<JobSummary[]>([]);

  useEffect(() => {
    if (isOwn || !id) return;
    setPublicUser(null);
    setLoadFailed(false);
    api.publicProfile(id).then((result) => setPublicUser(result.user), () => setLoadFailed(true));
  }, [id, isOwn]);

  useEffect(() => {
    if (!isOwn || authUser?.role !== 'student') return;
    void Promise.allSettled([
      api.myBookmarks(),
      api.myStudentEnquiries(),
      api.studentJobFeed(),
    ]).then(([bookmarks, enquiryResult, jobResult]) => {
      if (bookmarks.status === 'fulfilled') setSavedPrograms(bookmarks.value.items.slice(0, 3));
      if (enquiryResult.status === 'fulfilled') setEnquiries(enquiryResult.value.items.slice(0, 3));
      if (jobResult.status === 'fulfilled') setJobFeed(jobResult.value.items.slice(0, 5));
    });
  }, [isOwn, authUser]);

  const user = isOwn ? authUser : publicUser;

  if (!user) {
    if (!isOwn) {
      return <MarketplaceShell title="Profile"><p className="text-mute">{loadFailed ? 'This profile is not available.' : 'Loading profile…'}</p></MarketplaceShell>;
    }
    return <MarketplaceShell title="Profile"><p className="text-mute">Please sign in to view your profile.</p><Link to="/login" className="sv-btn-primary mt-4 inline-flex">Log in</Link></MarketplaceShell>;
  }

  const initials = user.name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const completion = Math.round(([authUser?.name, authUser?.email, authUser?.phone, authUser?.profile?.avatar].filter(Boolean).length / 4) * 100);

  return (
    <MarketplaceShell fullWidth>
      <div className="sv-public-profile bg-slate-50">
        <section className="sv-profile-welcome overflow-hidden">
          <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 md:h-28 md:px-10">
            <div className="flex items-center gap-5">
              <div className="sv-profile-welcome-copy">
                <p>YOUR JOURNEY</p>
                <strong>Learn. Build. Grow.</strong>
                <span>Keep your goals and next steps in one place.</span>
              </div>
              <div className="sv-profile-welcome-left" aria-hidden>
                <span><i className="fas fa-code" /></span>
                <span><i className="fas fa-briefcase" /></span>
                <span><i className="fas fa-lightbulb" /></span>
              </div>
            </div>
            <div className="sv-profile-welcome-art" aria-hidden>
              <span><i className="fas fa-sparkles" /></span>
              <i className="fas fa-user-graduate" />
              <i className="sv-welcome-float sv-welcome-float--rocket fas fa-rocket" />
            </div>
          </div>
        </section>
        <main className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-9">
          <article className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_30px_rgba(76,29,149,.08)]">
            <div className="h-24 bg-gradient-to-r from-[#102d80] via-[#1455d9] to-[#6d28d9] md:h-32" />
            <div className="px-5 pb-7 md:px-8">
              <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4"><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#1455d9] text-3xl font-bold text-white shadow-lg">{user.profile?.avatar ? <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" /> : initials}</div><div className="sv-profile-name translate-y-3"><h2 className="font-display text-2xl font-extrabold leading-tight text-slate-950">{user.name} {user.profile?.emojiTag ? <span title="Profile emoji tag">{user.profile.emojiTag}</span> : null}</h2><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">{user.profile?.profileTitle || 'Student'} {isOwn ? <Link to="/profile" aria-label="Edit profile badge" title="Edit profile badge" className="ml-1 text-violet-500 hover:text-violet-800"><i className="fas fa-pen text-[10px]" aria-hidden /></Link> : null}</span></div></div>
                <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                  <ShareProfileButton userId={user.id} name={user.name} isOwn={isOwn} />
                  {isOwn ? <Link to="/profile" className="sv-btn-primary"><i className="fas fa-pen" aria-hidden />Edit profile</Link> : null}
                </div>
              </div>
              <div className="mt-8 grid gap-7 border-t border-slate-100 pt-7 md:grid-cols-[1fr_260px]">
                <section><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">About</p>{user.profile?.about ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{user.profile.about}</p> : <><h3 className="mt-2 font-display text-xl font-bold text-slate-950">Building skills for what comes next.</h3><p className="mt-3 text-sm leading-7 text-slate-600">Add a short introduction so institutions can understand your goals when you enquire about a program.</p></>}<div className="mt-6 flex flex-wrap gap-2"><span className="sv-profile-chip"><i className="fas fa-graduation-cap" aria-hidden />Learner</span>{user.profile?.currentEducationLevel ? <span className="sv-profile-chip"><i className="fas fa-book" aria-hidden />{user.profile.currentEducationLevel}</span> : null}{user.profile?.city ? <span className="sv-profile-chip"><i className="fas fa-location-dot" aria-hidden />{user.profile.city}</span> : null}</div></section>
                {isOwn && authUser ? <section className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Contact details</p><p className="mt-4 flex items-start gap-2 break-all text-sm text-slate-700"><i className="fas fa-envelope mt-1 text-[#1455d9]" aria-hidden />{authUser.email}</p>{authUser.phone ? <p className="mt-3 flex items-center gap-2 text-sm text-slate-700"><i className="fas fa-phone text-[#1455d9]" aria-hidden />{authUser.phone}</p> : <p className="mt-3 text-xs text-slate-500">Add a mobile number from profile settings.</p>}<p className="mt-4 text-xs text-slate-500">Contact details stay private — shared profiles never show them.</p></section> : null}
              </div>
            </div>
          </article>

          {isOwn ? <aside className="mt-6 grid gap-5 lg:grid-cols-3">
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">Profile strength</h3><span className="font-bold text-violet-700">{completion}%</span></div><div className="sv-profile-progress mt-3"><span style={{ width: `${completion}%` }} /></div><p className="mt-3 text-sm leading-6 text-slate-500">Complete your profile to make a stronger first impression.</p><Link to="/profile" className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:underline">Complete profile <i className="fas fa-arrow-right ml-2" aria-hidden /></Link></section>
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h3 className="font-bold text-slate-950">Your activity</h3><div className="mt-5 grid grid-cols-3 gap-2 text-center"><MiniStat value={String(savedPrograms.length)} label="Saved" icon="fa-bookmark" /><MiniStat value={String(enquiries.length)} label="Enquiries" icon="fa-paper-plane" /><MiniStat value="0" label="Badges" icon="fa-award" /></div></section>
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h3 className="font-bold text-slate-950"><i className="fas fa-shield-halved mr-2 text-emerald-500" aria-hidden />Your information is secure</h3><p className="mt-2 text-sm leading-6 text-slate-500">Your contact details are only used for institution follow-ups.</p></section>
          </aside> : null}
        </main>
        {isOwn ? <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-10 md:px-10 lg:grid-cols-2">
          <ActivityPanel title="Saved programs" icon="fa-bookmark" empty="You have not saved any programs yet." actionLabel="Explore programs" actionTo="/listings">
            {savedPrograms.map((item) => <Link key={item.id} to={`/listings/${item.listing.slug}`} className="sv-profile-activity-row"><span><strong>{item.listing.title}</strong><small>{item.listing.type}</small></span><i className="fas fa-arrow-right" aria-hidden /></Link>)}
          </ActivityPanel>
          <ActivityPanel title="Recent enquiries" icon="fa-paper-plane" empty="Your program enquiries will appear here." actionLabel="Find a program" actionTo="/listings">
            {enquiries.map((item) => <Link key={item.id} to={item.listing?.slug ? `/listings/${item.listing.slug}` : '/student/enquiries'} className="sv-profile-activity-row"><span><strong>{item.listing?.title ?? 'Program enquiry'}</strong><small className="capitalize">{item.status}</small></span><i className="fas fa-arrow-right" aria-hidden /></Link>)}
          </ActivityPanel>
          {/* ── Job opportunities matched by category ── */}
          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)] lg:col-span-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950">
              <i className="fas fa-briefcase text-[#1455d9]" aria-hidden />
              Job opportunities for you
              {jobFeed.length > 0 && (
                <span className="ml-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                  {jobFeed.length}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on courses and categories you've explored.
            </p>
            <div className="mt-4">
              {jobFeed.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No matching job posts yet. Enquire about more programs to unlock category-matched opportunities.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {jobFeed.map((job) => (
                    <li key={job.id} className="sv-job-feed-row">
                      <div className="sv-job-feed-icon" aria-hidden>
                        <i className="fas fa-briefcase" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm font-semibold text-slate-900">{job.title}</strong>
                          <span className="sv-job-feed-type">{job.jobType}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {job.institutionName ?? 'Institution'}
                          {' · '}{job.category}
                          {' · '}{job.location}
                          {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{job.description}</p>
                      </div>
                      {job.applyUrl ? (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                        >
                          Apply →
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </section> : null}
      </div>
    </MarketplaceShell>
  );
}

function ShareProfileButton({ userId, name, isOwn }: { userId: string; name: string; isOwn: boolean }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  const linkRef = useRef<HTMLInputElement>(null);
  const url = `${window.location.origin}/u/${userId}`;
  const text = isOwn ? `Here is my SkillVentures profile: ${url}` : `${name} on SkillVentures: ${url}`;
  const targets = [
    { label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'text-[#25d366]', href: `https://wa.me/?text=${encodeURIComponent(text)}` },
    { label: 'LinkedIn', icon: 'fa-brands fa-linkedin', color: 'text-[#0a66c2]', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: 'X', icon: 'fa-brands fa-x-twitter', color: 'text-slate-900', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
    { label: 'Facebook', icon: 'fa-brands fa-facebook', color: 'text-[#1877f2]', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'Email', icon: 'fas fa-envelope', color: 'text-slate-500', href: `mailto:?subject=${encodeURIComponent(isOwn ? 'My SkillVentures profile' : `${name} on SkillVentures`)}&body=${encodeURIComponent(text)}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      // No clipboard permission (or insecure origin) — let them copy it by hand.
      linkRef.current?.select();
    }
  }

  function nativeShare() {
    void navigator
      .share({ title: isOwn ? 'My SkillVentures profile' : `${name} on SkillVentures`, url })
      .catch(() => undefined);
  }

  return (
    <details className="sv-share relative">
      <summary
        className="sv-btn-ghost cursor-pointer list-none"
        onClick={(event) => {
          // Phones get the OS share sheet instead of our own menu.
          if (!navigator.share) return;
          event.preventDefault();
          nativeShare();
        }}
      >
        <i className="fas fa-share-nodes" aria-hidden />Share profile
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-[21rem] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.16)]">
        <h3 className="font-display text-lg font-bold text-violet-700">Social share</h3>
        <p className="mt-2 text-sm text-slate-500">Share this link via</p>
        <div
          className="mt-3 flex flex-wrap gap-2"
          onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
        >
          {targets.map((target) => (
            <a
              key={target.label}
              href={target.href}
              target="_blank"
              rel="noreferrer"
              className="sv-share-icon"
              aria-label={`Share via ${target.label}`}
              title={`Share via ${target.label}`}
            >
              <i className={`${target.icon} ${target.color}`} aria-hidden />
            </a>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-500">Copy link</p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2.5">
          <i className="fas fa-link text-violet-500" aria-hidden />
          <input
            ref={linkRef}
            readOnly
            value={url}
            aria-label="Profile link"
            onFocus={(event) => event.currentTarget.select()}
            className="w-full min-w-0 bg-transparent text-sm text-slate-600 outline-none"
          />
        </div>
        <button type="button" onClick={() => void copyLink()} className="sv-btn-primary mt-4 w-full justify-center">
          <i className={`fas ${state === 'copied' ? 'fa-check' : 'fa-copy'}`} aria-hidden />
          {state === 'copied' ? 'Copied' : 'Copy'}
        </button>
      </div>
    </details>
  );
}

function MiniStat({ value, label, icon }: { value: string; label: string; icon: string }) { return <div><i className={`fas ${icon} text-lg text-[#1455d9]`} aria-hidden /><strong className="mt-2 block text-xl text-slate-950">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></div>; }
function ActivityPanel({ title, icon, empty, actionLabel, actionTo, children }: { title: string; icon: string; empty: string; actionLabel: string; actionTo: string; children: React.ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950"><i className={`fas ${icon} text-[#1455d9]`} aria-hidden />{title}</h2><div className="mt-4">{hasItems ? children : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{empty}</div>}</div><Link to={actionTo} className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:underline">{actionLabel}<i className="fas fa-arrow-right ml-2" aria-hidden /></Link></section>;
}
