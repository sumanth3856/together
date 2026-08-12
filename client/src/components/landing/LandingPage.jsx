import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { Skeleton } from '../common/Skeleton';
import { Spinner } from '../common/Spinner';

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40">
    <Spinner size="text-3xl" label="Opening…" />
  </div>
);

const JoinRoomModal = dynamic(() => import('../room/JoinRoomModal').then((mod) => mod.JoinRoomModal), { ssr: false, loading: ModalLoadingFallback });
const CreateRoomModal = dynamic(() => import('../room/CreateRoomModal').then((mod) => mod.CreateRoomModal), { ssr: false, loading: ModalLoadingFallback });
const SignInModal = dynamic(() => import('../room/SignInModal').then((mod) => mod.SignInModal), { ssr: false, loading: ModalLoadingFallback });
const UserProfileModal = dynamic(() => import('../profile/UserProfileModal').then((mod) => mod.UserProfileModal), { ssr: false, loading: ModalLoadingFallback });

export function LandingPage({ initialRoomId, onCreateRoom, onJoinRoom, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeModal, setActiveModal] = useState(initialRoomId ? 'join' : null);
  const [atmosphereImageLoaded, setAtmosphereImageLoaded] = useState(false);

  useEffect(() => {
    let rafId = null;
    const handleScroll = () => {
      if (rafId) return; // already scheduled
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        const sections = ['home', 'features', 'story'];
        let current = 'home';
        for (const section of sections) {
          const el = document.getElementById(section);
          if (el && el.getBoundingClientRect().top <= 250) current = section;
        }
        setActiveSection(current);
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary font-body-md relative overflow-hidden">
      <div className="absolute inset-0 ambient-bg pointer-events-none"></div>

      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-card border-b border-outline-variant/60 shadow-soft' : 'bg-transparent'}`}>
        <div className="w-full px-4 sm:px-6 md:px-12 h-14 sm:h-16 md:h-20 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between md:justify-items-stretch gap-2 sm:gap-4">
          {/* Brand */}
          <a href="/" aria-label="Being Us – home"
            className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl fill-1 shrink-0">play_circle</span>
            <span className="font-display-lg text-lg sm:text-2xl font-bold tracking-tight text-on-background truncate">Being Us.</span>
          </a>

          {/* Primary navigation */}
          <nav aria-label="Primary" className="hidden md:block justify-self-center">
            <ul className="flex items-center gap-8 font-label-lg">
              {['home','features','story'].map(s => (
                <li key={s}>
                  <a href={`#${s}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(s)?.scrollIntoView({ behavior: 'smooth' }); }}
                    aria-current={activeSection === s ? 'true' : undefined}
                    className={`relative capitalize py-1 transition-colors after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-expo ${activeSection === s ? 'text-primary after:scale-x-100' : 'text-on-surface-variant hover:text-primary after:scale-x-0'}`}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 justify-self-end min-w-0">
            {user ? (
              <button onClick={() => setActiveModal('profile')}
                aria-label={`Profile – ${user.user_metadata?.full_name || user.email || 'Signed in user'}`}
                className="btn btn-secondary px-2.5 sm:px-3 py-2 sm:py-1.5 text-sm">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">person</span>
                <span className="hidden sm:inline font-label-sm font-semibold max-w-[120px] truncate">
                  {(user.user_metadata?.full_name || user.email || 'Profile').split(' ')[0]}
                </span>
              </button>
            ) : (
              <button onClick={() => setActiveModal('signin')} className="hidden sm:inline-flex btn btn-ghost px-3 py-1.5">Sign In</button>
            )}
            <button onClick={() => setActiveModal('create')}
              className="btn btn-primary px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 text-sm sm:text-base">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
              Create Room
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="home" className="pt-24 sm:pt-32 md:pt-48 pb-12 sm:pb-20 md:pb-32 px-5 sm:px-8 md:px-16 max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-error-container text-on-error-container font-label-sm mb-6 sm:mb-8 animate-fade-in-up text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
            Now supporting 4K sync
          </div>
          <h1 className="font-display-lg text-4xl sm:text-5xl md:text-7xl lg:text-[80px] leading-[1.1] mb-5 sm:mb-6 text-on-background animate-fade-in-up delay-100 max-w-4xl text-balance">
            Distance means nothing when you{' '}
            <span className="font-display-accent italic text-primary">watch together.</span>
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-in-up delay-200 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            A premium, synchronized viewing experience for you and the people who matter most.
            No buffering delays, no countdowns. Just perfect harmony.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up delay-300 w-full sm:w-auto">
            <button onClick={() => setActiveModal('create')}
              className="btn btn-primary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base">
              <span className="material-symbols-outlined text-[22px]">add</span>
              Start Watching Now
            </button>
            <button onClick={() => setActiveModal('join')}
              className="btn btn-secondary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base">
              <span className="material-symbols-outlined">meeting_room</span>
              Join a Room
            </button>
          </div>
          {/* Visual Storytelling: Atmosphere is everything */}
          <div className="mt-12 sm:mt-20 w-full max-w-5xl glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up delay-300 flex flex-col md:flex-row items-stretch border border-outline-variant">
            {/* Copy column */}
            <div className="p-8 sm:p-12 md:w-1/2 flex flex-col justify-center gap-5 sm:gap-6 relative z-10 text-left">
              <span className="font-display-accent text-sm md:text-base italic text-primary uppercase tracking-widest">Cinema-Grade Aesthetics</span>
              <h2 className="font-display-lg uppercase text-3xl sm:text-4xl md:text-5xl text-on-background text-balance">Atmosphere is everything.</h2>
              <p className="font-body-lg text-on-surface-variant text-sm sm:text-base md:text-lg leading-relaxed">
                We&apos;ve designed the interface to recede. Clean lines, minimal distractions, and soft styling create an environment that feels like a private theater designed just for two.
              </p>
              <ul className="space-y-3 sm:space-y-4 mt-1">
                {['Ultra-low latency streaming','Spatial audio support','Distraction-free theater mode'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-body-md text-on-surface text-sm sm:text-base">
                    <span className="material-symbols-outlined text-primary fill-1 shrink-0">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Image column */}
            <div className="md:w-1/2 relative min-h-[300px] sm:min-h-[400px]">
              {!atmosphereImageLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH6HnBZizM9HEgoeWIjML9WC0CAZz_kb8C7SbHn8Z_GKNeUWGwqQ0glUOMDEmM4iX-5QhRKvVh8X8Ysep6lkQSu2eez70zizTKavtUQDmUACXXyNlGm-gBsIUjHzXAn_XeSjxsuwPtHvA6XgnVhztRqDe3Wt5_OdkMCImIA_Axie4XHXmatqAscQgZk7iuonQ4bm3LTUGuFcm82sF0hLvGAV3z5WGhEzUHJY-ZfWvEfTOYeI4AL_3R"
                alt="A couple relaxing on a sofa in a dim, cozy room, lit by the glow of a film on a large screen"
                loading="lazy"
                onLoad={() => setAtmosphereImageLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${atmosphereImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-white/10 to-white/20 pointer-events-none" aria-hidden="true"></div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-24 bg-surface-container-lowest relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 text-on-background">Designed for Closeness</h2>
              <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base">Every detail crafted to make you feel like you're sitting on the same couch.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
              {[
                { icon: 'bolt', title: 'Frame-Perfect Sync', desc: 'Our proprietary sync engine ensures you both laugh at the exact same moment. No more "wait, where are you at?"' },
                { icon: 'chat_bubble', title: 'Moments in Time', desc: 'Chats are pinned to the video timeline. Relive the exact reactions when you rewatch your favorite scenes.' },
                { icon: 'chair', title: 'Theater Moods', desc: "Set the perfect vibe. From a cozy starlit cabin to a classic cinema, change the atmosphere instantly." },
              ].map((f, i) => (
                <div key={i} className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface hover:bg-surface-container transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift border border-outline-variant group${i === 2 ? ' sm:col-span-2 md:col-span-1' : ''}`}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-error-container to-primary-container/40 text-primary flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-soft">
                    <span className="material-symbols-outlined text-[24px] sm:text-[28px]">{f.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-xl sm:text-2xl mb-2 sm:mb-3 text-balance">{f.title}</h3>
                  <p className="font-body-md text-on-surface-variant text-sm sm:text-base leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section id="story" className="py-16 sm:py-24 relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16 flex flex-col md:flex-row items-center gap-10 sm:gap-16">
            <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-left">
              <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl leading-tight text-on-background">
                Because shared experiences <br/>
                <span className="font-display-accent italic text-primary">are better experiences.</span>
              </h2>
              <p className="font-body-lg text-on-surface-variant text-sm sm:text-base">
                We built Being Us not just to watch videos, but to connect. Whether it is the season finale, a nostalgia trip, or learning something new together, do it in a space designed for you.
              </p>
              <ul className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                {['Host controls who pauses and plays','Shared queue system for continuous watching','Crystal clear audio and video quality'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-body-md text-on-background text-sm sm:text-base">
                    <span className="material-symbols-outlined text-primary fill-1 shrink-0">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative w-full max-w-md mx-auto md:max-w-none">
              <div className="w-full aspect-square rounded-full bg-error-container absolute -top-10 -right-10 opacity-50 blur-3xl pointer-events-none"></div>
              <div className="relative z-10 glass-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col gap-3 sm:gap-4 transform rotate-1 sm:rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-lg shrink-0">J</div>
                  <div className="flex-1 bg-surface-container h-10 sm:h-12 rounded-xl flex items-center px-3 relative overflow-hidden">
                    <span className="text-xs sm:text-sm truncate pr-14">Wait, did you see that?! ??</span>
                    <div className="absolute right-3 text-xs text-on-surface-variant">1:24:05</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-outline flex items-center justify-center text-primary font-label-lg shrink-0">M</div>
                  <div className="flex-1 bg-primary text-on-primary h-10 sm:h-12 rounded-xl flex items-center px-3 relative overflow-hidden">
                    <span className="text-xs sm:text-sm truncate pr-14">OMG yes! Rewinding 10s...</span>
                    <div className="absolute right-3 text-xs opacity-70">1:24:12</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-primary text-on-primary relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-surface-tint pointer-events-none" aria-hidden="true"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
          <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="font-display-lg text-3xl sm:text-4xl md:text-6xl mb-4 sm:mb-6 text-balance">Ready to hit play?</h2>
            <p className="font-body-lg opacity-90 mb-8 sm:mb-10 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">Create your first room in seconds. No installation required. Invite friends with a simple 6-digit code.</p>
            <button onClick={() => setActiveModal('create')}
              className="btn bg-on-primary text-primary hover:bg-surface-bright px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg shadow-2xl hover:-translate-y-1 inline-flex items-center gap-2 sm:gap-3">
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">movie</span>
              Create Your Room
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-8 sm:py-12 border-t border-outline-variant relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl sm:text-2xl fill-1">play_circle</span>
            <span className="font-display-lg text-lg sm:text-xl font-bold tracking-tight text-on-background">Being Us.</span>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm">© 2026 Being Us. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            {[{label:'Privacy', href:'/privacy'},{label:'Terms', href:'/terms'},{label:'Help', href:'/help'}].map(l => (
              <a key={l.href} href={l.href} className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-sm hover:opacity-80">{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

      {activeModal === 'join' && <JoinRoomModal isOpen onClose={() => setActiveModal(null)} onJoinRoom={onJoinRoom} initialRoomId={initialRoomId} user={user} />}
      {activeModal === 'create' && <CreateRoomModal isOpen onClose={() => setActiveModal(null)} onCreateRoom={onCreateRoom} user={user} />}
      {activeModal === 'profile' && <UserProfileModal isOpen onClose={() => setActiveModal(null)} user={user} />}
      {activeModal === 'signin' && <SignInModal isOpen onClose={() => setActiveModal(null)} />}
    </div>
  );
}
