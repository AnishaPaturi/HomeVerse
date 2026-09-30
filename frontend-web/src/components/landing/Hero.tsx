"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, Play, CheckCircle2 } from "lucide-react";
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
    <section id="hero" className="relative pt-12 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Next-Gen Spatial CAD + Generative AI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Design your space.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Before you build it.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
            Turn a single room photo, architectural floor plan, or blank canvas into an interactive, editable 3D digital twin — governed by your real budget from day one.
          </p>

          {/* Dual CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => router.push(isAuthenticated ? "/home/new" : "/login")}
              className="group flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm uppercase tracking-wider px-7 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>✨ Start Home Creation</span>
            </button>

            <button
              onClick={onOpenDemoModal}
              className="flex items-center justify-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-mono text-sm px-6 py-4 rounded-full transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Watch Interactive Demo</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-4 flex items-center gap-6 text-xs text-slate-400 font-mono border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Budget Guardrails</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Editable Three.js Twin</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive 3D Room */}
        <div className="lg:col-span-7 relative">
          <Hero3DScene styleName={heroStyle} onStyleChange={onStyleChange} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
