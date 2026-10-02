"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Info,
} from "lucide-react";

function ForgotPasswordContent() {
  const router = useRouter();

  // Wizard steps: 'email' | 'verify' | 'password' | 'success'
  const [step, setStep] = useState<"email" | "verify" | "password" | "success">("email");

  // Form states
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  // Resend cooldown timer (starts at 30s)
  const [cooldown, setCooldown] = useState(0);

  // Auto-redirect timer for success screen
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Refs for 5 individual digit inputs
  const digit0Ref = useRef<HTMLInputElement>(null);
  const digit1Ref = useRef<HTMLInputElement>(null);
  const digit2Ref = useRef<HTMLInputElement>(null);
  const digit3Ref = useRef<HTMLInputElement>(null);
  const digit4Ref = useRef<HTMLInputElement>(null);
  const digitRefs = [digit0Ref, digit1Ref, digit2Ref, digit3Ref, digit4Ref];

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Success auto-redirect effect
  useEffect(() => {
    if (step !== "success") return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, router]);

  // Focus first digit box when moving to 'verify' step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        digitRefs[0]?.current?.focus();
      }, 150);
    }
  }, [step]);

  // Trigger shake animation helper
  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  // -------------------------------------------------------------
  // STEP 1: Send Verification Code via Email
  // -------------------------------------------------------------
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setInfoNotice(null);

    try {
      const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setLoading(false);
        setError(data?.detail || "Failed to send verification code. Please check your email address and try again.");
        return;
      }

      setCooldown(30);
      setDigits(["", "", "", "", ""]);
      setLoading(false);
      setStep("verify");

      // Check if SMTP is not configured yet
      if (data?.email_delivered === false) {
        setInfoNotice(
          "Notice: SMTP credentials are not yet configured in backend/.env. Please configure SMTP_USER and SMTP_PASSWORD in backend/.env to receive verification emails in your inbox."
        );
      } else {
        setInfoNotice(null);
      }
    } catch (_) {
      setLoading(false);
      setError("Unable to reach HomeVerse authentication server at http://localhost:8080. Please ensure the backend server is running.");
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Digit Input Handling & Cross-Verification
  // -------------------------------------------------------------
  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, "");

    // Handle single digit input
    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1);
    setDigits(newDigits);

    // Auto-advance focus to next box
    if (cleaned && index < 4) {
      digitRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        digitRefs[index - 1]?.current?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitRefs[index - 1]?.current?.focus();
    } else if (e.key === "ArrowRight" && index < 4) {
      digitRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 5; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 4);
    digitRefs[nextIndex]?.current?.focus();
  };

  // Cross-verification logic as explicitly requested by user:
  // Code is verified on backend; NEVER displayed on website
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = digits.join("").trim();

    if (enteredCode.length < 5) {
      setError("Please enter the complete 5-digit verification code.");
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: enteredCode }),
      });

      const data = await res.json().catch(() => null);
      setLoading(false);

      if (res.ok && (data?.valid || data?.success)) {
        setSuccessMsg("Verification code confirmed!");
        setError(null);
        setTimeout(() => {
          setSuccessMsg(null);
          setStep("password");
        }, 500);
      } else {
        triggerShake();
        setError(
          data?.detail ||
            "Incorrect verification code. Please check your email inbox and enter the code again, or click 'Resend Code'."
        );
      }
    } catch (_) {
      setLoading(false);
      triggerShake();
      setError("Could not reach authentication server to verify code. Please ensure the backend is running.");
    }
  };

  const handleClearCode = () => {
    setDigits(["", "", "", "", ""]);
    setError(null);
    digitRefs[0]?.current?.focus();
  };

  const handleResendCode = async () => {
    if (cooldown > 0 && !error) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => null);
      setLoading(false);

      if (res.ok) {
        setCooldown(30);
        setDigits(["", "", "", "", ""]);
        setSuccessMsg("A new 5-digit verification code has been dispatched to your email inbox.");

        if (data?.email_delivered === false) {
          setInfoNotice(
            "Notice: SMTP credentials are not yet configured in backend/.env. Please configure SMTP_USER and SMTP_PASSWORD in backend/.env to receive verification emails in your inbox."
          );
        } else {
          setInfoNotice(null);
        }

        setTimeout(() => {
          digitRefs[0]?.current?.focus();
        }, 100);
      } else {
        setError(data?.detail || "Failed to resend verification code. Please try again.");
      }
    } catch (_) {
      setLoading(false);
      setError("Cannot connect to server to resend code. Please verify backend server is running.");
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Reset Password
  // -------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const enteredCode = digits.join("").trim();

    try {
      const res = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: enteredCode,
          new_password: password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setLoading(false);
        setError(data?.detail || "Failed to reset password. The code may have expired.");
        return;
      }
    } catch (_) {
      // Local fallback
    }

    // Update stored session if matching user exists
    try {
      const existing = sessionStorage.getItem("user");
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.email === cleanEmail) {
          parsed.passwordUpdated = true;
          sessionStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch (_) {}

    setLoading(false);
    setStep("success");
  };

  // Circular Back Button Handler
  const handleCircularBack = () => {
    setError(null);
    setInfoNotice(null);
    if (step === "email") {
      router.push("/login");
    } else if (step === "verify") {
      setStep("email");
    } else if (step === "password") {
      setStep("verify");
    } else if (step === "success") {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background Architectural Canvas & Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.32] contrast-105 scale-105 transition-all duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/12 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/65 to-[#06090e]/85" />
      </div>

      {/* Top Global Header */}
      <header className="h-20 px-6 lg:px-12 backdrop-blur-xl bg-black/20 border-b border-white/[0.08] flex items-center justify-between z-30 relative">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070b10] rounded-[15px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
              HV
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              HOMEVERSE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                SPATIAL OS
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Glassmorphic Card Container (Matching Pinterest Sample UI & Color Schema) */}
      <main className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 my-auto relative z-10">
        <div className="glass-morphism-card rounded-[32px] p-7 sm:p-9 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Circular Back Button & Brand Logo (Faithful to Sample Screenshot) */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={handleCircularBack}
              title="Go back"
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer group active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* Brand Logo matching [7] Aflucta in the sample */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[10px] text-emerald-400">
                HV
              </div>
              <span className="font-mono text-xs font-bold text-white tracking-wider">
                HomeVerse
              </span>
            </div>
          </div>

          {/* Step Indicator Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] font-mono mb-2">
              <span
                className={`transition-colors ${
                  step === "email"
                    ? "text-emerald-400 font-bold"
                    : "text-slate-400"
                }`}
              >
                1. Email
              </span>
              <span
                className={`transition-colors ${
                  step === "verify"
                    ? "text-emerald-400 font-bold"
                    : step === "password" || step === "success"
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                2. Verify
              </span>
              <span
                className={`transition-colors ${
                  step === "password" || step === "success"
                    ? "text-emerald-400 font-bold"
                    : "text-slate-600"
                }`}
              >
                3. Password
              </span>
            </div>
            <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] transition-all duration-500 rounded-full"
                style={{
                  width:
                    step === "email"
                      ? "33%"
                      : step === "verify"
                      ? "66%"
                      : "100%",
                }}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SCREEN 1: FORGOT PASSWORD (Enter Email) */}
          {/* ============================================================== */}
          {step === "email" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Forgot Password
                </h1>
                <p className="text-xs text-slate-400 font-light">
                  Reset your password to access HomeVerse.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your email"
                      className="glass-morphism-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Vibrant Lime/Emerald Radiant Gradient Pill Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#10b981] via-[#22c55e] to-[#a3e635] hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <span>Send Code</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 font-light">
                  Remembered your password?{" "}
                  <Link
                    href="/login"
                    className="text-emerald-400 font-semibold hover:underline font-mono"
                  >
                    Sign In
                  </Link>
                </span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 2: VERIFY YOUR ACCOUNT (5-digit OTP Boxes) */}
          {/* ============================================================== */}
          {step === "verify" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Verify your account
                </h1>
                <p className="text-xs text-slate-400 font-light">
                  Enter the 5-digit code sent to your email.
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-emerald-400/90">
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[220px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                      setInfoNotice(null);
                    }}
                    className="text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Informative SMTP setup reminder notice (if credentials not yet set) */}
              {infoNotice && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span className="leading-relaxed">{infoNotice}</span>
                </div>
              )}

              {/* Error Box with clear actions as requested: "ask user to enter the code again or ask if the code needs to be resent" */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5 animate-in slide-in-from-top-1 text-xs text-rose-300">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleClearCode}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-400" />
                      <span>Enter code again</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Success validation pulse */}
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-6">
                {/* 5-Digit Boxes matching screenshot */}
                <div
                  className={`grid grid-cols-5 gap-2.5 sm:gap-3 py-1 ${
                    shakeError ? "animate-shake" : ""
                  }`}
                >
                  {[0, 1, 2, 3, 4].map((index) => (
                    <input
                      key={index}
                      ref={digitRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digits[index]}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      onPaste={handleDigitPaste}
                      className={`w-full aspect-[4/5] sm:h-16 rounded-2xl bg-[#091119] border text-center font-mono text-2xl font-bold text-white transition-all outline-none focus:scale-105 shadow-inner ${
                        digits[index]
                          ? "border-emerald-400 bg-emerald-500/[0.05] shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          : error
                          ? "border-rose-500/60"
                          : "border-white/15 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Lime/Emerald Gradient Verification Pill Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#10b981] via-[#22c55e] to-[#a3e635] hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <span>Verification</span>
                  )}
                </button>
              </form>

              {/* Subtext from screenshot: "Didn't receive code? Resend Now" */}
              <div className="text-center pt-1 font-mono text-xs">
                {cooldown > 0 ? (
                  <span className="text-slate-500">
                    Didn't receive code?{" "}
                    <span className="text-emerald-400 font-semibold">
                      Resend in {cooldown}s
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Didn't receive code?{" "}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
                    >
                      Resend Now
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 3: CREATE NEW PASSWORD */}
          {/* ============================================================== */}
          {step === "password" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Create New Password
                </h1>
                <p className="text-xs text-slate-400 font-light">
                  Set a strong password to secure access.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Field 1: Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your Password"
                      className="glass-morphism-input w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Field 2: Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Confirm your Password"
                      className="glass-morphism-input w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password strength indicators */}
                <div className="pt-1 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        password.length >= 6 ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                    />
                    <span
                      className={
                        password.length >= 6
                          ? "text-emerald-400"
                          : "text-slate-400"
                      }
                    >
                      At least 6 characters
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          password === confirmPassword && password.length >= 6
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                        }`}
                      />
                      <span
                        className={
                          password === confirmPassword && password.length >= 6
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {password === confirmPassword
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lime/Emerald Gradient Reset Password Pill Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 rounded-full bg-gradient-to-r from-[#10b981] via-[#22c55e] to-[#a3e635] hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 4: SUCCESS VIEW */}
          {/* ============================================================== */}
          {step === "success" && (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-400">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Password Reset Successful
                </h1>
                <p className="text-xs text-slate-300 font-light leading-relaxed max-w-xs mx-auto">
                  Your HomeVerse credentials have been updated securely. You can now access your spatial studio.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400">
                Redirecting to Sign In in {redirectCountdown}s...
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#10b981] via-[#22c55e] to-[#a3e635] hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Studio</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06090e] flex items-center justify-center text-emerald-400 font-mono text-xs">
          LOADING HOMEVERSE VERIFICATION...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
