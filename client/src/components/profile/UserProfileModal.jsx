import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export function UserProfileModal({ isOpen, onClose, user }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const setToastNotification = useUIStore(state => state.setToastNotification);

  useLockBodyScroll(isOpen);

  React.useEffect(() => {
    setDisplayName(user?.user_metadata?.full_name || '');
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      });
      
      if (error) throw error;
      setToastNotification({ type: 'success', message: 'Profile updated successfully!' });
      onClose();
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onClose();
    } catch (err) {
      alert('Error logging out: ' + err.message);
      setIsLoggingOut(false);
    }
  };

  // Mock initial for avatar if not using boring-avatars right now
  const initial = displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-body-md p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-md" onClick={onClose}></div>
        
        {/* Modal Container */}
        <div className="relative z-10 w-full max-w-[800px] bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant animate-fade-in-up flex flex-col md:flex-row">
            
            {/* Left Sidebar: Profile Summary */}
            <div className="w-full md:w-1/3 bg-surface-container p-8 flex flex-col items-center text-center border-r border-outline-variant/50">
                <div className="w-32 h-32 rounded-full bg-error-container text-primary flex items-center justify-center text-5xl font-display-lg mb-6 border-4 border-surface-container-lowest shadow-lg ambient-shadow">
                    {initial}
                </div>
                <h2 className="font-headline-md text-2xl mb-1 text-on-background">{displayName || 'User'}</h2>
                <p className="font-label-sm text-on-surface-variant break-all">{user?.email}</p>
                <div className="mt-auto pt-8 w-full">
                    <button 
                        onClick={() => setShowSignoutConfirm(true)}
                        disabled={isLoggingOut}
                        className="w-full py-3 rounded-xl font-label-lg text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-error/20"
                    >
                        {isLoggingOut ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">logout</span>
                                Sign Out
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Content: Settings Form */}
            <div className="w-full md:w-2/3 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-lg text-3xl text-on-background">Account Settings</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block font-label-lg text-on-surface">Display Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="font-label-sm text-on-surface-variant opacity-70">This is how you will appear to others in the room.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block font-label-lg text-on-surface">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full bg-surface-container/50 border border-outline-variant/50 rounded-xl px-4 py-3 font-body-md text-on-surface-variant cursor-not-allowed"
                            value={user?.email || ''}
                            disabled
                        />
                    </div>

                    <div className="pt-6 border-t border-outline-variant/50 flex justify-between items-center">
                        <button type="button" className="text-error font-label-sm hover:underline">
                            Deactivate Account
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving || !displayName.trim()}
                            className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-lg hover:bg-surface-tint transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {showSignoutConfirm && (
            <ConfirmationModal
                title="Sign Out"
                message="Are you sure you want to sign out? You will be disconnected from any active rooms."
                confirmText="Sign Out"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                    setShowSignoutConfirm(false);
                    handleLogout();
                }}
                onCancel={() => setShowSignoutConfirm(false)}
            />
        )}
    </div>
  );
}
