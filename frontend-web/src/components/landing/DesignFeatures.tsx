"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface DesignFeaturesProps {
  isAuthenticated: boolean;
}

export const DesignFeatures: React.FC<DesignFeaturesProps> = ({ isAuthenticated }) => {
  const router = useRouter();

  const designDnaList = [
    {
      id: "japandi",
      name: "Japandi",
      tagline: "Warm · Natural · Calm",
      desc: "A timeless fusion of Scandinavian functionality and Japanese wabi-sabi minimalism. Low-profile platform oak furniture, organic linen textiles, and diffused lighting.",
      palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e", "#78350f"],
      materials: ["Bleached White Oak", "Natural Raw Linen", "Washi Paper Shade", "Smooth Limestone"],
      image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800",
      budgetTier: "₹8.4L - ₹10.2L",
    },
    {
      id: "modern",
      name: "Modern",
      tagline: "Clean · Minimal · Structured",
      desc: "Architectural purity characterized by sleek geometric profiles, concealed storage, dark walnut wood paneling, and matte black metal accents.",
      palette: ["#0f172a", "#1e293b", "#334155", "#0d9488", "#cbd5e1"],
      materials: ["Dark Smoked Walnut", "Matte Black Steel", "Smoked Grey Glass", "Seamless Concrete"],
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
      budgetTier: "₹8.8L - ₹11.0L",
    },
    {
      id: "scandinavian",
      name: "Scandinavian",
      tagline: "Bright · Functional · Airy",
      desc: "Maximized natural day-lighting with blonde birch furniture, high-contrast hardware, plush hygge wool rugs, and ergonomic modular arrangements.",
      palette: ["#ffffff", "#f8fafc", "#e2e8f0", "#0284c7", "#10b981"],
      materials: ["Nordic Light Birch", "Bouclé Wool Fabric", "Powder White Metal", "Fluted Glass Panels"],
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
      budgetTier: "₹7.9L - ₹9.8L",
    },
    {
      id: "luxury",
      name: "Modern Luxury",
      tagline: "Elegant · Refined · Premium",
      desc: "High-end bespoke craftsmanship featuring bookmatched Calacatta Gold marble, brushed gold brass trims, and emerald velvet upholstery.",
      palette: ["#090d16", "#1e1b4b", "#d97706", "#047857", "#fef08a"],
      materials: ["Calacatta Gold Marble", "Brushed Brass Trims", "Emerald Italian Velvet", "High-Gloss Veneer"],
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
      budgetTier: "₹14.2L - ₹22.5L",
    },
    {
      id: "industrial",
      name: "Industrial",
      tagline: "Raw · Bold · Urban",
      desc: "Uncovered structural character with exposed red brickwork, polished warehouse concrete floors, antique cognac leather seating, and black steel framing.",
      palette: ["#18181b", "#27272a", "#ea580c", "#451a03", "#71717a"],
      materials: ["Exposed Heritage Brick", "Cognac Saddle Leather", "Reclaimed Barn Wood", "Black Cast Iron"],
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800",
      budgetTier: "₹9.1L - ₹11.8L",
    },
    {
      id: "contemporary",
      name: "Contemporary",
      tagline: "Fluid · Curvaceous · Fresh",
      desc: "Embraces trend-forward architectural movements: sculpted organic sofa curves, warm taupe palettes, and layered tactile textures.",
      palette: ["#f1f5f9", "#e2e8f0", "#6366f1", "#475569", "#d97706"],
      materials: ["Curved Bouclé Fleece", "Honed Travertine Stone", "Champagne Bronze", "Ribbed Walnut"],
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
      budgetTier: "₹10.5L - ₹13.4L",
    },
  ];

  const [activeDnaStyle, setActiveDnaStyle] = useState("Japandi");
  const currentDna = designDnaList.find((s) => s.name === activeDnaStyle) || designDnaList[0];

  return (
    <section id="design-dna" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c]">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span>CURATED INTERIOR DESIGN DNA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Cohesive architectural style profiles.
            </h2>
            <p className="text-slate-400 text-sm font-light">
              Explore our six core interior aesthetic models. Each DNA profile comes with curated PBR materials, color palettes, lighting rules, and budget metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {designDnaList.map((dna) => (
              <button
                key={dna.id}
                onClick={() => setActiveDnaStyle(dna.name)}
                className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 rounded-full transition-all cursor-pointer ${
                  activeDnaStyle === dna.name
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {dna.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active DNA Detail Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-10 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl">
          <div className="lg:col-span-6 relative overflow-hidden rounded-2xl border border-white/[0.08] group h-[380px]">
            <img
              src={currentDna.image}
              alt={currentDna.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">{currentDna.tagline}</div>
                <h3 className="text-2xl font-bold text-white mt-0.5">{currentDna.name} Space</h3>
              </div>
              <div className="text-xs font-mono bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-slate-200">
                Est. {currentDna.budgetTier}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{currentDna.tagline}</div>
              <h3 className="text-3xl font-bold text-white mt-1">{currentDna.name} Design System</h3>
              <p className="text-slate-300 text-sm font-light leading-relaxed mt-2">
                {currentDna.desc}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Color Palette DNA</div>
              <div className="flex items-center gap-3">
                {currentDna.palette.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-10 h-10 rounded-xl border border-white/20 shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] font-mono text-slate-400">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Curated PBR Finishes</div>
              <div className="grid grid-cols-2 gap-2">
                {currentDna.materials.map((mat, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{mat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => router.push(isAuthenticated ? "/home/new" : "/login")}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>Launch in 3D Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesignFeatures;
