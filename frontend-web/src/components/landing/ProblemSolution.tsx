"use client";

import React from "react";
import { AlertTriangle, CheckCircle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

export const ProblemSolution: React.FC = () => {
  const comparisons = [
    {
      problemTitle: "30%–50% Budget Overruns",
      problemDesc:
        "Traditional interior contractors offer vague estimates, leading to unexpected material escalations, hidden electrical/civil markups, and drained reserves.",
      solutionTitle: "Strict Indian ₹ Budget Envelopes",
      solutionDesc:
        "Establish your ₹ Lakhs or Crores limit upfront. HomeVerse dynamically apportions costs per room and trade category with strict (±0%) or moderate guardrails.",
    },
    {
      problemTitle: "Flat 2D Blueprint Confusion",
      problemDesc:
        "Homeowners struggle to comprehend 2D CAD drawings, making costly design mistakes on door swings, walkway clearances, and ceiling lighting heights.",
      solutionTitle: "True-to-Scale 3D Digital Twin",
      solutionDesc:
        "Instantly explore your room in a millimeter-precise Three.js WebGL canvas. Walk through the space in first-person and verify physical human ergonomics.",
    },
    {
      problemTitle: "Weeks Waiting for Static Renders",
      problemDesc:
        "Standard design studios take 3 to 6 weeks to render 2 or 3 static JPEG images that cannot be tweaked without starting over and paying revision fees.",
      solutionTitle: "Real-time AI Spatial Reconfiguration",
      solutionDesc:
        "Switch between Japandi, Modern, Scandinavian, or Luxury in 1 click. Swap Italian marble for vitrified tile and watch your budget update immediately.",
    },
    {
      problemTitle: "Unobtainable Catalog Items",
      problemDesc:
        "Pinterest moodboards and generic AI images depict custom furniture that is impossible to source or manufacture in local Indian cities.",
      solutionTitle: "Direct Indian Vendor Procurement",
      solutionDesc:
        "Every single 3D object links to real Indian market vendors, accurate per-sq-ft rates for ply/laminate/acrylic, and an exportable contractor Bill of Materials.",
    },
  ];

  return (
    <section id="problem-solution" className="py-24 px-6 lg:px-12 bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>THE RENOVATION PARADOX</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Why 84% of Home Renovations Suffer Budget Disasters
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            The traditional interior design model separates design visualization from financial reality. HomeVerse fuses them into a single spatial operating system.
          </p>
        </div>

        {/* 4-Card Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {comparisons.map((c, idx) => (
            <div
              key={idx}
              className="glass-morphism rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Problem Block */}
              <div className="space-y-2.5 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold tracking-wide">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>TRADITIONAL RENOVATION TRAP</span>
                </div>
                <h3 className="text-lg font-bold text-slate-200">
                  {c.problemTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                  {c.problemDesc}
                </p>
              </div>

              {/* Solution Block */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold tracking-wide">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>THE HOMEVERSE SOLUTION</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{c.solutionTitle}</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline" />
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                  {c.solutionDesc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
