import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Mail, ShieldCheck, Star, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

type AuthMode = 'signin' | 'signup' | 'forgot';

const companies = ['Spotify', 'Atlassian', 'Notion', 'HubSpot', 'Canva'];
const features = [
  {
    title: 'Instant Recognition',
    description:
      'Send kudos in seconds and make wins visible to the whole team.',
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    title: 'Reward Catalog',
    description: 'Turn points into meaningful rewards your team actually wants.',
    accent: 'from-fuchsia-500 to-rose-500',
  },
  {
    title: 'Culture Analytics',
    description: 'Track engagement and identify culture champions by department.',
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Core Values Tags',
    description: 'Link every recognition to your company values automatically.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Celebration Feed',
    description: 'A real-time feed keeps every milestone visible and celebrated.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Admin Controls',
    description: 'Set budgets, moderation rules, and permissions from one panel.',
    accent: 'from-indigo-500 to-purple-500',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '$0',
    description: 'For small teams getting started.',
    points: ['Up to 25 members', 'Basic kudos feed', 'Monthly analytics'],
  },
  {
    name: 'Pro',
    price: '$4',
    description: 'For teams scaling culture.',
    points: ['Unlimited members', 'Reward catalog', 'Advanced analytics'],
    featured: true,
  },
  {
    name: 'Custom',
    price: 'Custom',
    description: 'Enterprise-ready deployment.',
    points: ['SSO + RBAC', 'SLA support', 'Dedicated success manager'],
  },
];

function resolveRoleByEmail(email: string): 'member' | 'admin' | 'owner' {
  if (email.startsWith('owner@')) return 'owner';
  if (email.startsWith('admin@')) return 'admin';
  return 'member';
}

