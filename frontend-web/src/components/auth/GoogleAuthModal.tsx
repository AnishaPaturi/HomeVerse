"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, ExternalLink, ChevronDown, Check, Loader2, ArrowLeft } from "lucide-react";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: string;
  authProvider: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleUser) => void;
}

interface AccountItem {
  id: string;
  name: string;
  email: string;
  initial: string;
  color: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"chooser" | "custom_input" | "consent" | "authenticating">("chooser");
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);

  // Accounts from the reference video
  const accounts: AccountItem[] = [
    {
      id: "acc_1",
      name: "anisha paturi",
      email: "paturi.anisha@gmail.com",
      initial: "a",
      color: "bg-[#0f5132] text-[#d1e7dd]",
    },
    {
      id: "acc_2",
      name: "AgentSheild AI",
      email: "agentsheildai@gmail.com",
      initial: "A",
      color: "bg-[#084298] text-[#cfe2ff]",
    },
  ];

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep("chooser");
      setSelectedAccount(null);
      setIsLoadingTransition(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = (acc: AccountItem) => {
    setIsLoadingTransition(true);
    setSelectedAccount(acc);

    // Simulate the brief Google loading bar sweep from video frame 10
    setTimeout(() => {
      setIsLoadingTransition(false);
      setStep("consent");
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    const name = customName.trim() || customEmail.split("@")[0];
    const acc: AccountItem = {
      id: `acc_custom_${Date.now()}`,
      name,
      email: customEmail.trim(),
      initial: name.charAt(0).toUpperCase(),
      color: "bg-[#6c757d] text-white",
    };

    setIsLoadingTransition(true);
    setSelectedAccount(acc);
    setTimeout(() => {
      setIsLoadingTransition(false);
      setStep("consent");
    }, 400);
  };

  const handleFinalContinue = async () => {
    if (!selectedAccount) return;
    setStep("authenticating");

    let assignedId = `google-${Date.now()}`;
    try {
      const res = await fetch("http://localhost:8080/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedAccount.email,
          name: selectedAccount.name,
          token: "simulated_google_oauth_token",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user?.id) assignedId = data.user.id;
      }
    } catch (_) {}

    const authUser: GoogleUser = {
      id: assignedId,
      name: selectedAccount.name,
      email: selectedAccount.email,
      avatar: selectedAccount.initial,
      plan: "Pro Designer",
      authProvider: "google",
    };

    sessionStorage.setItem("user", JSON.stringify(authUser));

    // Finish authentication with short delay for visual realism
    setTimeout(() => {
      onSuccess(authUser);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Google Chrome Window Wrapper */}
      <div className="w-full max-w-[480px] bg-[#202124] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] border border-[#3c4043] overflow-hidden flex flex-col font-sans select-none animate-in zoom-in-95 duration-200">
        
        {/* Chrome Top Title Bar */}
        <div className="bg-[#292a2d] px-4 py-2.5 flex items-center justify-between border-b border-[#3c4043] text-xs text-[#9aa0a6]">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z" />
            </svg>
            <span className="truncate text-[11px] text-[#bdc1c6]">
              Sign in - Google Accounts - Google Chrome
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[#9aa0a6]">
            <span className="cursor-pointer hover:text-white">─</span>
            <span className="cursor-pointer hover:text-white">□</span>
            <span
              onClick={onClose}
              className="cursor-pointer hover:text-red-400 font-bold px-1"
              title="Close"
            >
              ✕
            </span>
          </div>
        </div>

        {/* Chrome URL Address Bar */}
        <div className="bg-[#202124] px-4 py-2 flex items-center gap-2 border-b border-[#35363a] text-[11px] text-[#9aa0a6]">
          <Lock className="w-3 h-3 text-[#8ab4f8] shrink-0" />
          <span className="truncate font-mono text-[10px] text-[#9aa0a6]">
            https://accounts.google.com/v3/signin/accountchooser?as=HomeVerse-OAuth-2.0
          </span>
        </div>

        {/* Indeterminate loading bar during transition */}
        <div className="h-1 w-full bg-[#202124] overflow-hidden">
          {isLoadingTransition && (
            <div className="h-full bg-[#8ab4f8] animate-pulse w-full" />
          )}
        </div>

        {/* Dialog Body (Dark Google Sign-In Interface) */}
        <div className="p-6 sm:p-8 bg-[#1f1f1f] text-[#e3e3e3] flex-1 flex flex-col justify-between min-h-[460px]">
          
          {/* STEP 1: CHOOSE AN ACCOUNT */}
          {step === "chooser" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Google Brand Header */}
                <div className="flex items-center gap-2 text-sm text-[#e3e3e3] font-medium">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z" />
                  </svg>
                  <span>Sign in with Google</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-normal text-white">Choose an account</h2>
                  <p className="text-xs text-[#c4c7c5]">
                    to continue to <strong className="text-[#a8c7fa] font-semibold">HomeVerse: Spatial OS</strong>
                  </p>
                </div>

                {/* Account List */}
                <div className="space-y-1 pt-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full p-3 rounded-2xl hover:bg-[#2d2e30] active:bg-[#353739] transition-all flex items-center gap-3.5 text-left cursor-pointer group"
                    >
                      <div
                        className={`w-9 h-9 rounded-full ${acc.color} flex items-center justify-center font-bold text-sm shrink-0`}
                      >
                        {acc.initial}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-[#a8c7fa] transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-xs text-[#9aa0a6] truncate">{acc.email}</div>
                      </div>
                    </button>
                  ))}

                  <div className="border-t border-[#35363a] my-2" />

                  {/* Use another account option */}
                  <button
                    type="button"
                    onClick={() => setStep("custom_input")}
                    className="w-full p-3 rounded-2xl hover:bg-[#2d2e30] active:bg-[#353739] transition-all flex items-center gap-3.5 text-left cursor-pointer text-[#e3e3e3] hover:text-white"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#35363a] flex items-center justify-center text-[#c4c7c5] shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-medium">Use another account</div>
                  </button>
                </div>
              </div>

              {/* Footer Terms Note */}
              <div className="space-y-4 pt-4 border-t border-[#35363a]">
                <p className="text-[11px] text-[#9aa0a6] leading-relaxed">
                  Before using this app, you can review HomeVerse's{" "}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{" "}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] pt-1">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <span>English (United States)</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hover:text-white cursor-pointer">Help</span>
                    <span className="hover:text-white cursor-pointer">Privacy</span>
                    <span className="hover:text-white cursor-pointer">Terms</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOM ACCOUNT INPUT */}
          {step === "custom_input" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("chooser")}
                  className="flex items-center gap-1.5 text-xs text-[#8ab4f8] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to accounts</span>
                </button>

                <div className="flex items-center gap-2 text-sm text-[#e3e3e3] font-medium">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z" />
                  </svg>
                  <span>Sign in with Google</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-normal text-white">Sign in</h2>
                  <p className="text-xs text-[#c4c7c5]">
                    to continue to <strong className="text-[#a8c7fa]">HomeVerse</strong>
                  </p>
                </div>

                <form onSubmit={handleCustomSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9aa0a6]">Email or phone</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="your.email@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#131314] border border-[#3c4043] focus:border-[#8ab4f8] rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9aa0a6]">Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. John Architect"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#131314] border border-[#3c4043] focus:border-[#8ab4f8] rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep("chooser")}
                      className="text-xs text-[#8ab4f8] hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-full bg-[#8ab4f8] text-[#001d35] font-semibold text-xs hover:bg-[#a8c7fa] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3: GOOGLE CONSENT & PERMISSION SCREEN (Frame 13 of Video) */}
          {step === "consent" && selectedAccount && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Brand header */}
                <div className="flex items-center gap-2 text-sm text-[#e3e3e3] font-medium">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z" />
                  </svg>
                  <span>Sign in with Google</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-normal text-white">Sign in to HomeVerse</h2>
                </div>

                {/* Selected account selector pill (clickable to change account) */}
                <div
                  onClick={() => setStep("chooser")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d2e30] hover:bg-[#353739] text-xs text-[#e3e3e3] border border-[#3c4043] cursor-pointer transition-all"
                  title="Click to switch account"
                >
                  <div className={`w-5 h-5 rounded-full ${selectedAccount.color} flex items-center justify-center font-bold text-[10px]`}>
                    {selectedAccount.initial}
                  </div>
                  <span className="font-mono text-[11px] truncate max-w-[220px]">{selectedAccount.email}</span>
                  <ChevronDown className="w-3 h-3 text-[#9aa0a6]" />
                </div>

                {/* Scope Permissions Statement */}
                <p className="text-xs text-[#c4c7c5] pt-1">
                  Google will allow <strong className="text-[#a8c7fa] font-semibold">HomeVerse</strong> to access this info about you:
                </p>

                {/* Scopes list with icons */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#28292c] border border-[#35363a]">
                    <User className="w-4 h-4 text-[#8ab4f8] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-medium text-white">{selectedAccount.name}</div>
                      <div className="text-[#9aa0a6] text-[11px]">Name and profile picture</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#28292c] border border-[#35363a]">
                    <svg className="w-4 h-4 text-[#8ab4f8] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="text-xs">
                      <div className="font-medium text-white">{selectedAccount.email}</div>
                      <div className="text-[#9aa0a6] text-[11px]">Email address</div>
                    </div>
                  </div>
                </div>

                {/* Legal notes */}
                <p className="text-[11px] text-[#9aa0a6] leading-relaxed pt-2">
                  Review HomeVerse's{" "}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{" "}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span> to understand how HomeVerse will process and protect your data.
                </p>
                <p className="text-[10px] text-[#80868b]">
                  To make changes at any time, go to your Google Account. Learn more about{" "}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Sign in with Google</span>.
                </p>
              </div>

              {/* Action Buttons (Cancel / Continue) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#35363a]">
                <button
                  type="button"
                  onClick={() => setStep("chooser")}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#8ab4f8] hover:bg-[#2d2e30] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalContinue}
                  className="px-6 py-2.5 rounded-full bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#001d35] font-bold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: AUTHENTICATING / REDIRECTING */}
          {step === "authenticating" && selectedAccount && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-5 text-center py-12">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-[#35363a] border-t-[#8ab4f8] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.1L1.9 16.6C3.7 20.4 7.5 23.5 12 23.5z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-medium text-white">Signing in to HomeVerse</h3>
                <p className="text-xs text-[#9aa0a6]">
                  Authenticating as <span className="text-[#8ab4f8]">{selectedAccount.email}</span>...
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#34A853] font-mono">
                <Check className="w-3.5 h-3.5" />
                <span>Google OAuth 2.0 Identity Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
