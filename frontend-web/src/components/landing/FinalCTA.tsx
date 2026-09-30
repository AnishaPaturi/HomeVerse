"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Wand2, ShieldCheck, Zap, ArrowRight, MessageSquare, Sparkles } from "lucide-react";

interface FinalCTAProps {
  isAuthenticated: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ isAuthenticated }) => {
  const router = useRouter();

  return (
    <section className="py-24 px-6 lg:px-12 bg-gradient-to-b from-[#070b10] to-[#040608] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Grand Glassmorphic Card Container */}
        <div className="glass-morphism-card rounded-3xl p-8 sm:p-14 text-center space-y-8 border border-white/15 relative overflow-hidden shadow-2xl">
          {/* Subtle Accent Glow inside */}
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>COMMENCE YOUR RESIDENTIAL PROJECT</span>
          </div>

          {/* Editorial Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] font-editorial max-w-3xl mx-auto">
            Ready to experience your future home before spending a single Rupee?
          </h2>

          <p className="text-slate-300 text-base sm:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Create your residence, upload your blueprint, and let the spatial engine generate your interactive 3D digital twin and exact contractor Bill of Materials in minutes.
          </p>

          {/* Dual Action Buttons (2nd CTA Ending) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Wand2 className="w-4 h-4" />
              <span>Start Designing Your Home Free →</span>
            </button>

            <a
              href="#contact"
              className="w-full sm:w-auto px-7 py-4 rounded-full glass-morphism hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/15 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Talk to an Architect</span>
            </a>
          </div>

          {/* Guarantees */}
          <div className="pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant 3D Preview</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Indian Rate Book Data</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
