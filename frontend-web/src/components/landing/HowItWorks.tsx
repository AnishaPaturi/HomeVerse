"use client";

import React from "react";
import { 
  Building2, 
  UploadCloud, 
  Scan, 
  Palette, 
  Box, 
  FileSpreadsheet, 
  ArrowRight, 
  Sparkles 
} from "lucide-react";

export const HowItWorks: React.FC = () => {
  const flowSteps = [
    {
      num: "01",
      icon: Building2,
      title: "Set House & Budget",
      badge: "STEP 1 · FINANCIAL BOUNDS",
      desc: "Specify your house type (Apartment, Duplex, Villa), number of floors, and lock your total target budget in ₹ Lakhs or Crores with Strict (±0%) or Moderate guardrails.",
    },
    {
      num: "02",
      icon: UploadCloud,
      title: "Upload Floor Plan",
      badge: "STEP 2 · BLUEPRINT INGESTION",
      desc: "Drop in your architect's PDF, CAD vector drawing, brochure JPEG, or even a smartphone snapshot of a hand-drawn pencil layout on paper.",
    },
    {
      num: "03",
      icon: Scan,
      title: "AI Vision Scan",
      badge: "STEP 3 · DIMENSION EXTRACTION",
      desc: "Gemini multimodal vision isolates living room, bedrooms, and kitchen boundaries, calculates exact room square meters, and checks window/door swing clearances.",
    },
    {
      num: "04",
      icon: Palette,
      title: "Select Design Style",
      badge: "STEP 4 · 6-STYLE SIMULATION",
      desc: "Preview Japandi, Scandinavian, Modern Luxury, Minimalist, Industrial, or Contemporary on the exact same room with real-world material rate cards.",
    },
    {
      num: "05",
      icon: Box,
      title: "Interactive 3D Walk",
      badge: "STEP 5 · BROWSER 3D STUDIO",
      desc: "Step inside your photorealistic 3D room. Move furniture, tweak finishes, and stroll room-by-room in first-person mode with zero software installation.",
    },
    {
      num: "06",
      icon: FileSpreadsheet,
      title: "Contractor BOM Export",
      badge: "STEP 6 · TENDER PROCUREMENT",
      desc: "Export an itemized Bill of Materials with civil, modular millwork, and lighting rates mapped to verified Indian manufacturers ready to hand to your contractor.",
    },
  ];

  return (
    <section id="workflow" className="py-24 px-6 lg:px-12 border-t border-white/[0.08] bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>THE COMPLETE ARCHITECTURAL JOURNEY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            How HomeVerse Transforms Idea to Reality
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            A seamless, guided 6-stage flow connecting your budget, 2D blueprint, 3D digital twin, and contractor execution with zero guesswork.
          </p>
        </div>

        {/* 6-Step Visual Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {flowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="glass-morphism rounded-3xl p-7 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-2xl font-bold text-slate-600 group-hover:text-emerald-400/60 transition-colors">
                      {step.num}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
                      {step.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors font-editorial">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Stage {idx + 1} of 6</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>Progress</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
