"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { Sparkles, ArrowLeft, Star, ShieldCheck } from "lucide-react";

function SignupContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 px-6 lg:px-12 bg-[#090e15]/80 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between z-30">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-mono font-bold text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            HV
          </div>
          <span className="font-mono text-base font-bold text-white tracking-tight">
            HOMEVERSE
          </span>
        </div>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 hidden lg:flex flex-col justify-center space-y-8 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>JOIN HOMEVERSE ARCHITECTURE OS</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
            Build your dream home.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Within budget.
            </span>
          </h1>

          <p className="text-slate-300 text-base font-light leading-relaxed max-w-md">
            Create an account to start your House → Floor → Room design flow with real Indian market budget guardrails.
          </p>

          <div className="space-y-3 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full parametric 3D CAD engine (Three.js WebGL)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>₹ INR budget envelopes with real-time what-if deltas</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant catalog pricing & vendor procurement</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white font-mono">Create Account</h2>
              <Link
                href="/login"
                className="text-xs font-mono text-emerald-400 hover:underline"
              >
                Sign In Instead →
              </Link>
            </div>

            <SignupForm redirectTo="/home/new" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06]">
        © {new Date().getFullYear()} HomeVerse AI. Spatial CAD & Generative Architecture OS.
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b10] flex items-center justify-center text-emerald-400 font-mono">LOADING REGISTRATION...</div>}>
      <SignupContent />
    </Suspense>
  );
}
