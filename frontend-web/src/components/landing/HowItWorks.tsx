"use client";

import React from "react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Set Home & Budget",
      badge: "House · Floors · Budget",
      desc: "Specify your house type, floors, room count, and allocate your total target budget in Indian Rupees with strict or flexible guardrails.",
    },
    {
      num: "02",
      title: "Upload Floor Plan",
      badge: "CAD · PNG · PDF",
      desc: "Upload your architectural layout or room blueprints. HomeVerse automatically recognizes structural boundaries and dimensions.",
    },
    {
      num: "03",
      title: "AI Room Detection",
      badge: "4.8m × 6.2m Dimensions",
      desc: "Spatial vision isolates living rooms, bedrooms, and kitchens, extracting exact room square footage and door/window clearances.",
    },
    {
      num: "04",
      title: "Select Rooms & Style",
      badge: "6 Curated Aesthetics",
      desc: "Pick which rooms to redesign and select your aesthetic: Japandi, Modern, Scandinavian, Modern Luxury, Industrial, or Contemporary.",
    },
    {
      num: "05",
      title: "Live 3D CAD Twin",
      badge: "Real-time AI Copilot",
      desc: "Step into your interactive 3D space. Move furniture, calculate budget deltas on the fly, and inspect vendor purchase links.",
    },
  ];

  return (
    <section id="workflow" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>ZERO HALLUCINATIONS · TRUE SPATIAL PRECISION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            From House Creation to Live 3D Twin
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            A seamless architecture-grade pipeline that connects your real-world budget with precision 3D CAD modeling and generative AI.
          </p>
        </div>

        {/* 5-Step Visual Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 group-hover:scale-110 transition-transform">
                  {s.num}
                </div>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {s.desc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                {s.badge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
