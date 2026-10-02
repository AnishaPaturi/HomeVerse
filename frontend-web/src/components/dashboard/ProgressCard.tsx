"use client";

import React from "react";
import { CheckCircle2, Clock, Sparkles, Layers } from "lucide-react";

interface ProgressCardProps {
  completedRooms: number;
  totalRooms: number;
  activeDesignStyle?: string;
  overallProgress?: number;
  designProgress?: number;
  procurementProgress?: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completedRooms = 2,
  totalRooms = 4,
  activeDesignStyle = "Japandi",
  overallProgress,
  designProgress = 85,
  procurementProgress = 60,
}) => {
  const percentage = overallProgress ?? (totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0);

  return (
    <div className="glass-morphism-card rounded-3xl p-6 sm:p-7 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Spatial Progress
          </span>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
            Style: {activeDesignStyle}
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white font-mono mb-2 tracking-tight">
          {completedRooms} / {totalRooms} Rooms Ready
        </div>

        <p className="text-xs text-slate-400 font-light leading-relaxed mb-6">
          Spatial CAD engine is progressively estimating room budgets, material swatches, and contractor execution schedules across your multi-floor model.
        </p>

        {/* Multi-track indicators */}
        <div className="space-y-3 mb-6 font-mono text-xs">
          <div>
            <div className="flex justify-between items-center text-slate-300 text-[11px] mb-1">
              <span>Architectural Layout & BIM</span>
              <span className="text-emerald-400 font-bold">{designProgress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${designProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-slate-300 text-[11px] mb-1">
              <span>Catalog Sourcing & Procurement</span>
              <span className="text-teal-400 font-bold">{procurementProgress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${procurementProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[11px] text-slate-300 font-mono">
          Locked-coordinate architectural parity active
        </span>
      </div>
    </div>
  );
};
