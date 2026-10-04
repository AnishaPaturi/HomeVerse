"use client";

import React from "react";
import { Sparkles, Check, Cpu, RefreshCw, Smartphone, Monitor } from "lucide-react";

export const UniqueValue: React.FC = () => {
  return (
    <section id="unique-value" className="py-24 px-6 lg:px-12 bg-gradient-to-b from-[#070b10] via-[#090e15] to-[#070b10] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>THE HOMEVERSE PARADIGM SHIFT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Why Other Interior AI Tools Fail Where HomeVerse Excels
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            Most "AI interior apps" simply generate generic 2D pixel hallucinations that ignore budget limits, wall clearances, and Indian vendor availability. HomeVerse was built on three foundational architectural breakthroughs.
          </p>
        </div>

        {/* 3 Unique Value Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-morphism rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-xl font-bold text-white">
                Budget Governs Geometry
              </h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                In HomeVerse, financial bounds are not an afterthought. When you assign ₹20 Lakhs, every material shader, lighting fixture, and millwork specification is mathematically constrained by your budget tier.
              </p>
            </div>
            <ul className="space-y-2.5 pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero financial blindspots</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-allocation across 5 trades</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live Indian market rate updates</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-morphism rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 border-emerald-500/30 bg-emerald-500/[0.02]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-xl font-bold text-white">
                True Parametric 3D CAD Twin
              </h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Not a static image render. You receive an editable 3D WebGL digital twin. Every object has real dimensions, rotational coordinates, collision bounding boxes, and manufacturer SKUs.
              </p>
            </div>
            <ul className="space-y-2.5 pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>First-person 3D walk mode</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transform gizmos & snap-to-wall</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dynamic PBR lighting & shadows</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-morphism rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-xl font-bold text-white">
                Canonical Scene Sync (Cloud Native)
              </h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Design a room on your laptop via Next.js 16 WebGL, step out to your construction site, open your phone browser, and see the exact same 3D spatial layout and budget in real time.
              </p>
            </div>
            <ul className="space-y-2.5 pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Single source of spatial truth</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Shared JSON scene schema</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>On-site contractor verification</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniqueValue;
