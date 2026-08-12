import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export function JoinRoomModal({ isOpen, onClose, onJoinRoom, initialRoomId, user }) {
  const [code, setCode] = useState(initialRoomId ? initialRoomId.split('').concat(Array(6 - initialRoomId.length).fill('')) : ['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

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

  const handleInputChange = (index, value) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    
    // Focus appropriate input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const roomId = code.join('');
    if (roomId.length !== 6) {
      setErrorMsg('Please enter a 6-character Room Code.');
      return;
    }
    setErrorMsg('');

    const nickname = user.user_metadata.full_name || 'Guest';
    const avatar = user.user_metadata.avatar_url || null;

    setLoading(true);
    try {
      await onJoinRoom(roomId, user.id, nickname, avatar);
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every(char => char !== '');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="join-room-title" className="fixed inset-0 z-[100] flex items-center justify-center font-body-md p-4 overflow-y-auto">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-md" onClick={onClose}></div>
        
        {/* Modal Container */}
        <div className="relative z-10 my-auto w-full max-w-[480px] bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant animate-fade-in-up">
            
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
                <div>
                    <h2 id="join-room-title" className="font-headline-lg text-3xl mb-1 text-on-background">Join Room</h2>
                    <p className="font-body-md text-on-surface-variant">Enter the 6-digit invite code.</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors" aria-label="Close">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {!user ? (
                   <div className="text-center py-6">
                     <div className="w-16 h-16 rounded-full bg-error-container text-primary flex items-center justify-center mx-auto mb-4 shadow-soft">
                       <span className="material-symbols-outlined text-[32px]">account_circle</span>
                     </div>
                     <h3 className="font-headline-md text-xl mb-2 text-on-background">Sign in to join</h3>
                     <p className="font-body-md text-on-surface-variant mb-6">You need an account to join a room.</p>
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
                  <form onSubmit={handleSubmit} className="flex flex-col items-center">
                      <div className="flex justify-between w-full max-w-[360px] mb-10" onPaste={handlePaste}>
                          {code.map((char, index) => (
                              <input 
                                  key={index}
                                  ref={el => inputRefs.current[index] = el}
                                  type="text" 
                                  maxLength="1"
                                  className="code-input-slot font-display-lg" 
                                  placeholder="0"
                                  value={char}
                                  onChange={(e) => handleInputChange(index, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(index, e)}
                                  disabled={loading}
                              />
                          ))}
                      </div>

                      {/* Inline error message */}
                      {errorMsg && (
                        <p className="text-error text-sm font-label-md mb-4 text-center flex items-center gap-2 justify-center">
                          <span className="material-symbols-outlined text-[16px]">error</span>
                          {errorMsg}
                        </p>
                      )}

                      <div className="w-full space-y-4">
                          <button 
                              type="submit" 
                              disabled={!isComplete || loading}
                              className="btn btn-primary w-full py-4 text-base"
                          >
                              {loading ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined">login</span>
                                  Join Room
                                </>
                              )}
                          </button>
                      </div>
                  </form>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 bg-surface-container flex items-center justify-center gap-2 text-on-surface-variant font-label-sm">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                End-to-end encrypted connection
            </div>
        </div>
    </div>
  );
}
