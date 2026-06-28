import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    ),
    title: 'Connect with Friends',
    description: 'Find and connect with people you know. Build your network and stay in touch with friends and family.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
    ),
    title: 'Live & Reels',
    description: 'Go live, create short-form videos, and share your moments with the world. Watch entertaining content daily.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    ),
    title: 'Groups & Communities',
    description: 'Join groups that match your interests. Participate in discussions and build communities around shared passions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
    ),
    title: 'Marketplace',
    description: 'Buy and sell locally. Discover amazing deals from people in your community and list your items in seconds.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    title: 'Creator Monetization',
    description: 'Earn money from your content. Get tips, subscriptions, and sponsorships. Turn your passion into income.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    ),
    title: 'Privacy & Safety',
    description: 'Your data, your control. Advanced privacy settings, end-to-end encryption, and robust content moderation.',
  },
];

const stats = [
  { value: '10M+', label: 'Active Users' },
  { value: '50M+', label: 'Posts Created' },
  { value: '100K+', label: 'Groups' },
  { value: '99.9%', label: 'Uptime' },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Content Creator',
    text: 'Jolshaa changed how I connect with my audience. The monetization tools are incredible — I earned my first $1000 in just 3 months!',
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Community Builder',
    text: 'The group features are unmatched. I built a community of 50K members and the engagement is through the roof.',
    avatar: 'MJ',
  },
  {
    name: 'Priya Patel',
    role: 'Small Business Owner',
    text: 'Marketplace helped me grow my business. I reach thousands of customers locally without spending on ads.',
    avatar: 'PP',
  },
];

const Landing = () => {
  const [email, setEmail] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1326]">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b1326]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow-violet">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <span className="text-xl font-bold text-neutral-900 dark:text-white">Jolshaa</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-glow-violet hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                Sign Up Free
              </Link>
            </div>
            <Link to="/signup" className="sm:hidden px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-[#0b1326] dark:via-[#0f172a] dark:to-[#0b1326]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">Now in Open Beta</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white leading-[1.1] tracking-tight">
                Where Every Voice{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                  Finds Its Stage
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
                Jolshaa is the social platform built for creators, communities, and conversations. Share your story, grow your audience, and earn from your passion.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary-600 rounded-2xl hover:bg-primary-700 transition-all shadow-glow-violet hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:-translate-y-0.5">
                  Get Started — It's Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                  See Features
                </a>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6'].map((color, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0b1326] flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color, zIndex: 5 - i }}>
                      {['A', 'M', 'S', 'K', 'R'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">10,000+ creators joined</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">this month</p>
                </div>
              </div>
            </div>

            {/* Right — Phone Mockup */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative w-72 h-[580px] bg-neutral-900 dark:bg-neutral-800 rounded-[3rem] border-4 border-neutral-700 dark:border-neutral-600 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 dark:bg-neutral-800 rounded-b-2xl z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary-900/40 via-purple-900/30 to-neutral-900/80" />
                <div className="absolute inset-0 p-4 pt-10">
                  <div className="space-y-3">
                    {/* Story bubbles */}
                    <div className="flex gap-2 overflow-hidden">
                      {['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'].map((c, i) => (
                        <div key={i} className="flex-shrink-0 w-14 h-14 rounded-full border-2 p-0.5" style={{ borderColor: c }}>
                          <div className="w-full h-full rounded-full" style={{ backgroundColor: c + '33' }} />
                        </div>
                      ))}
                    </div>
                    {/* Post cards */}
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500/30" />
                          <div className="space-y-1">
                            <div className="h-2.5 w-20 bg-white/20 rounded" />
                            <div className="h-1.5 w-12 bg-white/10 rounded" />
                          </div>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                        <div className="h-32 bg-white/5 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-[3.5rem] blur-xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="relative py-12 bg-neutral-50 dark:bg-[#0f172a] border-y border-neutral-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">{stat.value}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
              Everything You Need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Connect & Create</span>
            </h2>
            <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
              From social networking to content creation and monetization — Jolshaa has it all.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group relative p-6 bg-white dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.06] rounded-2xl hover:border-primary-300 dark:hover:border-primary-500/30 transition-all duration-300 hover:shadow-glow-violet hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
              Loved by Creators Worldwide
            </h2>
            <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
              See what people are saying about Jolshaa.
            </p>
          </div>

          {/* Desktop — 3 cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="relative p-6 bg-white dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.06] rounded-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile — carousel */}
          <div className="md:hidden">
            <div className="relative p-6 bg-white dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.06] rounded-2xl min-h-[280px]">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6">"{testimonials[currentTestimonial].text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{testimonials[currentTestimonial].avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{testimonials[currentTestimonial].name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentTestimonial ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 p-12 sm:p-16 text-center">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Ready to Find Your People?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Join millions of creators, communities, and friends on Jolshaa. It's free to join, forever.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur"
                />
                <Link to="/signup" className="px-8 py-3.5 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
                  Join Free
                </Link>
              </div>

              <p className="text-xs text-white/50">No credit card required. Free forever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-12 bg-neutral-50 dark:bg-[#0a0f1e] border-t border-neutral-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">Jolshaa</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                The social platform for creators, communities, and meaningful connections.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Marketplace', 'Creator Hub', 'Groups', 'Events'].map((item) => (
                  <li key={item}><a href="#features" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Press', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Community Guidelines'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-neutral-200 dark:border-white/5">
            <p className="text-sm text-neutral-400">&copy; {new Date().getFullYear()} Jolshaa. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              {[
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Instagram', path: 'M16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zm-4 11a3 3 0 110-6 3 3 0 010 6zm4.5-7.5a1 1 0 110-2 1 1 0 010 2z' },
                { label: 'GitHub', path: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' },
              ].map((social) => (
                <a key={social.label} href="#" className="text-neutral-400 hover:text-primary-500 transition-colors" aria-label={social.label}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d={social.path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
