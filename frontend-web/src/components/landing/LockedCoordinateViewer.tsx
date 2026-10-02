"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Layers, SlidersHorizontal, Box, IndianRupee, ArrowDown } from "lucide-react";

interface LockedCoordinateViewerProps {
  selectedStyleId?: string;
  onStyleChange?: (styleId: string) => void;
}

interface StyleConfig {
  name: string;
  image: string;
  budget: string;
  wallTreatment: string;
  flooring: string;
  tags: string[];
}

const STYLE_REGISTRY: Record<string, StyleConfig> = {
  japandi: {
    name: "Japandi",
    image: "/styles/japandi.png",
    budget: "₹ 8,45,000 APPROVED",
    wallTreatment: "Vertical White-Oak Acoustic Slats",
    flooring: "Bleached Engineered Oak Parquet",
    tags: [
      "White-Oak Acoustic Wall [X: -2.1, Z: 0.0]",
      "Bouclé Modular Platform Sofa [X: 0.0, Z: 1.1]",
      "Paper Lantern Pendant [X: 0.0, Y: 2.8, Z: 0.5]",
    ],
  },
  scandinavian: {
    name: "Modern Scandinavian",
    image: "/styles/scandinavian.png",
    budget: "₹ 7,90,000 APPROVED",
    wallTreatment: "Chalk White Matte Wash + Ash Accents",
    flooring: "Light Scandinavian Ash Wood",
    tags: [
      "Blonde Birch Media Unit [X: 2.1, Z: 0.0]",
      "Heather Linen Sectional [X: 0.0, Z: 1.2]",
      "High-CRI 4000K Arc Lamp [X: 1.8, Z: 1.8]",
    ],
  },
  luxury: {
    name: "Modern Luxury",
    image: "/styles/luxury.png",
    budget: "₹ 14,80,000 APPROVED",
    wallTreatment: "Smoked Walnut Fluting + Brass Inlays",
    flooring: "Italian Statuario Marble Slabs",
    tags: [
      "Bookmatched Statuario Slabs [X: 0.0, Z: 0.0]",
      "Emerald Velvet Chesterfield [X: -0.8, Z: 1.2]",
      "Smoked Tiered Chandelier [X: 0.0, Y: 2.7, Z: 0.0]",
    ],
  },
  minimalist: {
    name: "Minimalist",
    image: "/styles/minimalist.png",
    budget: "₹ 7,20,000 APPROVED",
    wallTreatment: "Seamless Micro-Topping Cement Wash",
    flooring: "Polished Monolithic Concrete",
    tags: [
      "Monolithic Micro-Cement [X: 0.0, Z: 0.0]",
      "Floating Platform Bench [X: -0.5, Z: 1.0]",
      "Recessed Ceiling Channels [X: 0.0, Y: 3.0, Z: 0.0]",
    ],
  },
  industrial: {
    name: "Industrial",
    image: "/styles/industrial.png",
    budget: "₹ 9,25,000 APPROVED",
    wallTreatment: "Exposed Wirecut Red Brickwork",
    flooring: "Epoxy Warehouse Screed Floor",
    tags: [
      "Wirecut Red Brick Accent [X: 0.0, Z: -2.1]",
      "Cognac Saddle Leather Sofa [X: 0.0, Z: 1.1]",
      "Edison Filament Track [X: 0.0, Y: 2.9, Z: 0.0]",
    ],
  },
  contemporary: {
    name: "Contemporary",
    image: "/styles/contemporary.png",
    budget: "₹ 11,40,000 APPROVED",
    wallTreatment: "Fluted Curved Plaster in Desert Taupe",
    flooring: "Honed Roman Travertine Stone",
    tags: [
      "Fluted Desert Taupe Plaster [X: -2.0, Z: 0.0]",
      "Sculptural Curved Crescent [X: 0.0, Z: 1.0]",
      "Honed Roman Travertine Nest [X: 0.2, Z: 0.4]",
    ],
  },
};

