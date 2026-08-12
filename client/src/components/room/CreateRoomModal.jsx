import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export function CreateRoomModal({ isOpen, onClose, onCreateRoom, user }) {
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('cosy'); // default mood
  const [roomName, setRoomName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const nickname = user.user_metadata.full_name || 'Host';
    const avatar = user.user_metadata.avatar_url || null;

    setLoading(true);
    setErrorMsg('');
    try {
      await onCreateRoom(user.id, nickname, avatar, roomName, mood);
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="create-room-title" className="fixed inset-0 z-[100] flex items-center justify-center font-body-md p-4 overflow-y-auto">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-md" onClick={onClose}></div>
        
        {/* Modal Container */}
        <div className="relative z-10 my-auto w-full max-w-[540px] bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant animate-fade-in-up">
            
            {/* Header */}
            <div className="p-6 pb-4 flex justify-between items-start border-b border-outline-variant/50">
                <div>
                    <h2 id="create-room-title" className="font-headline-lg text-3xl mb-1 text-on-background">Create Room</h2>
                    <p className="font-body-md text-on-surface-variant">Set up your shared watching space.</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors" aria-label="Close">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {!user ? (
                   <div className="text-center py-6">
                     <div className="w-16 h-16 rounded-full bg-error-container text-primary flex items-center justify-center mx-auto mb-4 shadow-soft">
                       <span className="material-symbols-outlined text-[32px]">account_circle</span>
                     </div>
                     <h3 className="font-headline-md text-xl mb-2 text-on-background">Sign in to host</h3>
                     <p className="font-body-md text-on-surface-variant mb-6">You need an account to create a room.</p>
                     <button onClick={handleGoogleSignIn} className="btn btn-secondary w-full py-4 text-base gap-3">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                         </svg>
                         Continue with Google
                     </button>
                   </div>
                ) : (
                  <form id="create-room-form" onSubmit={handleSubmit} className="space-y-8">
                      {/* Room Details */}
                      <div className="space-y-4">
                          <label className="block font-label-lg text-on-surface">Room Name (Optional)</label>
                          <input 
                              type="text" 
                              className="input"
                              placeholder={`${user.user_metadata?.full_name?.split(' ')[0] || 'My'}'s Watch Party`}
                              value={roomName}
                              onChange={(e) => setRoomName(e.target.value)}
                              disabled={loading}
                          />
                      </div>

                      {/* Theater Moods */}
                      <div className="space-y-4">
                          <label className="block font-label-lg text-on-surface">Theater Mood</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Mood: Cosy */}
                              <label className="cursor-pointer group">
                                  <input type="radio" name="mood" className="hidden mood-card-input" value="cosy" checked={mood === 'cosy'} onChange={() => setMood('cosy')} disabled={loading}/>
                                  <div className="border border-outline-variant rounded-xl p-4 text-center hover:bg-surface-container transition-all h-full">
                                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2 group-hover:text-primary transition-colors mood-icon">fireplace</span>
                                      <h4 className="font-label-sm mb-1 text-on-background">Cosy Cabin</h4>
                                      <p className="text-[11px] text-on-surface-variant leading-tight">Warm & intimate</p>
                                  </div>
                              </label>

                              {/* Mood: Starlit */}
                              <label className="cursor-pointer group">
                                  <input type="radio" name="mood" className="hidden mood-card-input" value="starlit" checked={mood === 'starlit'} onChange={() => setMood('starlit')} disabled={loading}/>
                                  <div className="border border-outline-variant rounded-xl p-4 text-center hover:bg-surface-container transition-all h-full">
                                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2 group-hover:text-primary transition-colors mood-icon">clear_night</span>
                                      <h4 className="font-label-sm mb-1 text-on-background">Starlit</h4>
                                      <p className="text-[11px] text-on-surface-variant leading-tight">Dark & ambient</p>
                                  </div>
                              </label>

                              {/* Mood: Cinema */}
                              <label className="cursor-pointer group">
                                  <input type="radio" name="mood" className="hidden mood-card-input" value="cinema" checked={mood === 'cinema'} onChange={() => setMood('cinema')} disabled={loading}/>
                                  <div className="border border-outline-variant rounded-xl p-4 text-center hover:bg-surface-container transition-all h-full">
                                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2 group-hover:text-primary transition-colors mood-icon">theaters</span>
                                      <h4 className="font-label-sm mb-1 text-on-background">Classic</h4>
                                      <p className="text-[11px] text-on-surface-variant leading-tight">Pure focus</p>
                                  </div>
                              </label>
                          </div>
                      </div>
                  </form>
                )}
            </div>

            {/* Footer / CTA */}
            {user && (
              <div className="p-6 bg-surface-container border-t border-outline-variant flex flex-col gap-3">
                  {errorMsg && (
                    <p className="text-error text-sm font-label-md flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {errorMsg}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="font-body-sm text-on-surface-variant max-w-[200px]">You'll get an invite code on the next screen.</p>
                    <button 
                        form="create-room-form"
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary px-8 py-3"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <>
                              <span className="material-symbols-outlined">add</span>
                              Start Room
                            </>
                        )}
                    </button>
                  </div>
              </div>
            )}
        </div>
    </div>
  );
}
