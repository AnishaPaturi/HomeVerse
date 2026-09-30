"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Scan, Check, CheckCircle2, ArrowRight } from "lucide-react";

interface PlatformDemoProps {
  isAuthenticated: boolean;
}

export const PlatformDemo: React.FC<PlatformDemoProps> = ({ isAuthenticated }) => {
  const router = useRouter();

  return (
    <section id="ai-engine" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#070b10] relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Scan className="w-3.5 h-3.5" />
            <span>SPATIAL COMPUTER VISION PIPELINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            See what the AI actually sees in your room.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed font-light">
            Unlike consumer AI chatbots that treat rooms as abstract concepts, HomeVerse runs deep semantic room decomposition: calculating aspect ratios, lighting angles, walking clearances, and bounding boxes.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono">Boundary Detection</h4>
                <p className="text-xs text-slate-400 font-light">Identifies structural walls, load-bearing partitions, and floor slabs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono">Object Classification</h4>
                <p className="text-xs text-slate-400 font-light">Isolates sofas, coffee tables, TV consoles, doors, windows, and light fixtures.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono">Coordinate Translation</h4>
                <p className="text-xs text-slate-400 font-light">Maps 2D pixel coordinates into 3D Cartesian space (X, Y, Z) for WebGL.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push(isAuthenticated ? "/home/new" : "/login")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 hover:border-emerald-500 hover:text-white transition-all cursor-pointer"
            >
              <span>Try Room Scanner</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Terminal Readout */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl overflow-hidden font-mono text-xs">
            <div className="px-5 py-3.5 bg-[#0e141e] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-400 text-[11px]">gemini-vision-spatial-analyzer v3.5</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                CONFIDENCE 96.4%
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">WALL BOUNDS</div>
                  <div className="text-sm font-bold text-white mt-1">4 Aligned ✓</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">FLOOR AREA</div>
                  <div className="text-sm font-bold text-white mt-1">29.76 m²</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">CEILING H</div>
                  <div className="text-sm font-bold text-white mt-1">3.05 m (10ft)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">FURNITURE NODES</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">7 Objects</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#05070a] border border-slate-800/80 text-[11px] space-y-2 text-slate-300">
                <div className="text-slate-500">// EXTRACTED SCENE GRAPH COORDINATES (X, Y, Z)</div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">• sofa_modular_01</span>
                  <span className="text-slate-400">pos: [-0.80, 0.00, 0.00] · rot: 0.78 rad</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">• coffee_table_01</span>
                  <span className="text-slate-400">pos: [0.50, 0.00, 0.90] · rot: -0.39 rad</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">• floor_lamp_ambient</span>
                  <span className="text-slate-400">pos: [-2.30, 0.00, -1.20] · 2700K Lux</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Spatial Clearance: All main pathways exceed 80cm clearance.</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">PASS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformDemo;
