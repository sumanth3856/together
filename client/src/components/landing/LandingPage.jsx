import React, { useState, useEffect } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { JoinRoomModal } from '../room/JoinRoomModal';
import { CreateRoomModal } from '../room/CreateRoomModal';
import { SignInModal } from '../room/SignInModal';
import { UserProfileModal } from '../profile/UserProfileModal';

export function LandingPage({ initialRoomId, onCreateRoom, onJoinRoom, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activeModal, setActiveModal] = useState(initialRoomId ? 'join' : null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ['home', 'features', 'story'];
      let current = 'home';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && el.getBoundingClientRect().top <= 250) current = section;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary font-body-md relative overflow-hidden">
      <div className="absolute inset-0 ambient-bg pointer-events-none"></div>

      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-card border-b' : 'bg-transparent'}`}>
        <div className="w-full px-4 sm:px-6 md:px-12 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 cursor-pointer shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl fill-1">play_circle</span>
            <span className="font-display-lg text-lg sm:text-2xl font-bold tracking-tight text-on-background">Being Us.</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-label-lg">
            {['home','features','story'].map(s => (
              <button key={s} onClick={() => document.getElementById(s)?.scrollIntoView({ behavior: 'smooth' })}
                className={`capitalize hover:text-primary transition-colors ${activeSection === s ? 'text-primary' : 'text-on-surface-variant'}`}>
                {s}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <button onClick={() => setActiveModal('profile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">person</span>
                <span className="font-label-sm font-semibold max-w-[80px] sm:max-w-[120px] truncate">
                  {(user.user_metadata?.full_name || user.email || 'Profile').split(' ')[0]}
                </span>
              </button>
            ) : (
              <button onClick={() => setActiveModal('signin')} className="hidden sm:block font-label-lg text-primary hover:opacity-80 transition-opacity">Sign In</button>
            )}
            <button onClick={() => setActiveModal('create')}
              className="bg-primary text-on-primary px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full font-label-lg hover:bg-surface-tint transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 whitespace-nowrap text-sm sm:text-base">
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
          <h1 className="font-display-lg text-4xl sm:text-5xl md:text-7xl lg:text-[80px] leading-[1.1] mb-5 sm:mb-6 text-on-background animate-fade-in-up delay-100 max-w-4xl">
            Distance means nothing when you{' '}
            <span className="font-display-accent italic text-primary">watch together.</span>
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-in-up delay-200 text-sm sm:text-base md:text-lg px-2">
            A premium, synchronized viewing experience for you and the people who matter most.
            No buffering delays, no countdowns. Just perfect harmony.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up delay-300 w-full sm:w-auto">
            <button onClick={() => setActiveModal('create')}
              className="bg-primary text-on-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-label-lg hover:bg-surface-tint transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto">
              <span className="material-symbols-outlined text-[22px]">add</span>
              Start Watching Now
            </button>
            <button onClick={() => setActiveModal('join')}
              className="bg-surface text-on-surface px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-label-lg hover:bg-surface-container-high transition-all shadow-md border border-outline-variant flex items-center justify-center gap-2 w-full sm:w-auto">
              <span className="material-symbols-outlined">meeting_room</span>
              Join a Room
            </button>
          </div>
          <div className="mt-12 sm:mt-20 w-full max-w-5xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up delay-300 border border-outline-variant bg-surface-container-lowest">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
              <span className="material-symbols-outlined text-[60px] sm:text-[80px] text-primary opacity-20">play_circle</span>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-widest opacity-50 text-[10px] sm:text-xs px-4 text-center">Video Player Interface Preview</p>
            </div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 h-10 sm:h-12 glass-card rounded-xl flex items-center px-4 gap-3 opacity-80">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary opacity-20 shrink-0"></div>
              <div className="h-2 bg-on-surface opacity-10 rounded-full flex-1"></div>
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
                <div key={i} className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant group${i === 2 ? ' sm:col-span-2 md:col-span-1' : ''}`}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-error-container text-primary flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[24px] sm:text-[28px]">{f.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-xl sm:text-2xl mb-2 sm:mb-3">{f.title}</h3>
                  <p className="font-body-md text-on-surface-variant text-sm sm:text-base">{f.desc}</p>
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
        <section className="py-16 sm:py-24 bg-primary text-on-primary relative z-10">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="font-display-lg text-3xl sm:text-4xl md:text-6xl mb-4 sm:mb-6">Ready to hit play?</h2>
            <p className="font-body-lg opacity-90 mb-8 sm:mb-10 max-w-xl mx-auto text-sm sm:text-base">Create your first room in seconds. No installation required. Invite friends with a simple 6-digit code.</p>
            <button onClick={() => setActiveModal('create')}
              className="bg-on-primary text-primary px-8 sm:px-10 py-4 sm:py-5 rounded-full font-label-lg hover:bg-surface-bright transition-all shadow-xl hover:-translate-y-1 inline-flex items-center gap-2 sm:gap-3">
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
            {['Privacy','Terms','Help'].map(l => (
              <a key={l} href="#" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-sm">{l}</a>
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
