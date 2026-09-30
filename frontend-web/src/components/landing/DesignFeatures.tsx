"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check, Palette, IndianRupee } from "lucide-react";

interface DesignFeaturesProps {
  isAuthenticated?: boolean;
}

export const DesignFeatures: React.FC<DesignFeaturesProps> = ({ isAuthenticated = false }) => {
  const router = useRouter();

  // All 6 styles portrayed on the EXACT SAME ROOM (Master Living Room with Balcony Door)
  const stylesOnSameRoom = [
    {
      id: "japandi",
      name: "Japandi",
      tagline: "Warm Oak · Organic Bouclé · Wabi-Sabi Lighting",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Warm vertical white-oak acoustic wall slates, low-profile oatmeal bouclé modular sofa, paper lantern pendant, and natural jute/tatami woven floor rug.",
      wallFinish: "Vertical White-Oak Slat Paneling + Limewash Plaster",
      floorFinish: "Bleached Engineered Oak Parquet (₹180/sq.ft)",
      keyFurniture: "Low-Slung 3-Seater Platform Bouclé Sofa",
      lightingMood: "Soft Warm Diffused 2700K Paper Lantern",
      budget: "₹8,45,000",
      palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e", "#78350f"],
      image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200",
    },
    {
      id: "scandinavian",
      name: "Modern Scandinavian",
      tagline: "Nordic Birch · Heather Linen · Crisp Light",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Chalk-white breathable mineral walls, blonde birch wood media console, heather gray linen sectional, geometric monochrome wool rug, and slim brass arc lamp.",
      wallFinish: "Chalk White Matte Wash + Ash Wood Accents",
      floorFinish: "Light Scandinavian Ash Wood (₹165/sq.ft)",
      keyFurniture: "Ergonomic Modular Linen Corner Sectional",
      lightingMood: "High CRI 4000K Natural Daylight Emulation",
      budget: "₹7,90,000",
      palette: ["#ffffff", "#f8fafc", "#e2e8f0", "#0284c7", "#10b981"],
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200",
    },
    {
      id: "luxury",
      name: "Modern Luxury",
      tagline: "Statuario Marble · Emerald Velvet · Smoked Glass & Gold",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Bookmatched Italian Statuario white & gold marble slab flooring, rich emerald velvet sofa with brushed brass plinth, dark smoked walnut fluting, and tiered crystal chandelier.",
      wallFinish: "Dark Smoked Walnut Fluting + Brushed Brass Inlays",
      floorFinish: "Italian Statuario Marble Slabs (₹450/sq.ft)",
      keyFurniture: "Custom Emerald Italian Velvet Chesterfield",
      lightingMood: "Layered Warm Cove LED + Smoked Chandelier (3000K)",
      budget: "₹14,80,000",
      palette: ["#090d16", "#1e1b4b", "#d97706", "#047857", "#fef08a"],
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200",
    },
    {
      id: "minimalist",
      name: "Minimalist",
      tagline: "Polished Concrete · Floating Silhouettes · Shadow Gaps",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Seamless micro-cement concrete floors with concealed skirting shadow gaps, floating modular platform couch, zero clutter, and recessed architectural ceiling channels.",
      wallFinish: "Seamless Micro-Topping Cement Wash",
      floorFinish: "Polished Monolithic Concrete (₹140/sq.ft)",
      keyFurniture: "Floating Low-Back Platform Bench Sofa",
      lightingMood: "Indirect Architectural Ceiling Glow Only",
      budget: "₹7,20,000",
      palette: ["#f1f5f9", "#cbd5e1", "#475569", "#1e293b", "#0f172a"],
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
    },
    {
      id: "industrial",
      name: "Industrial",
      tagline: "Heritage Brick · Cognac Leather · Matte Black Iron",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Exposed rustic red terracotta brick accent wall, matte black steel warehouse track lighting, distressed cognac saddle leather sofa, and reclaimed solid teak coffee table.",
      wallFinish: "Exposed Wirecut Red Brickwork + Charcoal Mortar",
      floorFinish: "Epoxy Warehouse Screed Floor (₹125/sq.ft)",
      keyFurniture: "Cognac Saddle Leather Deep-Seat Sofa",
      lightingMood: "Edison Filament Pendants + Black Iron Tracks (2200K)",
      budget: "₹9,25,000",
      palette: ["#18181b", "#27272a", "#ea580c", "#451a03", "#71717a"],
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200",
    },
    {
      id: "contemporary",
      name: "Contemporary",
      tagline: "Curved Sculptural Forms · Honed Travertine · Warm Taupe",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Sculpted curved ivory bouclé sofa, fluted warm plaster feature wall, honed roman travertine nesting coffee tables, champagne bronze fixtures, and plush textured boucle rug.",
      wallFinish: "Fluted Curved Plaster in Desert Taupe",
      floorFinish: "Honed Roman Travertine Stone (₹280/sq.ft)",
      keyFurniture: "Asymmetric Curved Sculptural Crescent Sofa",
      lightingMood: "Soft Organic Rim Lighting + Curved Wall Sconces",
      budget: "₹11,40,000",
      palette: ["#f1f5f9", "#e2e8f0", "#6366f1", "#475569", "#d97706"],
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
    },
  ];

  const [selectedStyleId, setSelectedStyleId] = useState("japandi");
  const currentStyle = stylesOnSameRoom.find((s) => s.id === selectedStyleId) || stylesOnSameRoom[0];

  return (
    <section id="compare-styles" className="py-24 px-6 lg:px-12 bg-[#070b10] border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>SAME ROOM · 6 ARCHITECTURAL STYLES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            One Room. Infinite Expressions. Locked Budget.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Notice how the room layout, window positions, and structural walls remain exactly identical. Only materials, furniture silhouettes, lighting, and contractor rates shift.
          </p>
        </div>

        {/* 6-Style Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {stylesOnSameRoom.map((style) => {
            const isSelected = selectedStyleId === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyleId(style.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 border-emerald-400 scale-105"
                    : "glass-morphism text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/10"
                }`}
              >
                <span>{style.name}</span>
                {isSelected && <Sparkles className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Main Stage: The Same Room Portrayed In Selected Style */}
        <div className="max-w-6xl mx-auto">
          <div className="glass-morphism rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Image of the Room */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-white/10 shadow-xl group">
              <img
                src={currentStyle.image}
                alt={`${currentStyle.name} Style in Living Room`}
                className="w-full h-full object-cover filter brightness-[0.92] contrast-105 transition-all duration-700 group-hover:scale-105"
              />

              {/* Floating Same Room Badge */}
              <div className="absolute top-4 left-4 glass-morphism px-3.5 py-1.5 rounded-full text-[10px] font-mono text-white flex items-center gap-2 border border-white/20 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LOCKED SHELL: 5.0m × 4.2m LIVING ROOM</span>
              </div>

              {/* Floating Budget Badge */}
              <div className="absolute bottom-4 right-4 glass-morphism px-4 py-2 rounded-2xl text-xs font-mono text-emerald-400 flex items-center gap-2 border border-emerald-500/30 shadow-xl">
                <IndianRupee className="w-4 h-4" />
                <span className="font-bold text-white text-sm">{currentStyle.budget}</span>
                <span className="text-[10px] text-slate-400">Total Room Est.</span>
              </div>
            </div>

            {/* Architectural Spec Sheet for This Exact Style */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">
                  {currentStyle.name} Profile
                </div>
                <h3 className="text-2xl font-bold text-white font-editorial">
                  {currentStyle.tagline}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                {currentStyle.desc}
              </p>

              {/* Material Breakdown */}
              <div className="space-y-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Wall Surface Treatment</div>
                  <div className="text-white font-medium">{currentStyle.wallFinish}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Flooring Specification</div>
                  <div className="text-white font-medium">{currentStyle.floorFinish}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Key Silhouette</div>
                  <div className="text-white font-medium">{currentStyle.keyFurniture}</div>
                </div>
              </div>

              {/* Swatch Palette */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Color DNA:</span>
                <div className="flex items-center gap-1.5">
                  {currentStyle.palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
                  className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span>Apply {currentStyle.name} to My Home →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesignFeatures;
