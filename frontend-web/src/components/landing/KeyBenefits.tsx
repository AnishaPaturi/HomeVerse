"use client";

import React from "react";
import { 
  BadgePercent, 
  Layers, 
  Scan, 
  Calculator, 
  Box, 
  FileSpreadsheet,
  ArrowUpRight 
} from "lucide-react";

export const KeyBenefits: React.FC = () => {
  const benefits = [
    {
      icon: BadgePercent,
      title: "Budget-First Design Engine",
      tag: "FINANCIAL GOVERNANCE",
      desc: "Set your target budget in ₹ Lakhs or Crores. The engine dynamically sets maximum allowance per room and trade category, ensuring zero overspending.",
      highlight: "Strict (±0%), Moderate (±10%), or Flexible (±25%) options",
    },
    {
      icon: Scan,
      title: "AI Blueprint & Dimension Vision",
      tag: "GEMINI MULTIMODAL AI",
      desc: "Upload hand-drawn sketches, architect blueprints, or CAD PDFs. Gemini vision isolates walls, door clearances, and exact metric dimensions in seconds.",
      highlight: "Vector ingestion & sub-millimeter precision",
    },
    {
      icon: Box,
      title: "Interactive 3D WebGL Digital Twin",
      tag: "THREE.JS SPATIAL CAD",
      desc: "Full browser-based 3D studio with transform gizmos, custom PBR textures, daylight simulation, and collision-checked furniture placement.",
      highlight: "No desktop software or GPU installation needed",
    },
    {
      icon: Calculator,
      title: "Instant 'What-If?' Delta Simulator",
      tag: "REAL-TIME IMPACT ANALYSIS",
      desc: "Experiment with trade-offs in real time: 'Upgrade living room to Italian Botticino Marble' or 'Cut ₹1.5 Lakhs from guest bedroom'.",
      highlight: "Instant reallocation across all other rooms",
    },
    {
      icon: Layers,
      title: "Multi-Floor House Architecture",
      tag: "FULL RESIDENCE TWIN",
      desc: "Model single-floor apartments, duplexes, or 4-story luxury villas with dedicated floor-by-floor navigation and house-wide structural coherence.",
      highlight: "Duplex, Villa, Independent & Penthouse presets",
    },
    {
      icon: FileSpreadsheet,
      title: "Turnkey Contractor BOM & Procurement",
      tag: "INDIAN VENDOR CATALOGUE",
      desc: "Generate an itemized Bill of Materials with civil, electrical, modular cabinetry, and loose furniture costs ready to hand straight to your contractor.",
      highlight: "Exportable to CSV, Excel, and architectural PDF",
    },
  ];

  return (
    <section id="key-benefits" className="py-24 px-6 lg:px-12 bg-[#070b10] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>CORE ARCHITECTURAL PILLARS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Everything You Need To Build With Certainty
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            HomeVerse replaces fractured sketches, spreadsheets, and guesswork with a single spatial and financial truth.
          </p>
        </div>

        {/* 6-Card Glass Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="glass-morphism rounded-3xl p-7 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
                      {b.tag}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {b.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                    {b.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{b.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;
