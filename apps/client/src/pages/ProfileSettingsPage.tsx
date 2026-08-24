import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MarketplaceShell } from '../components/AppShell';
import { useAuthStore } from '../features/auth/authStore';
import { api, ApiError } from '../lib/api';

type ProfileForm = { name: string; email: string; phone: string; about: string; emojiTag: string };

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
      {children}
    </span>
  );
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.5-3.5 2.8-5.5 6.5-5.5s6 2 6.5 5.5" strokeLinecap="round" /></svg>;
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m5 7 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4.5 9.5 4l2 4-2 1.5c1 2 2.5 3.5 4.5 4.5l1.5-2 4 2-.5 2.5c-.3 1.4-1.6 2.3-3 2-6.1-1.4-10.6-5.9-12-12-.3-1.4.6-2.7 2-3Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);
  // Use the already-authenticated user immediately so the card never flashes
  // with blank fields while /auth/me is refreshing the latest profile data.
  const userForm: ProfileForm = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    about: user?.profile?.about ?? '',
    emojiTag: user?.profile?.emojiTag ?? '',
  };
  const [form, setForm] = useState<ProfileForm>(userForm);
  const [savedForm, setSavedForm] = useState<ProfileForm | null>(userForm);
  const [tab, setTab] = useState<'personal' | 'security'>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    void api.me().then((data) => {
      if (cancelled) return;
      const next = { name: data.user.name, email: data.user.email, phone: data.user.phone ?? '', about: data.user.profile?.about ?? '', emojiTag: data.user.profile?.emojiTag ?? '' };
      setForm(next);
      setSavedForm(next);
      updateUser(data.user);
    }).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load profile');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [accessToken, navigate, updateUser]);

  const initials = useMemo(() => form.name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'SV', [form.name]);
  const role = user?.role.replace('_', ' ') ?? 'student';
  const profileCompletion = Math.round(([form.name, form.email, form.phone, form.about, user?.profile?.avatar].filter(Boolean).length / 5) * 100);
  const setField = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await api.updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), about: form.about.trim(), emojiTag: form.emojiTag.trim() });
      const next = { name: data.user.name, email: data.user.email, phone: data.user.phone ?? '', about: data.user.profile?.about ?? '', emojiTag: data.user.profile?.emojiTag ?? '' };
      updateUser(data.user);
      setForm(next);
      setSavedForm(next);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WebP image up to 5 MB.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('Could not read image'));
        reader.readAsDataURL(file);
      });
      const result = await api.uploadProfileImage({ mimeType: file.type, data: dataUrl, fileName: file.name });
      if (user) updateUser({ ...user, profile: { ...user.profile, avatar: result.file.url } });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload profile picture');
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (savedForm) setForm(savedForm);
    setError(null);
    setSaved(false);
  }

  if (!user && !loading) {
    return <MarketplaceShell title="Profile"><p className="text-mute">Please sign in to edit your profile.</p><Link to="/login" className="sv-btn-primary mt-4 inline-flex">Log in</Link></MarketplaceShell>;
  }

  return (
    <MarketplaceShell fullWidth>
      <section className="sv-profile-hero overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-5 py-12 md:px-10 md:py-16">
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Account settings</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">Profile settings</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-600">Manage your personal information and preferences to personalize your SkillVentures experience.</p>
          </div>
          <div className="sv-profile-hero-art hidden h-48 w-[43%] md:block" aria-hidden>
            <div className="sv-profile-art-card"><UserIcon /></div>
            <div className="sv-profile-art-pencil">✎</div>
            <div className="sv-profile-art-dots" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl items-start gap-6 px-5 py-6 md:px-10 md:py-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
        <form onSubmit={onSubmit} className="self-start rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,.08)] md:p-7">
          <div className="flex gap-8 border-b border-slate-100">
            <button type="button" onClick={() => setTab('personal')} className={`border-b-2 px-1 pb-4 text-sm font-semibold ${tab === 'personal' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500'}`}><UserIcon /> <span className="ml-2 align-middle">Personal information</span></button>
            <button type="button" onClick={() => setTab('security')} className={`border-b-2 px-1 pb-4 text-sm font-semibold ${tab === 'security' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500'}`}><LockIcon /> <span className="ml-2 align-middle">Account &amp; security</span></button>
          </div>

          {loading ? <p className="py-12 text-sm text-mute">Loading profile…</p> : tab === 'security' ? (
            <div className="py-10"><div className="rounded-2xl bg-violet-50 p-6"><LockIcon /><h2 className="mt-4 font-display text-xl font-bold text-slate-900">Your account is secure</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your account access is managed securely. Contact support if you need to update your sign-in details.</p></div></div>
          ) : (
            <>
              <p className="mt-6 text-sm text-slate-500">This information will be displayed on your profile and used to personalize your experience.</p>
              <div className="mt-7 grid gap-6 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-900"><span className="mb-2 flex items-center gap-2"><Icon><UserIcon /></Icon>Display name</span><input className="sv-input" value={form.name} onChange={(e) => setField('name', e.target.value)} required minLength={2} maxLength={100} autoComplete="name" /><small className="mt-2 block font-normal text-slate-500">This is how your name appears across SkillVentures.</small></label>
                <label className="block text-sm font-semibold text-slate-900"><span className="mb-2 flex items-center gap-2"><Icon><MailIcon /></Icon>Email address</span><input className="sv-input" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required autoComplete="email" /><small className="mt-2 block font-normal text-slate-500">We’ll never share your email with anyone else.</small></label>
                <label className="block text-sm font-semibold text-slate-900 md:col-span-2"><span className="mb-2 flex items-center gap-2"><Icon><PhoneIcon /></Icon>Mobile number</span><input className="sv-input" type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="e.g. 9876543210" autoComplete="tel" inputMode="tel" /><small className="mt-2 block font-normal text-slate-500">Used for important updates and account recovery.</small></label>
                <label className="block text-sm font-semibold text-slate-900 md:col-span-2"><span className="mb-2 flex items-center gap-2"><Icon><i className="fas fa-align-left" aria-hidden /></Icon>About you</span><textarea className="sv-input min-h-32 resize-y" value={form.about} onChange={(e) => setField('about', e.target.value.slice(0, 500))} placeholder="Tell institutions what you are learning, what interests you, or what opportunity you are looking for…" maxLength={500} /><span className="mt-2 flex justify-between text-xs font-normal text-slate-500"><span>A short introduction shown on your learner profile.</span><span>{form.about.length}/500</span></span></label>
                <label className="block text-sm font-semibold text-slate-900"><span className="mb-2 flex items-center gap-2"><Icon><i className="fas fa-face-smile" aria-hidden /></Icon>Emoji tag</span><input className="sv-input text-2xl" value={form.emojiTag} onChange={(e) => setField('emojiTag', e.target.value.slice(0, 8))} placeholder="🚀" maxLength={8} /></label>
                <div className="block text-sm font-semibold text-slate-900"><span className="mb-2 flex items-center gap-2"><Icon><i className="fas fa-camera" aria-hidden /></Icon>Profile picture</span><label className="sv-btn-ghost inline-flex cursor-pointer"><i className="fas fa-upload" aria-hidden />{saving ? 'Uploading…' : 'Choose image'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadAvatar(file); e.currentTarget.value = ''; }} /></label><small className="mt-2 block font-normal text-slate-500">JPG, PNG, or WebP up to 5 MB.</small></div>
              </div>
              <div className="sv-profile-secure mt-7 flex items-center gap-4 rounded-2xl p-4"><span className="rounded-xl bg-violet-600 p-3 text-white"><LockIcon /></span><div><p className="font-bold text-violet-700">Your information is secure</p><p className="mt-1 text-sm text-slate-600">We use industry-standard encryption to protect your data.</p></div></div>
              {error ? <p className="mt-5 rounded-lg bg-spark-soft px-3 py-2 text-sm font-semibold text-[#b45309]" role="alert">{error}</p> : null}
              {saved ? <p className="mt-5 rounded-lg bg-teal-soft px-3 py-2 text-sm font-semibold text-teal" role="status">Profile saved successfully.</p> : null}
              <div className="mt-8 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="sv-btn-primary disabled:opacity-60"><CheckIcon /> <span className="ml-2">{saving ? 'Saving…' : 'Save changes'}</span></button><button type="button" onClick={discardChanges} className="sv-btn-ghost">× <span className="ml-2">Discard changes</span></button></div>
            </>
          )}
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white text-center shadow-[0_8px_30px_rgba(76,29,149,.08)]"><div className="h-16 bg-gradient-to-r from-indigo-800 via-violet-700 to-purple-600" /><div className="-mt-12 flex justify-center"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-violet-600 text-2xl font-bold text-white shadow-lg">{user?.profile?.avatar ? <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" /> : initials}</div></div><h2 className="mt-3 font-display text-xl font-bold text-slate-900">{form.name || 'Your name'}</h2><span className="mt-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold capitalize text-violet-700">{role}</span><p className="mx-auto mt-4 max-w-xs px-4 text-sm leading-6 text-slate-500">Your learning identity, kept ready for every opportunity.</p><div className="px-6 pt-5 text-left"><div className="flex items-center justify-between text-xs font-bold text-slate-600"><span>Profile completion</span><span className="text-violet-700">{profileCompletion}%</span></div><div className="sv-profile-progress mt-2"><span style={{ width: `${profileCompletion}%` }} /></div></div><Link to="/profile/view" className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:underline">View profile <i className="fas fa-arrow-right ml-2" aria-hidden /></Link><div className="mt-5 grid grid-cols-4 border-t border-slate-100 py-5 text-xs text-slate-500"><Stat value="0" label="Courses" /><Stat value="0" label="Bootcamps" /><Stat value="0" label="Hackathons" /><Stat value="0" label="Badges" /></div></div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h3 className="flex items-center gap-2 font-bold text-slate-900"><i className="fas fa-lightbulb text-orange-500" aria-hidden />Profile tips</h3><Tip done={Boolean(user?.profile?.avatar)}>Add a profile picture to stand out</Tip><Tip done={Boolean(form.about)}>Write a short bio about yourself</Tip><Tip>Link your social profiles</Tip><Tip>Add your skills and interests</Tip></div>
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_8px_30px_rgba(76,29,149,.08)]"><h3 className="flex items-center gap-2 font-bold text-slate-900"><i className="fas fa-circle-question text-violet-600" aria-hidden />Need help?</h3><p className="mt-2 text-sm leading-6 text-slate-500">If you face any issues, our support team is here to help.</p><button type="button" className="sv-btn-ghost mt-4 text-sm" onClick={() => navigate('/contact')}><i className="fas fa-headset" aria-hidden />Contact support</button></div>
        </aside>
      </div>
    </MarketplaceShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <div><strong className="block text-sm text-slate-900">{value}</strong><span className="mt-1 block">{label}</span></div>; }
function Tip({ done = false, children }: { done?: boolean; children: ReactNode }) { return <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${done ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'}`}><i className="fas fa-check" aria-hidden /></span>{children}</p>; }