function nameFromEmail(email: string): string {
  const [raw] = email.split('@');
  return raw
    .split(/[._-]/g)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);

  const submitLabel = useMemo(() => {
    if (mode === 'signup') return 'Create Account & Start 14-Day Trial';
    if (mode === 'forgot') return 'Send Reset Link';
    return 'Sign In';
  }, [mode]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'signup' && !agree) {
      toast.error('Please accept Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        await new Promise((resolve) => setTimeout(resolve, 600));
        toast.success('Reset link sent. Please check your email.');
        setMode('signin');
        return;
      }

      const { data } = await api.post('/auth/token', { email });
      if (!data?.accessToken) {
        throw new Error('Missing access token');
      }

      if (rememberMe || mode === 'signup') {
        localStorage.setItem('access_token', data.accessToken as string);
      }

      setUser({
        id: crypto.randomUUID(),
        email,
        fullName: mode === 'signup' && fullName ? fullName : nameFromEmail(email),
        role: resolveRoleByEmail(email),
        orgId: 'demo-org',
      });

      toast.success(mode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
      onClose();
    } catch {
      toast.error('Authentication failed. Check API and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#090f2b]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="modal-glow relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/50 bg-[#f6f7fb] shadow-[0_24px_80px_rgba(17,24,39,0.45)]">
        <div className="p-7 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
            aria-label="Close auth modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-5 flex w-fit items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
              <Star className="h-4 w-4" />
            </div>
            <span className="font-display text-[36px]/none font-bold text-slate-900">Good Job</span>
          </div>
          <p className="mb-5 text-center text-sm font-medium text-slate-500">Recognition & Reward Platform</p>

          <div className="mb-5 rounded-xl bg-slate-200 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-lg py-2 text-sm font-semibold ${
                  mode === 'signup' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`rounded-lg py-2 text-sm font-semibold ${
                  mode === 'signin' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
            </div>
          </div>

          {mode === 'forgot' ? (
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-[32px]/tight font-display font-bold text-slate-900">Reset your password</h3>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-600">Full Name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  placeholder="John Doe"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-600">
                {mode === 'forgot' ? 'Email address' : 'Email'}
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="john@company.com"
              />
            </label>

            {mode !== 'forgot' ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-600">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
                />
              </label>
            ) : null}

            {mode === 'signin' ? (
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="font-semibold text-violet-600 hover:text-violet-700"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            {mode === 'signup' ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                />
                I agree to the <span className="font-semibold text-violet-600">Terms of Service</span> and{' '}
                <span className="font-semibold text-violet-600">Privacy Policy</span>
              </label>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-75"
            >
              {isSubmitting ? 'Please wait...' : submitLabel}
              <ArrowRight className="h-4 w-4" />
            </button>

            {mode === 'forgot' ? (
              <button
                type="button"
                className="mx-auto block text-sm font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => setMode('signin')}
              >
                ← Back to Sign In
              </button>
            ) : (
              <>
                <div className="relative py-1 text-center text-sm text-slate-400">
                  <span className="relative z-10 bg-[#f6f7fb] px-3">or continue with</span>
                  <span className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-slate-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
                  >
                    Microsoft
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                    className="font-semibold text-violet-600"
                  >
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </>
            )}
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 bg-violet-50 px-4 py-3 text-sm text-slate-500">
          <ShieldCheck className="h-4 w-4 text-violet-500" />
          Free 14-day Pro trial · No credit card required
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing-root min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
              <Star className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold">Good Job</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
          </nav>
          <button
            onClick={() => setShowAuth(true)}
            className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105"
            type="button"
          >
            Sign In
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 top-12 h-44 w-44 rounded-full bg-violet-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-16 h-56 w-56 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              Recognition Platform
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">
              Recognize.
              <br />
              Reward.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                Celebrate.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              The modern way to appreciate your team. Build a culture of appreciation with points,
              rewards, and transparent recognition.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setShowAuth(true)}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-105"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-600 hover:border-slate-400"
              >
                Watch Demo
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-5 top-10 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg">
              +100 Kudos sent today
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
              <img
                src="/hero-characters.jpg"
                alt="People celebrating achievements"
                className="h-[300px] w-full rounded-2xl object-cover sm:h-[360px]"
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-violet-50 p-3 text-center text-sm font-semibold text-violet-700">4.9/5</div>
                <div className="rounded-xl bg-indigo-50 p-3 text-center text-sm font-semibold text-indigo-700">12k teams</div>
                <div className="rounded-xl bg-rose-50 p-3 text-center text-sm font-semibold text-rose-700">98% happiness</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-7 px-4 sm:px-6">
          {companies.map((company) => (
            <span key={company} className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">
              {company}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
          Everything you need to build a{' '}
          <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            culture of appreciation
          </span>
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`mb-4 h-2 w-16 rounded-full bg-gradient-to-r ${feature.accent}`} />
              <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 to-sky-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-700">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Recognition in three simple steps</h2>
            <ol className="mt-6 space-y-4 text-sm">
              <li className="rounded-2xl bg-white p-4">
                <span className="mr-2 rounded-full bg-violet-100 px-2 py-1 font-semibold text-violet-700">1</span>
                Choose teammate and company value.
              </li>
              <li className="rounded-2xl bg-white p-4">
                <span className="mr-2 rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-700">2</span>
                Send kudos with points and a personal note.
              </li>
              <li className="rounded-2xl bg-white p-4">
                <span className="mr-2 rounded-full bg-pink-100 px-2 py-1 font-semibold text-pink-700">3</span>
                Redeem points from rewards marketplace.
              </li>
            </ol>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Loved by teams everywhere</p>
            <blockquote className="mt-4 text-lg leading-relaxed text-slate-700">
              “Good Job changed our culture in just one quarter. Recognition became part of our daily workflow.”
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-900">Sarah Chen, HR Director</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 py-10 text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
          <div>
            <p className="font-display text-3xl font-bold">2.5M+</p>
            <p className="text-sm text-white/80">Kudos sent</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold">50K+</p>
            <p className="text-sm text-white/80">Active users</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold">98%</p>
            <p className="text-sm text-white/80">Satisfaction</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold">120+</p>
            <p className="text-sm text-white/80">Countries</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Plans that scale with you</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-6 ${
                plan.featured
                  ? 'border-violet-300 bg-gradient-to-b from-violet-50 to-white shadow-lg shadow-violet-200/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              <p className="mt-6 font-display text-4xl font-bold text-slate-900">{plan.price}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {plan.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold ${
                  plan.featured
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white'
                    : 'border border-slate-300 text-slate-700'
                }`}
              >
                Get Started
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-[32px] bg-gradient-to-r from-indigo-600 via-violet-600 to-orange-500 px-6 py-12 text-center text-white sm:px-10">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to build a culture of appreciation?</h2>
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-semibold text-violet-700"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      <footer className="bg-[#07102e] py-12 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
                <Star className="h-4 w-4" />
              </div>
              <span className="font-display text-xl font-bold">Good Job</span>
            </div>
            <p className="text-sm text-slate-400">Recognition platform for high-performing teams.</p>
          </div>
          <p className="text-sm text-slate-500 md:text-right">© 2026 Good Job. All rights reserved.</p>
        </div>
      </footer>

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
      <Toaster position="top-center" richColors />
    </div>
  );
}
