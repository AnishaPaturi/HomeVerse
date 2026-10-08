"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";

interface StyleOption {
  name: string;
  image: string;
  description: string;
  budgetEst: string;
  palette: string[];
}

interface DesignStyleSelectorProps {
  selectedStyle: string;
  onSelect: (styleName: string) => void;
  budgetAmount?: number;
}

const DESIGN_STYLES: StyleOption[] = [
  {
    name: "Japandi",
    image: "/styles/Japandi.png",
    description: "Warm vertical white-oak acoustic slats, oatmeal bouclé textures, wabi-sabi minimalism, and soft paper lantern glow.",
    budgetEst: "Balanced Value Tier",
    palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e"],
  },
  {
    name: "Industrial",
    image: "/styles/Industrial.png",
    description: "Exposed heritage terracotta brickwork, matte black warehouse steel framing, and distressed cognac saddle leather.",
    budgetEst: "Robust Mid-Range",
    palette: ["#18181b", "#27272a", "#ea580c", "#451a03"],
  },
  {
    name: "Minimalist",
    image: "/styles/Minimalist.png",
    description: "Monolithic micro-cement concrete, floating platform silhouettes, concealed shadow gaps, and indirect recessed ceiling glow.",
    budgetEst: "Essential Forms Tier",
    palette: ["#f1f5f9", "#cbd5e1", "#475569", "#1e293b"],
  },
  {
    name: "Modern Luxury",
    image: "/styles/Modern Luxury.png",
    description: "Bookmatched Italian Statuario marble, rich emerald velvet sofa with brushed champagne brass, and dark smoked walnut fluting.",
    budgetEst: "Premium Luxury Tier",
    palette: ["#090d16", "#1e1b4b", "#d97706", "#047857"],
  },
  {
    name: "Contemporary",
    image: "/styles/contemprary.png",
    description: "Sculptural curved ivory bouclé, fluted warm taupe plaster, honed Roman travertine, and champagne bronze fixtures.",
    budgetEst: "Turnkey Flexible Tier",
    palette: ["#fafaf9", "#d6d3d1", "#e7e5e4", "#78716c"],
  },
  {
    name: "Modern Scandinavian",
    image: "/styles/Modern Scandinavian.png",
    description: "Light blonde birch, chalk-white mineral walls, heather gray linen sectional, and maximum natural daylighting.",
    budgetEst: "Cost-Effective Tier",
    palette: ["#ffffff", "#f8fafc", "#e2e8f0", "#0284c7"],
  },
];

export const DesignStyleSelector: React.FC<DesignStyleSelectorProps> = ({
  selectedStyle,
  onSelect,
}) => {
  return (
    <div className="bg-slate-900/90 dark:bg-[#090e15] border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl transition-all">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>STEP 8 OF 9 · AESTHETIC DNA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-editorial">
            Select Interior Design Aesthetic
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose the material DNA and architectural styling portrayed on the exact same room geometry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DESIGN_STYLES.map((style) => {
          const active =
            selectedStyle === style.name ||
            selectedStyle.toLowerCase() === style.name.toLowerCase() ||
            (selectedStyle === "Scandinavian" && style.name === "Modern Scandinavian") ||
            (selectedStyle === "Luxury" && style.name === "Modern Luxury") ||
            (selectedStyle === "Modern" && style.name === "Minimalist");

          return (
            <button
              key={style.name}
              type="button"
              onClick={() => onSelect(style.name)}
              className={`rounded-2xl border text-left overflow-hidden transition-all duration-300 group flex flex-col cursor-pointer ${
                active
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/[0.03] shadow-lg shadow-emerald-500/10 scale-[1.01]"
                  : "border-white/[0.08] hover:border-white/20 bg-slate-950/40 hover:bg-slate-950/60"
              }`}
            >
              <div className="h-48 w-full relative overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={encodeURI(style.image)}
                  alt={style.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-base tracking-tight font-editorial block drop-shadow-md">
                      {style.name}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      active
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 scale-105"
                        : "bg-black/50 text-white/50 backdrop-blur-sm border border-white/20"
                    }`}
                  >
                    {active ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-light">{style.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5" title="Material Palette">
                    {style.palette.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400">
                    {style.budgetEst}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
