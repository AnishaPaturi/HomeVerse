"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, Play, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Hero3DScene from "./Hero3DScene";

interface HeroProps {
  heroStyle: string;
  onStyleChange: (style: string) => void;
  onOpenDemoModal: () => void;
  isAuthenticated: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  heroStyle,
  onStyleChange,
  onOpenDemoModal,
  isAuthenticated,
}) => {
  const router = useRouter();

  return (
    <section id="hero" className="relative pt-8 sm:pt-14 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Architectural Editorial Text & CTAs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wide shadow-lg shadow-emerald-500/5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">AI Spatial CAD · Budget Governance</span>
          </div>

          {/* Headline inspired by DHI Atelier editorial layout */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] font-editorial">
            Curate your space.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-200">
              Before you spend a Rupee.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
            Turn your 2D floor plans, hand-drawn blueprints, or photos into an interactive, photorealistic 3D digital twin — mathematically bound to your strict Indian budget from day one.
          </p>

          {/* Dual Call-To-Action (1. Call to Action Button) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
              className="group flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Wand2 className="w-4 h-4" />
              <span>Start Free Project →</span>
            </button>

            <button
              onClick={onOpenDemoModal}
              className="glass-morphism hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/15 font-mono text-xs px-6 py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Watch 2-Min Demo</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-mono border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">₹ Budget Guardrails</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WebGL 3D Twin</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Sub-Second Load</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive 3D Canvas Studio */}
        <div className="lg:col-span-7 relative">
          <Hero3DScene styleName={heroStyle} onStyleChange={onStyleChange} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
