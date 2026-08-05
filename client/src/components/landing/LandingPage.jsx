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
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary font-body-md relative overflow-hidden">
      
      {/* Ambient background effect */}
      <div className="absolute inset-0 ambient-bg pointer-events-none"></div>

      {/* Top App Bar (Sticky) */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-card border-b' : 'bg-transparent'}`}>
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-primary text-3xl fill-1">play_circle</span>
            <span className="font-display-lg text-2xl font-bold tracking-tight text-on-background">Being Us.</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 font-label-lg">
            <button onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })} className={`hover:text-primary transition-colors ${activeSection === 'home' ? 'text-primary' : 'text-on-surface-variant'}`}>Home</button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className={`hover:text-primary transition-colors ${activeSection === 'features' ? 'text-primary' : 'text-on-surface-variant'}`}>Features</button>
            <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className={`hover:text-primary transition-colors ${activeSection === 'story' ? 'text-primary' : 'text-on-surface-variant'}`}>Story</button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => setActiveModal('profile')}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary">person</span>
                <span className="font-label-sm font-semibold">{user.user_metadata?.full_name || 'My Profile'}</span>
              </button>
            ) : (
              <button onClick={() => setActiveModal('signin')} className="hidden md:block font-label-lg text-primary hover:text-on-primary-fixed-variant transition-colors">
                Sign In
              </button>
            )}
            <button onClick={() => setActiveModal('create')} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-lg hover:bg-surface-tint transition-all shadow-md hover:shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section id="home" className="pt-40 pb-20 md:pt-48 md:pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-error-container text-on-error-container font-label-sm mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Now supporting 4K sync
          </div>

          <h1 className="font-display-lg text-5xl md:text-7xl lg:text-[80px] leading-[1.1] mb-6 text-on-background animate-fade-in-up delay-100 max-w-4xl">
            Distance means nothing when you <span className="font-display-accent italic text-primary">watch together.</span>
          </h1>

          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-12 animate-fade-in-up delay-200">
            A premium, synchronized viewing experience for you and the people who matter most. 
            No buffering delays, no countdowns. Just perfect harmony.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300 w-full sm:w-auto">
            <button onClick={() => setActiveModal('create')} className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-lg hover:bg-surface-tint transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">add</span>
              Start Watching Now
            </button>
            <button onClick={() => setActiveModal('join')} className="bg-surface text-on-surface px-8 py-4 rounded-full font-label-lg hover:bg-surface-container-high transition-all shadow-md border border-outline-variant flex items-center gap-2 w-full sm:w-auto">
              <span className="material-symbols-outlined">meeting_room</span>
              Join a Room
            </button>
          </div>

          {/* Abstract Hero Image/Graphic Placeholder */}
          <div className="mt-20 w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up delay-300 border border-outline-variant bg-surface-container-lowest">
             <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                 <span className="material-symbols-outlined text-[80px] text-primary opacity-20">play_circle</span>
                 <p className="font-label-sm text-on-surface-variant uppercase tracking-widest opacity-50">Video Player Interface Preview</p>
             </div>
             {/* Decorative UI elements for the placeholder */}
             <div className="absolute bottom-6 left-6 right-6 h-12 glass-card rounded-xl flex items-center px-4 gap-4 opacity-80">
                 <div className="w-8 h-8 rounded-full bg-primary opacity-20"></div>
                 <div className="h-2 bg-on-surface opacity-10 rounded-full flex-1"></div>
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-surface-container-lowest relative z-10">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-4xl md:text-5xl mb-4 text-on-background">Designed for Closeness</h2>
              <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">Every detail crafted to make you feel like you're sitting on the same couch.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant group">
                <div className="w-14 h-14 rounded-2xl bg-error-container text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">bolt</span>
                </div>
                <h3 className="font-headline-md text-2xl mb-3">Frame-Perfect Sync</h3>
                <p className="font-body-md text-on-surface-variant">
                  Our proprietary sync engine ensures you both laugh at the exact same moment. No more "wait, where are you at?"
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant group">
                <div className="w-14 h-14 rounded-2xl bg-error-container text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
                </div>
                <h3 className="font-headline-md text-2xl mb-3">Moments in Time</h3>
                <p className="font-body-md text-on-surface-variant">
                  Chats are pinned to the video timeline. Relive the exact reactions when you rewatch your favorite scenes.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant group">
                <div className="w-14 h-14 rounded-2xl bg-error-container text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">chair</span>
                </div>
                <h3 className="font-headline-md text-2xl mb-3">Theater Moods</h3>
                <p className="font-body-md text-on-surface-variant">
                  Set the perfect vibe. From a cozy starlit cabin to a classic cinema, change the room's atmosphere instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Storytelling Section */}
        <section id="story" className="py-24 relative z-10 overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-6">
                    <h2 className="font-headline-lg text-4xl md:text-5xl leading-tight text-on-background">
                        Because shared experiences <br/><span className="font-display-accent italic text-primary">are better experiences.</span>
                    </h2>
                    <p className="font-body-lg text-on-surface-variant">
                        We built Being Us not just to watch videos, but to connect. Whether it's the season finale, a nostalgia trip, or learning something new together — do it in a space designed for you.
                    </p>
                    <ul className="space-y-4 pt-4">
                        <li className="flex items-center gap-3 font-body-md text-on-background">
                            <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
                            Host controls who pauses and plays
                        </li>
                        <li className="flex items-center gap-3 font-body-md text-on-background">
                            <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
                            Shared queue system for continuous watching
                        </li>
                        <li className="flex items-center gap-3 font-body-md text-on-background">
                            <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
                            Crystal clear audio and video quality
                        </li>
                    </ul>
                </div>
                <div className="flex-1 relative">
                    {/* Abstract compositional layout */}
                    <div className="w-full aspect-square rounded-full bg-error-container absolute -top-10 -right-10 opacity-50 blur-3xl"></div>
                    <div className="relative z-10 glass-card p-6 rounded-3xl shadow-xl flex flex-col gap-4 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-lg">J</div>
                            <div className="flex-1 bg-surface-container h-12 rounded-2xl flex items-center px-4 relative overflow-hidden">
                                <span className="text-sm">Wait, did you see that?! 😂</span>
                                <div className="absolute right-4 text-xs text-on-surface-variant">1:24:05</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="w-12 h-12 rounded-full border border-outline flex items-center justify-center text-primary font-label-lg">M</div>
                            <div className="flex-1 bg-primary text-on-primary h-12 rounded-2xl flex items-center px-4 relative">
                                <span className="text-sm">OMG yes! Rewinding 10s...</span>
                                <div className="absolute right-4 text-xs opacity-70">1:24:12</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-on-primary relative z-10">
            <div className="max-w-4xl mx-auto px-margin-mobile text-center">
                <h2 className="font-display-lg text-4xl md:text-6xl mb-6">Ready to hit play?</h2>
                <p className="font-body-lg opacity-90 mb-10 max-w-xl mx-auto">Create your first room in seconds. No installation required. Invite friends with a simple 6-digit code.</p>
                <button onClick={() => setActiveModal('create')} className="bg-on-primary text-primary px-10 py-5 rounded-full font-label-lg hover:bg-surface-bright transition-all shadow-xl hover:-translate-y-1 inline-flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px]">movie</span>
                    Create Your Room
                </button>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-12 border-t border-outline-variant relative z-10">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl fill-1">play_circle</span>
                  <span className="font-display-lg text-xl font-bold tracking-tight text-on-background">Being Us.</span>
              </div>
              <p className="font-body-sm text-on-surface-variant">© 2026 Being Us. All rights reserved.</p>
              <div className="flex gap-4">
                  <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm">Privacy</a>
                  <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm">Terms</a>
                  <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm">Help</a>
              </div>
          </div>
      </footer>

      {/* Modals */}
      {activeModal === 'join' && (
        <JoinRoomModal 
          isOpen={true} 
          onClose={() => setActiveModal(null)} 
          onJoinRoom={onJoinRoom}
          initialRoomId={initialRoomId}
          user={user}
        />
      )}

      {activeModal === 'create' && (
        <CreateRoomModal 
          isOpen={true} 
          onClose={() => setActiveModal(null)} 
          onCreateRoom={onCreateRoom}
          user={user}
        />
      )}

      {activeModal === 'profile' && (
        <UserProfileModal 
          isOpen={true} 
          onClose={() => setActiveModal(null)} 
          user={user} 
        />
      )}

      {activeModal === 'signin' && (
        <SignInModal 
          isOpen={true} 
          onClose={() => setActiveModal(null)} 
        />
      )}
    </div>
  );
}
