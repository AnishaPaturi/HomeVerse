"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Sparkles, ArrowLeft, Star, ShieldCheck, Lock } from "lucide-react";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background Architectural Canvas & Ambient Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Architectural Backdrop Image with dark gradient wash */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.35] contrast-105 scale-105 transition-all duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/60 to-[#06090e]/80" />
      </div>

      {/* Top Header */}
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
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Glassmorphic Container (Pinterest Daily UI Reference) */}
      <main className="max-w-6xl mx-auto w-full px-6 lg:px-12 py-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left Column: Architectural Story & Testimonial Preview */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-8 pr-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI SPATIAL ARCHITECTURE STUDIO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] font-editorial">
            Where Vision Meets Budget Certainty.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Enter your spatial studio to view your multi-floor digital twins, inspect room-by-room Indian budget allocations, and experiment with real-time material swaps.
          </p>

          {/* Social Proof Glass Card */}
          <div className="glass-morphism rounded-2xl p-5 border border-white/10 flex items-center gap-4 max-w-md shadow-2xl">
            <div className="flex -space-x-2 shrink-0">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
              ].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="User"
                  className="w-9 h-9 rounded-full border-2 border-[#090e15] object-cover"
                />
              ))}
            </div>
            <div className="space-y-0.5 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Star className="w-3.5 h-3.5 fill-emerald-400" />
                <span className="font-bold text-white">4.92 / 5.0 Rating</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Trusted by 2,840+ Indian homeowners and architectural firms
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Centered Glassmorphic Auth Card */}
        <div className="lg:col-span-7 w-full max-w-md mx-auto">
          <div className="glass-morphism-card rounded-3xl p-7 sm:p-9 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
            {/* Ambient inner card accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Segmented Glass Switcher [Sign In] [Create Account] */}
            <div className="p-1 rounded-2xl glass-morphism border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                  authMode === "login"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                  authMode === "signup"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Card Header */}
            <div>
              <h2 className="text-2xl font-bold text-white font-editorial">
                {authMode === "login" ? "Welcome Back to Studio" : "Begin Your Home Twin"}
              </h2>
              <p className="text-xs text-slate-400 font-light mt-1">
                {authMode === "login"
                  ? "Access your saved residential models and budget envelopes."
                  : "Launch your 9-step home setup with Indian budget guardrails."}
              </p>
            </div>

            {/* Dynamic Form Render */}
            {authMode === "login" ? (
              <LoginForm redirectTo="/dashboard" />
            ) : (
              <SignupForm redirectTo="/home/new" />
            )}

            {/* Card Bottom Security Badge */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-Bit SSL Encrypted · RERA Aligned Platform</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06090e] flex items-center justify-center text-emerald-400 font-mono">LOADING HOMEVERSE STUDIO...</div>}>
      <AuthContent />
    </Suspense>
  );
}