export const LockedCoordinateViewer: React.FC<LockedCoordinateViewerProps> = ({
  selectedStyleId = "japandi",
  onStyleChange,
}) => {
  const [viewMode, setViewMode] = useState<"compare" | "bare" | "furnished">("compare");
  const [sliderPosition, setSliderPosition] = useState(50);

  // If user selected empty shell or an invalid id, default to japandi for furnished comparison
  const effectiveKey =
    selectedStyleId && selectedStyleId !== "empty" && STYLE_REGISTRY[selectedStyleId]
      ? selectedStyleId
      : "japandi";

  const currentStyleData = STYLE_REGISTRY[effectiveKey];

  return (
    <section id="locked-coordinates" className="py-24 px-6 lg:px-12 bg-[#05080c] border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>LOCKED-COORDINATE ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            From Plain Shell to Furnished Twin
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Every room starts with the plain bare shell. Our coordinate-locking engine pins walls, windows, and electrical drops in place, allowing you to test infinite furnished iterations with zero spatial distortion.
          </p>

          {/* Synchronized Style Indicator / Selector */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-mono text-slate-400">Locked Style Twin:</span>
              {Object.entries(STYLE_REGISTRY).map(([key, style]) => {
                const isActive = effectiveKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onStyleChange?.(key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 border-emerald-400 scale-105"
                        : "glass-morphism text-slate-300 hover:text-white border-white/10"
                    }`}
                  >
                    <span>{style.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode Switcher */}
            <div className="glass-morphism p-1 rounded-full flex items-center gap-1 border border-white/10 mt-2">
              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "compare"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Interactive Split Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bare")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "bare"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Plain Bare Shell</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("furnished")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "furnished"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Furnished Twin ({currentStyleData.name})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Stage */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-morphism rounded-3xl p-4 sm:p-6 border border-white/15 shadow-2xl relative">
            {viewMode === "compare" ? (
              /* Interactive Split Slider: Plain Bare Shell vs Selected Style */
              <div className="relative rounded-2xl overflow-hidden aspect-[3/2] select-none shadow-xl border border-white/10 group">
                {/* Background: Fully Furnished Style Room */}
                <img
                  src={currentStyleData.image}
                  alt={`${currentStyleData.name} Furnished Room`}
                  className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                />

                {/* Furnished Label */}
                <div className="absolute top-4 right-4 glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 z-10 shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✨ {currentStyleData.name.toUpperCase()} · LOCKED TWIN</span>
                </div>

                {/* Foreground: Plain Bare Shell (Clipped via Slider with pure CSS inset) */}
                <img
                  src="/styles/empty-room.png"
                  alt="Plain Bare Room Shell"
                  className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                />

                {/* Plain Shell Badge & Anchors (visible on the left side) */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <div className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-200 border border-white/20 w-fit flex items-center gap-1.5 shadow-lg">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📐 PLAIN BARE ROOM SHELL</span>
                  </div>

                  <div className="space-y-1.5 max-w-xs">
                    <div className="inline-block bg-slate-950/80 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                      X: 5.0m · Y: 3.0m · Z: 4.2m
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      Locked Structural Anchor Points
                    </div>
                  </div>
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-20 pointer-events-none shadow-[0_0_15px_rgba(52,211,153,0.9)]"
                  style={{ left: `${sliderPosition}%` }}
                />

                {/* Slider Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-2xl shadow-emerald-500/50 border border-white"
                  style={{ left: `${sliderPosition}%` }}
                >
                  ↔
                </div>

                {/* Invisible Range Input for Dragging */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  aria-label="Drag slider to compare plain bare shell with furnished twin"
                />

                {/* Floating Bottom Center Helper */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-morphism px-3.5 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/10 z-10 pointer-events-none">
                  ↔ Drag slider across room to see coordinate-locked transformation
                </div>
              </div>
            ) : viewMode === "bare" ? (
              /* Bare Plain Room View */
              <div className="relative rounded-2xl overflow-hidden aspect-[3/2] shadow-xl border border-white/10 group select-none">
                <img
                  src="/styles/empty-room.png"
                  alt="Plain Bare Room Shell"
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-200 border border-white/20 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      <span>STAGE 1: PLAIN BARE ROOM SHELL</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/30">
                      0 FURNITURE · 0 FINISHES
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-lg">
                    <div className="glass-morphism p-3 rounded-xl border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400">ROOM WIDTH</div>
                      <div className="text-sm font-bold text-white font-mono">5.00 Meters</div>
                    </div>
                    <div className="glass-morphism p-3 rounded-xl border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400">ROOM DEPTH</div>
                      <div className="text-sm font-bold text-white font-mono">4.20 Meters</div>
                    </div>
                    <div className="glass-morphism p-3 rounded-xl border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400">CEILING HT</div>
                      <div className="text-sm font-bold text-white font-mono">3.00 Meters</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Fully Furnished Room View */
              <div className="relative rounded-2xl overflow-hidden aspect-[3/2] shadow-xl border border-white/10 group select-none">
                <img
                  src={currentStyleData.image}
                  alt={`${currentStyleData.name} Fully Furnished Room`}
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>STAGE 2: LOCKED COORDINATE FURNISHED DIGITAL TWIN ({currentStyleData.name.toUpperCase()})</span>
                    </span>
                    <span className="text-xs font-mono text-white bg-emerald-600/90 px-3 py-1 rounded-full shadow-md font-bold">
                      {currentStyleData.budget}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStyleData.tags.map((tag, idx) => (
                      <div
                        key={idx}
                        className="glass-morphism px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-white flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Explanatory Caption */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Locked to <strong>{currentStyleData.name}</strong> design. Drag the center handle above to observe the coordinate lock in action.
                </span>
              </div>
              <div className="text-slate-300">
                Precision: ±2mm Architectural Tolerance
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LockedCoordinateViewer;
