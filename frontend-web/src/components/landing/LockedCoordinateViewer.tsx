"use client";

import React, { useState } from "react";
import { Sparkles, Maximize2, Move, Box, CheckCircle2, IndianRupee, Layers } from "lucide-react";

export const LockedCoordinateViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<"compare" | "bare" | "furnished">("compare");
  const [sliderPosition, setSliderPosition] = useState(50);

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
            Every room starts with a bare architectural shell. Our coordinate-locking engine pins walls, windows, and electrical drops in place, allowing you to test infinite furnished iterations with zero spatial distortion.
          </p>

          {/* Mode Switcher */}
          <div className="pt-2 flex items-center justify-center">
            <div className="glass-morphism p-1 rounded-full flex items-center gap-1 border border-white/10">
              <button
                onClick={() => setViewMode("compare")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  viewMode === "compare"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Interactive Split Slider
              </button>
              <button
                onClick={() => setViewMode("bare")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  viewMode === "bare"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Plain Bare Shell (CAD)
              </button>
              <button
                onClick={() => setViewMode("furnished")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  viewMode === "furnished"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Fully Furnished Twin
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Stage */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-morphism rounded-3xl p-4 sm:p-6 border border-white/15 shadow-2xl relative">
            {viewMode === "compare" ? (
              /* Interactive Split Slider */
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] select-none shadow-xl border border-white/10">
                {/* Background: Fully Furnished Room */}
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400"
                  alt="Fully Furnished Room"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-95"
                />

                {/* Furnished Label */}
                <div className="absolute top-4 right-4 glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 z-10 shadow-lg">
                  ✨ FULLY FURNISHED & BUDGETED
                </div>

                {/* Foreground: Plain Bare Room (Clipped via Slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400"
                    alt="Plain Bare Room Shell"
                    className="absolute inset-0 w-[100vw] max-w-none h-full object-cover filter grayscale contrast-125 brightness-90"
                    style={{ width: "100%", height: "100%" }}
                  />

                  {/* Plain Shell Callouts */}
                  <div className="absolute inset-0 bg-black/30 pointer-events-none p-6 flex flex-col justify-between">
                    <div className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-300 border border-white/20 w-fit">
                      📐 PLAIN BARE ROOM SHELL
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
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-2xl shadow-emerald-500/50">
                    ↔
                  </div>
                </div>

                {/* Invisible Range Input for Dragging */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                />
              </div>
            ) : viewMode === "bare" ? (
              /* Bare Plane Room View */
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] shadow-xl border border-white/10 group">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400"
                  alt="Plain Bare Room Shell"
                  className="w-full h-full object-cover filter grayscale contrast-125 brightness-90"
                />
                <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-200 border border-white/20">
                      STAGE 1: PLANE BARE ROOM SHELL
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
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] shadow-xl border border-white/10 group">
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1400"
                  alt="Fully Furnished Room"
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">
                      STAGE 2: LOCKED COORDINATE FURNISHED DIGITAL TWIN
                    </span>
                    <span className="text-xs font-mono text-white bg-emerald-600/90 px-3 py-1 rounded-full shadow-md font-bold">
                      ₹ 14,80,000 APPROVED
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="glass-morphism px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Calacatta Marble Placed [X: 0.0, Z: 0.0]</span>
                    </div>
                    <div className="glass-morphism px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Velvet Chesterfield Placed [X: -0.8, Z: 1.2]</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Explanatory Caption */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Drag the center handle above to observe the coordinate lock in action.</span>
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
