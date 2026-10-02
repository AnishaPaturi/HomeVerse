"use client";

import React, { useState } from "react";
import GoogleAuthModal from "./GoogleAuthModal";

interface GoogleAuthButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenGoogleAuth = () => {
    setModalOpen(true);
  };

  const handleSuccess = (user: any) => {
    if (onSuccess) {
      onSuccess(user);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenGoogleAuth}
        disabled={disabled}
        className="glass-morphism w-full py-3.5 px-4 rounded-2xl hover:bg-white/[0.08] border border-white/15 text-slate-200 hover:text-white font-mono text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Interactive Google OAuth Dialog & Consent Flow matching GoogleAuthVideo.mp4 */}
      <GoogleAuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default GoogleAuthButton;
