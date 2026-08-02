import React, { useState, useEffect } from 'react';
import { JoinRoomModal } from '../room/JoinRoomModal';
import { UserProfileModal } from '../profile/UserProfileModal';
import { useRoomStore } from '../../store/useRoomStore';
import { useUIStore } from '../../store/useUIStore';
import { UserAvatar } from '../common/UserAvatar';

export function LandingPage({ initialRoomId, onCreateRoom, onJoinRoom, user }) {
  const [isModalOpen, setIsModalOpen] = useState(!!initialRoomId);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      const glows = document.querySelectorAll('.parallax-glow');
      glows.forEach((glow, index) => {
        const factor = (index + 1) * 0.5;
        glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-bg" style={{ display: 'block', padding: '0', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* 1. Header */}
      <header className={`glass-pill-nav ${scrolled ? 'scrolled' : ''}`}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '-0.02em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Being Us
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {user ? (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                style={{ 
                  backgroundColor: 'transparent', border: '1px solid var(--border-medium)', 
                  color: 'var(--text-secondary)', padding: '8px 24px', borderRadius: '9999px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <UserAvatar user={user} size={20} />
                {user.user_metadata?.full_name || 'My Profile'}
              </button>
            ) : null}
          </div>
        </nav>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section style={{
          position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: '0 20px'
        }}>
          {/* Atmospheric Shaders */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, var(--bg-primary), rgba(26,33,19,0.3), rgba(142,87,69,0.05))' }}></div>
            <div className="parallax-glow" style={{ position: 'absolute', top: '25%', left: '25%', width: '384px', height: '384px', background: 'rgba(142,87,69,0.05)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
            <div className="parallax-glow" style={{ position: 'absolute', bottom: '25%', right: '25%', width: '384px', height: '384px', background: 'rgba(117,137,86,0.05)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '896px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src="https://lh3.googleusercontent.com/aida/AP1WRLt_dupsMi6ScGVyQEnvX2C8yVrlAHuozZ_Y4z3Wzb6VBaY7pxwp9PYJD-uwzJkYQPj8uevcqLsS3G_2gY1WbrOynGe-RWT_Zu_LZHqhH6t95rECGo9lEAKt8o60acf08DPzTDJrym_B5eeYTh9K_ZRzXpovpE_UyTIw8ms-GnF1n9CNiAvzGqJthqV7bOw18ERzHPdRWh8GW7ph-UsnAk8wcbvxxJlMjjGbRD-rOYHogk08z56zmjCk3d4"
                alt=""
                style={{ height: '128px', filter: 'sepia(0.3) drop-shadow(0 0 30px rgba(142,87,69,0.3))' }}
              />
            </div>
            
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: '1.1', fontWeight: '800', color: 'var(--text-primary)', margin: '0 auto', maxWidth: '768px', letterSpacing: '-0.03em' }}>
              Watch Together,
              <br />
              <span className="text-gradient-primary">Feel Together</span>
            </h1>
            
            <p style={{ fontSize: '18px', lineHeight: '28px', color: 'var(--text-tertiary)', maxWidth: '672px', margin: '0 auto' }}>
              Distance means nothing when you watch together.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="soft-glow-primary"
                style={{ 
                  padding: '16px 40px', backgroundColor: 'var(--accent-primary)', color: '#fff',
                  borderRadius: '9999px', border: 'none', fontSize: '18px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.3s ease'
                }}
              >
                Create Private Room
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ 
                  padding: '16px 40px', backgroundColor: 'rgba(62,78,44,0.2)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)', borderRadius: '9999px', 
                  fontSize: '18px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(12px)'
                }}
              >
                How it works
              </button>
            </div>

            {/* Social Proof */}
            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-primary)', overflow: 'hidden' }}>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA91FyNsAYr7wlSub9Ul1Xcy37P8fKJkxOBdcoKSg0lxhQzegAspUMxx4Nq60DGgJEoVgOVRR9Fnpui32lwqgrtZk2sOcmHlunUOox7lYTK7TmltAeDSmnJVDZsAbgwjlgMH3WBQbUCVwTD9Iuk2Q0ZDt03sulekiETHCSNftl0gn5u6yPZK4zFNJjLbeIFQjxa6-lyRQn4e9wt3GzMRMn1dTcVHuwuYIxsFtol_eiNnwUSFRn66jC" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2)' }}/>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-primary)', overflow: 'hidden', marginLeft: '-16px' }}>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBraHQANKaF3awYofGS60CsoVIOAaYZgmj4J5I-q3vB9wQc31ETUYVzBWc0CWjVfgIgxSHIgHiPVqUE1kBCZfd2JfJw7RvYI7n5FjmNNwiivoXRvpY1SQI5cR-Tq8z0ijs41TvS30IA4wCL0sueX_KEKhlLBLCAskd3THxYmfmz6oToxxWWS6u0z3KXlc_BccfTlgHCf25ITJaLptnMy_rfuwaXsSMLp--e1ZdgsGj_af9s5VRTu37j" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2)' }}/>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--bg-primary)', backgroundColor: 'var(--accent-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 'bold', marginLeft: '-16px', backdropFilter: 'blur(4px)' }}>
                  +
                </div>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <span className="pulse-indicator" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginRight: '8px' }}></span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginRight: '4px' }}>1,240</span> couples connected right now
              </p>
            </div>
          </div>
        </section>

        {/* 3. Features Section */}
        <section style={{ padding: '96px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: '700', color: 'var(--text-primary)' }}>Designed for Digital Intimacy</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-tertiary)', maxWidth: '576px', margin: '0 auto' }}>
              Every pixel is tuned to bring you closer, eliminating the tech friction between you and your partner.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Feature 1 */}
            <div className="glass-card" style={{ padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'border-color 0.5s' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--accent-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '36px' }}>sync</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>Synced Playback</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>Millisecond-perfect synchronization. When you pause to grab popcorn, they pause too. No more "one, two, three, play!" countdowns.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card" style={{ padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'border-color 0.5s' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(117,137,86,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-cyan)', fontSize: '36px' }}>favorite</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>Private Date Rooms</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>Invite-only sanctuaries with custom atmospheric backgrounds. A safe, secure space for just the two of you.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card" style={{ padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'border-color 0.5s' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--accent-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '36px' }}>chat_bubble</span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>Real-time Reactions</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>Express yourself with glowing glass-style chat bubbles and synchronized emoji reactions that burst with color across the screen.</p>
            </div>
          </div>
        </section>

        {/* 4. Quote Section */}
        <section style={{ position: 'relative', padding: '128px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(142,87,69,0.05)', filter: 'blur(120px)', zIndex: 0 }}></div>
          <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <span className="material-symbols-outlined" style={{ color: 'rgba(142,87,69,0.4)', fontSize: '60px', marginBottom: '32px', userSelect: 'none' }}>format_quote</span>
            <blockquote style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontStyle: 'italic', color: 'rgba(240,242,235,0.9)', lineHeight: '1.6', marginBottom: '32px' }}>
              "Intimacy isn't about being in the same room; it's about being in the same moment. Being Us turns a lonely YouTube link into a shared memory."
            </blockquote>
            <cite style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-primary)', letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'normal' }}>
              — THE ART OF CONNECTING
            </cite>
          </div>
        </section>

        {/* 5. Aesthetic Bento Break */}
        <section style={{ paddingBottom: '128px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px 128px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3Z605NiKh7Q5UYAnNI_8dTjB14YwsZiyAfftBPRC2B0_b_wqyxpMeHl9uWMk3hQdsL7MyjAd12nFWXRntNnBvx0WlHInapQIxQ3sb6PC4D-uEvTRhYu0hAmca7owjl404wT1rs50IkbpTf3vk0FkUhUAknrGWOBBMQ4r2_ANFjw8B2ON02QorEt77l84TjqZ_ScPfwMfYPjyY7ej5trUbl6l_2pugzEAjFHeq6NXsuy5GQJsCBCEB"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.2)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary), transparent)', opacity: 0.4 }}></div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>Earthy Cinema</span>
              <h2 style={{ fontSize: '40px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.2' }}>Cinema-Grade Aesthetics, Living Room Comfort</h2>
              <p style={{ fontSize: '18px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                We believe the interface should disappear during a movie. Our "Warm Organic" design uses deep earthy tones and soft rust accents to ensure your content is the star, while keeping the UI accessible with a simple glance.
              </p>
            </div>
          </div>
        </section>

        {/* 6. CTA Section */}
        <section style={{ padding: '96px 20px', backgroundColor: 'rgba(30,30,20,0.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '384px', height: '384px', backgroundColor: 'rgba(142,87,69,0.1)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
          
          <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: '800', color: 'var(--text-primary)' }}>Ready to start your next movie night?</h2>
            <p style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>Connect in seconds. No accounts required for guests—just send a link and sync your hearts.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="soft-glow-primary"
                style={{ 
                  padding: '20px 48px', backgroundColor: 'var(--accent-primary)', color: '#fff',
                  borderRadius: '9999px', border: 'none', fontSize: '20px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Create Your Room
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Free for everyone. High fidelity for couples.</p>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)', padding: '48px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-primary)' }}>Being Us</div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>© 2026 Being Us. Cinema for the soul, together.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</h4>
            <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms of Service</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resources</h4>
            <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Help Center</a>
            <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Community Blog</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social</h4>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Instagram</a>
              <a href="#" style={{ fontSize: '16px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Twitter</a>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '0 0 4px 0' }}>Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }}></span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>All systems syncing</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Modals */}
      {isModalOpen && (
        <JoinRoomModal 
          initialRoomId={initialRoomId} 
          onCreateRoom={onCreateRoom}
          onJoinRoom={onJoinRoom}
          onCancel={() => setIsModalOpen(false)}
          user={user}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal 
          user={user} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </div>
  );
}
