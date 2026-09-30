"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Sparkles, ArrowLeft, Star } from "lucide-react";

function LoginContent() {
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
            <span>AI SPATIAL CAD OS</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
            Your space.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Your vision.
            </span>
          </h1>

          <p className="text-slate-300 text-base font-light leading-relaxed max-w-md">
            Sign in to access your saved multi-floor digital twins, live budget allocations, and generative 3D CAD scenes.
          </p>

          <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08] flex items-center gap-4 max-w-md shadow-xl">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100",
              ].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-[#090e15] object-cover"
                />
              ))}
            </div>
            <div className="space-y-0.5 text-xs font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <Star className="w-3.5 h-3.5 fill-emerald-400" />
                <span className="font-bold text-white">4.9 / 5.0</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Trusted by 2,400+ homeowners & interior designers
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white font-mono">Sign In to Studio</h2>
              <Link
                href="/signup"
                className="text-xs font-mono text-emerald-400 hover:underline"
              >
                Create Account →
              </Link>
            </div>

            <LoginForm redirectTo="/dashboard" />
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b10] flex items-center justify-center text-emerald-400 font-mono">LOADING HOMEVERSE AUTH...</div>}>
      <LoginContent />
    </Suspense>
  );
}
