"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Palette, IndianRupee, Box, Eye, SlidersHorizontal, ArrowRight, ArrowDown, X } from "lucide-react";

interface DesignFeaturesProps {
  isAuthenticated?: boolean;
  selectedStyleId?: string;
  onSelectStyle?: (styleId: string) => void;
}

interface StyleProfile {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  roomSpecification: string;
  desc: string;
  wallFinish: string;
  floorFinish: string;
  keyFurniture: string;
  lightingMood: string;
  budget: string;
  palette: string[];
  image: string;
  isStartingShell?: boolean;
}

export const DesignFeatures: React.FC<DesignFeaturesProps> = ({
  isAuthenticated = false,
  selectedStyleId: externalSelectedStyleId,
  onSelectStyle,
}) => {
  const router = useRouter();

  // Starting bare room shell + 6 architectural styles portrayed on the EXACT SAME ROOM
  const stylesOnSameRoom: StyleProfile[] = [
    {
      id: "empty",
      name: "Empty Room (Starting Shell)",
      shortName: "Empty Room",
      tagline: "Raw Unfurnished Shell · Natural Daylight · 5.0m × 4.2m",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "The bare architectural shell with raw plaster walls, clean subflooring, and expansive floor-to-ceiling balcony door. Choose between the available architectural styles below to see HomeVerse spatial AI transform this exact space with curated materials, furnishings, and locked contractor budgets.",
      wallFinish: "Base Smooth Primer Plaster (Unfinished)",
      floorFinish: "Bare Concrete Screed Subfloor",
      keyFurniture: "Unfurnished Shell (Awaiting Spatial AI Generation)",
      lightingMood: "Unmodified Natural Daylight from Balcony",
      budget: "₹0 Base Shell",
      palette: ["#f1f5f9", "#cbd5e1", "#94a3b8", "#64748b", "#334155"],
      image: "/styles/empty-room.png",
      isStartingShell: true,
    },
    {
      id: "japandi",
      name: "Japandi",
      shortName: "Japandi",
      tagline: "Warm Oak · Organic Bouclé · Wabi-Sabi Lighting",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Warm vertical white-oak acoustic wall slats, low-profile oatmeal bouclé modular sofa, paper lantern pendant, and natural jute/tatami woven floor rug.",
      wallFinish: "Vertical White-Oak Slat Paneling + Limewash Plaster",
      floorFinish: "Bleached Engineered Oak Parquet (₹180/sq.ft)",
      keyFurniture: "Low-Slung 3-Seater Platform Bouclé Sofa",
      lightingMood: "Soft Warm Diffused 2700K Paper Lantern",
      budget: "₹8,45,000",
      palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e", "#78350f"],
      image: "/styles/japandi.png",
    },
    {
      id: "scandinavian",
      name: "Modern Scandinavian",
      shortName: "Scandinavian",
      tagline: "Nordic Birch · Heather Linen · Crisp Light",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Chalk-white breathable mineral walls, blonde birch wood media console, heather gray linen sectional, geometric monochrome wool rug, and slim brass arc lamp.",
      wallFinish: "Chalk White Matte Wash + Ash Wood Accents",
      floorFinish: "Light Scandinavian Ash Wood (₹165/sq.ft)",
      keyFurniture: "Ergonomic Modular Linen Corner Sectional",
      lightingMood: "High CRI 4000K Natural Daylight Emulation",
      budget: "₹7,90,000",
      palette: ["#ffffff", "#f8fafc", "#e2e8f0", "#0284c7", "#10b981"],
      image: "/styles/scandinavian.png",
    },
    {
      id: "luxury",
      name: "Modern Luxury",
      shortName: "Luxury",
      tagline: "Statuario Marble · Emerald Velvet · Smoked Glass & Gold",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Bookmatched Italian Statuario white & gold marble slab flooring, rich emerald velvet sofa with brushed brass plinth, dark smoked walnut fluting, and tiered crystal chandelier.",
      wallFinish: "Dark Smoked Walnut Fluting + Brushed Brass Inlays",
      floorFinish: "Italian Statuario Marble Slabs (₹450/sq.ft)",
      keyFurniture: "Custom Emerald Italian Velvet Chesterfield",
      lightingMood: "Layered Warm Cove LED + Smoked Chandelier (3000K)",
      budget: "₹14,80,000",
      palette: ["#090d16", "#1e1b4b", "#d97706", "#047857", "#fef08a"],
      image: "/styles/luxury.png",
    },
    {
      id: "minimalist",
      name: "Minimalist",
      shortName: "Minimalist",
      tagline: "Polished Concrete · Floating Silhouettes · Shadow Gaps",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Seamless micro-cement concrete floors with concealed skirting shadow gaps, floating modular platform couch, zero clutter, and recessed architectural ceiling channels.",
      wallFinish: "Seamless Micro-Topping Cement Wash",
      floorFinish: "Polished Monolithic Concrete (₹140/sq.ft)",
      keyFurniture: "Floating Low-Back Platform Bench Sofa",
      lightingMood: "Indirect Architectural Ceiling Glow Only",
      budget: "₹7,20,000",
      palette: ["#f1f5f9", "#cbd5e1", "#475569", "#1e293b", "#0f172a"],
      image: "/styles/minimalist.png",
    },
    {
      id: "industrial",
      name: "Industrial",
      shortName: "Industrial",
      tagline: "Heritage Brick · Cognac Leather · Matte Black Iron",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Exposed rustic red terracotta brick accent wall, matte black steel warehouse track lighting, distressed cognac saddle leather sofa, and reclaimed solid teak coffee table.",
      wallFinish: "Exposed Wirecut Red Brickwork + Charcoal Mortar",
      floorFinish: "Epoxy Warehouse Screed Floor (₹125/sq.ft)",
      keyFurniture: "Cognac Saddle Leather Deep-Seat Sofa",
      lightingMood: "Edison Filament Pendants + Black Iron Tracks (2200K)",
      budget: "₹9,25,000",
      palette: ["#18181b", "#27272a", "#ea580c", "#451a03", "#71717a"],
      image: "/styles/industrial.png",
    },
    {
      id: "contemporary",
      name: "Contemporary",
      shortName: "Contemporary",
      tagline: "Curved Sculptural Forms · Honed Travertine · Warm Taupe",
      roomSpecification: "Same 5.0m × 4.2m Living Room with Floor-to-Ceiling Balcony Door",
      desc: "Sculpted curved ivory bouclé sofa, fluted warm plaster feature wall, honed roman travertine nesting coffee tables, champagne bronze fixtures, and plush textured boucle rug.",
      wallFinish: "Fluted Curved Plaster in Desert Taupe",
      floorFinish: "Honed Roman Travertine Stone (₹280/sq.ft)",
      keyFurniture: "Asymmetric Curved Sculptural Crescent Sofa",
      lightingMood: "Soft Organic Rim Lighting + Curved Wall Sconces",
      budget: "₹11,40,000",
      palette: ["#f1f5f9", "#e2e8f0", "#6366f1", "#475569", "#d97706"],
      image: "/styles/contemporary.png",
    },
  ];

  // Internal state with support for controlled prop
  const [internalSelectedStyleId, setInternalSelectedStyleId] = useState<string>("empty");
  const selectedStyleId = externalSelectedStyleId ?? internalSelectedStyleId;

  const [compareMode, setCompareMode] = useState<"full" | "split">("full");
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Auto-scroll countdown state after style selection
  const [autoScrollNotice, setAutoScrollNotice] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStyle = stylesOnSameRoom.find((s) => s.id === selectedStyleId) || stylesOnSameRoom[0];
  const isViewingEmptyShell = selectedStyleId === "empty";

  // Cleanup scroll timer on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectStyle = (styleId: string) => {
    setInternalSelectedStyleId(styleId);
    onSelectStyle?.(styleId);

    // Clear any previous scroll timer
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    if (styleId === "empty") {
      setCompareMode("full");
      setAutoScrollNotice(null);
      return;
    }

    // Automatically after 2 sec moves from style to Locked-Coordinate Architecture
    const chosen = stylesOnSameRoom.find((s) => s.id === styleId);
    setAutoScrollNotice(`Selected ${chosen?.name || styleId} · Moving to Locked-Coordinate Slider in 2s...`);

    scrollTimeoutRef.current = setTimeout(() => {
      setAutoScrollNotice(null);
      const target = document.getElementById("locked-coordinates");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 2000);
  };

  const cancelAutoScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setAutoScrollNotice(null);
  };

  const jumpToLockedCoordinatesNow = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setAutoScrollNotice(null);
    const target = document.getElementById("locked-coordinates");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="compare-styles" className="py-24 px-6 lg:px-12 bg-[#070b10] border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>STARTING SHELL · ARCHITECTURAL STYLES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            One Room. Infinite Expressions. Locked Budget.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Start with the raw empty room shell. Select between the available architectural styles to see how materials, furniture silhouettes, lighting, and contractor rates transform the exact same space.
          </p>
        </div>

        {/* Style Selector Buttons - Starting with Empty Room */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {stylesOnSameRoom.map((style) => {
            const isSelected = selectedStyleId === style.id;
            const isStarting = style.isStartingShell;
            return (
              <button
                key={style.id}
                onClick={() => handleSelectStyle(style.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 border-emerald-400 scale-105"
                    : isStarting
                    ? "glass-morphism text-emerald-300 hover:text-white hover:bg-emerald-500/10 border-emerald-500/40"
                    : "glass-morphism text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/10"
                }`}
              >
                {isStarting ? <Box className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
                <span>{style.name}</span>
                {isSelected && <Sparkles className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* 2-Second Auto-Scroll Notification Banner */}
        {autoScrollNotice && (
          <div className="max-w-xl mx-auto -mt-6 animate-fadeIn">
            <div className="glass-morphism border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-200 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{autoScrollNotice}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={jumpToLockedCoordinatesNow}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Go Now</span>
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={cancelAutoScroll}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Stay here"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Stage: The Room Portrayed In Selected Style */}
        <div className="max-w-6xl mx-auto">
          <div className="glass-morphism rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Image of the Room */}
            <div className="lg:col-span-7 space-y-3">
              {/* Top View Mode Switcher when an architectural style is active */}
              {!isViewingEmptyShell && (
                <div className="flex items-center justify-between px-1">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active Style: <strong className="text-white">{currentStyle.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setCompareMode("full")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        compareMode === "full"
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Full View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareMode("split")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        compareMode === "split"
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Compare Split</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="relative rounded-2xl overflow-hidden aspect-[3/2] bg-slate-950 border border-white/10 shadow-xl group select-none">
                {compareMode === "split" && !isViewingEmptyShell ? (
                  /* Interactive Split Comparison Slider: Empty Room vs Selected Style */
                  <div className="relative w-full h-full">
                    {/* Underlying image: Selected Style */}
                    <img
                      src={currentStyle.image}
                      alt={`${currentStyle.name} Style in Living Room`}
                      className="absolute inset-0 w-full h-full object-cover filter brightness-[0.95]"
                    />

                    {/* Right Style Badge */}
                    <div className="absolute top-4 right-4 glass-morphism px-3 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 z-10 shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{currentStyle.name.toUpperCase()}</span>
                    </div>

                    {/* Top image: Starting Empty Room (Clipped with pure CSS inset) */}
                    <img
                      src="/styles/empty-room.png"
                      alt="Starting Empty Room"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    />

                    {/* Left Empty Room Badge */}
                    <div className="absolute top-4 left-4 glass-morphism px-3 py-1 rounded-full text-[10px] font-mono text-slate-200 border border-white/20 z-10 shadow-lg flex items-center gap-1.5">
                      <Box className="w-3 h-3 text-emerald-400" />
                      <span>EMPTY ROOM (STARTING)</span>
                    </div>

                    {/* Vertical Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-20 pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                      style={{ left: `${sliderPos}%` }}
                    />

                    {/* Slider Knob */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 border border-white"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </div>

                    {/* Range input for smooth drag on mouse and touch */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliderPos}
                      onChange={(e) => setSliderPos(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      aria-label="Compare Empty Room with selected style"
                    />

                    {/* Bottom floating helper */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-morphism px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/10 z-10 pointer-events-none">
                      ↔ Drag slider to reveal transformation
                    </div>
                  </div>
                ) : (
                  /* Full View Mode */
                  <>
                    <img
                      src={currentStyle.image}
                      alt={`${currentStyle.name} in Living Room`}
                      className="w-full h-full object-cover filter brightness-[0.95] contrast-105 transition-all duration-500 group-hover:scale-[1.02]"
                    />

                    {/* Floating Shell Badge */}
                    <div className="absolute top-4 left-4 glass-morphism px-3.5 py-1.5 rounded-full text-[10px] font-mono text-white flex items-center gap-2 border border-white/20 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        {isViewingEmptyShell
                          ? "STARTING CANVAS: 5.0m × 4.2m EMPTY ROOM"
                          : "LOCKED SHELL: 5.0m × 4.2m LIVING ROOM"}
                      </span>
                    </div>

                    {/* Floating Budget Badge */}
                    <div className="absolute bottom-4 right-4 glass-morphism px-4 py-2 rounded-2xl text-xs font-mono text-emerald-400 flex items-center gap-2 border border-emerald-500/30 shadow-xl">
                      {!isViewingEmptyShell && <IndianRupee className="w-4 h-4" />}
                      <span className="font-bold text-white text-sm">{currentStyle.budget}</span>
                      <span className="text-[10px] text-slate-400">
                        {isViewingEmptyShell ? "Canvas" : "Total Room Est."}
                      </span>
                    </div>

                    {/* Quick Split View trigger when viewing a style */}
                    {!isViewingEmptyShell && (
                      <button
                        type="button"
                        onClick={() => setCompareMode("split")}
                        className="absolute bottom-4 left-4 glass-morphism px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 border border-white/15 shadow-lg transition-all hover:bg-white/10 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                        <span>Compare with Empty Shell</span>
                      </button>
                    )}

                    {/* Empty Room Hint when on empty room */}
                    {isViewingEmptyShell && (
                      <div className="absolute bottom-4 left-4 glass-morphism px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        <span>Select any style above to furnish this room</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Architectural Spec Sheet for This Exact Style / Shell */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  {isViewingEmptyShell ? <Box className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
                  <span>{currentStyle.name} Profile</span>
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

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Lighting Environment</div>
                  <div className="text-white font-medium">{currentStyle.lightingMood}</div>
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

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
                  className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {isViewingEmptyShell ? (
                    <>
                      <span>Start Designing from Empty Room →</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Apply {currentStyle.name} to My Home →</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
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
