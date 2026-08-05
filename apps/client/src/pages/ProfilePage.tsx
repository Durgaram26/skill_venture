import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarketplaceShell } from '../components/AppShell';
import { useAuthStore } from '../features/auth/authStore';
import { api, type PublicProfile } from '../lib/api';

export function ProfilePage() {
  const { id } = useParams();
  const authUser = useAuthStore((state) => state.user);
  const isOwn = !id || id === authUser?.id;
  const [publicUser, setPublicUser] = useState<PublicProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<{ id: string; listing: { slug: string; title: string; type: string } }[]>([]);
  const [enquiries, setEnquiries] = useState<{ id: string; status: string; listing?: { slug?: string; title?: string; type?: string } }[]>([]);

  useEffect(() => {
    if (isOwn || !id) return;
    setPublicUser(null);
    setLoadFailed(false);
    api.publicProfile(id).then((result) => setPublicUser(result.user), () => setLoadFailed(true));
  }, [id, isOwn]);

  useEffect(() => {
    if (!isOwn || authUser?.role !== 'student') return;
    void Promise.allSettled([api.myBookmarks(), api.myStudentEnquiries()]).then(([bookmarks, enquiryResult]) => {
      if (bookmarks.status === 'fulfilled') setSavedPrograms(bookmarks.value.items.slice(0, 3));
      if (enquiryResult.status === 'fulfilled') setEnquiries(enquiryResult.value.items.slice(0, 3));
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
        <section className="sv-profile-hero overflow-hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-5 py-10 md:px-10 md:py-14">
            <div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">Learner profile</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">{isOwn ? 'Your learning identity' : user.name}</h1><p className="mt-4 max-w-lg text-base leading-7 text-slate-600">A simple profile institutions can understand at a glance.</p></div>
            <div className="sv-profile-hero-art hidden h-36 w-[38%] md:block" aria-hidden><div className="sv-profile-art-card"><i className="fas fa-user-graduate text-5xl" /></div><div className="sv-profile-art-pencil">✎</div><div className="sv-profile-art-dots" /></div>
          </div>
        </section>

        <main className={`mx-auto grid max-w-6xl items-start gap-6 px-5 py-7 md:px-10 md:py-9 ${isOwn ? 'lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]' : ''}`}>
          <article className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_30px_rgba(76,29,149,.08)]">
            <div className="h-24 bg-gradient-to-r from-[#102d80] via-[#1455d9] to-[#6d28d9] md:h-32" />
            <div className="px-5 pb-7 md:px-8">
              <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4"><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#1455d9] text-3xl font-bold text-white shadow-lg">{user.profile?.avatar ? <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" /> : initials}</div><div className="sv-profile-name translate-y-3"><h2 className="font-display text-2xl font-extrabold leading-tight text-slate-950">{user.name}</h2><span className="mt-1 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold capitalize text-violet-700">{user.role.replace('_', ' ')}</span></div></div>
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

          {isOwn ? <aside className="space-y-5">
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
        </section> : null}
      </div>
    </MarketplaceShell>
  );
}

function ShareProfileButton({ userId, name, isOwn }: { userId: string; name: string; isOwn: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const url = `${window.location.origin}/u/${userId}`;

  async function share() {
    const title = isOwn ? 'My SkillVentures profile' : `${name} on SkillVentures`;
    if (navigator.share) {
      // Cancelling the native sheet rejects — nothing to report.
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2500);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => void share()} className="sv-btn-ghost">
        <i className={`fas ${state === 'copied' ? 'fa-check' : 'fa-share-nodes'}`} aria-hidden />
        {state === 'copied' ? 'Link copied' : 'Share profile'}
      </button>
      {state === 'failed' ? <span className="break-all text-xs text-slate-500">Copy this link: {url}</span> : null}
    </div>
  );
}

function MiniStat({ value, label, icon }: { value: string; label: string; icon: string }) { return <div><i className={`fas ${icon} text-lg text-[#1455d9]`} aria-hidden /><strong className="mt-2 block text-xl text-slate-950">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></div>; }
function ActivityPanel({ title, icon, empty, actionLabel, actionTo, children }: { title: string; icon: string; empty: string; actionLabel: string; actionTo: string; children: React.ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950"><i className={`fas ${icon} text-[#1455d9]`} aria-hidden />{title}</h2><div className="mt-4">{hasItems ? children : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{empty}</div>}</div><Link to={actionTo} className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:underline">{actionLabel}<i className="fas fa-arrow-right ml-2" aria-hidden /></Link></section>;
}
