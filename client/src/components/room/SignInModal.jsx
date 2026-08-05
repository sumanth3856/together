import React from 'react';
import { supabase } from '../../lib/supabase';

export function SignInModal({ isOpen, onClose }) {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-body-md">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-md" onClick={onClose}></div>
        
        {/* Modal Container */}
        <div className="relative z-10 w-full max-w-[480px] bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant animate-fade-in-up">
            
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
                <div>
                    <h2 className="font-headline-lg text-3xl mb-1 text-on-background">Sign In</h2>
                    <p className="font-body-md text-on-surface-variant">Welcome back to Being Us.</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-error-container text-primary flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">login</span>
                </div>
                <button onClick={handleGoogleSignIn} className="w-full py-4 rounded-xl font-label-lg border border-outline hover:bg-surface-container transition-colors flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                </button>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 bg-surface-container flex items-center justify-center gap-2 text-on-surface-variant font-label-sm">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Secure authentication
            </div>
        </div>
    </div>
  );
}
