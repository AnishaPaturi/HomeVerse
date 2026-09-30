"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Wand2, ShieldCheck, Zap } from "lucide-react";

interface FinalCTAProps {
  isAuthenticated: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ isAuthenticated }) => {
  const router = useRouter();

  return (
    <section className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-gradient-to-b from-[#070b10] to-[#040608] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Zap className="w-3.5 h-3.5" />
          <span>START DESIGNING TODAY</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Ready to experience your home before spending a single Rupee?
        </h2>

        <p className="text-slate-300 text-base sm:text-lg font-light max-w-2xl mx-auto leading-relaxed">
          Create your house, allocate budgets with confidence, and let AI build your interactive 3D digital twin in minutes.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push(isAuthenticated ? "/home/new" : "/login")}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              <span>✨ Start Your Home Project</span>
            </span>
          </button>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant 3D Preview</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Free Indian Catalog Integration</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
