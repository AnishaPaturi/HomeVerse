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
    name: "Modern",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
    description: "Clean lines, geometric profiles, balanced neutrals, and concealed storage.",
    budgetEst: "Standard Budget Range",
    palette: ["#0f172a", "#334155", "#cbd5e1", "#b45309"],
  },
  {
    name: "Japandi",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800",
    description: "Warm blonde oak, linen textures, wabi-sabi minimalism, and zen lighting.",
    budgetEst: "Balanced Value Tier",
    palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e"],
  },
  {
    name: "Scandinavian",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
    description: "Light birch, high natural daylighting, plush bouclé fabrics, and functional simplicity.",
    budgetEst: "Cost-Effective Tier",
    palette: ["#ffffff", "#e2e8f0", "#0284c7", "#10b981"],
  },
  {
    name: "Modern Luxury",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
    description: "Statuario marble surfaces, polished champagne brass accents, and custom millwork.",
    budgetEst: "Premium Luxury Tier",
    palette: ["#09090b", "#71717a", "#eab308", "#18181b"],
  },
  {
    name: "Industrial",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800",
    description: "Exposed brick, black steel framing, concrete finishes, and rich distressed leather.",
    budgetEst: "Robust Mid-Range",
    palette: ["#27272a", "#52525b", "#a1a1aa", "#78350f"],
  },
  {
    name: "Contemporary",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
    description: "Soft curved contours, bold statement lighting, and fresh trendy silhouettes.",
    budgetEst: "Turnkey Flexible Tier",
    palette: ["#fafaf9", "#d6d3d1", "#6366f1", "#0f172a"],
  },
];

export const DesignStyleSelector: React.FC<DesignStyleSelectorProps> = ({
  selectedStyle,
  onSelect,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Select Design Aesthetic</h2>
        <p className="text-sm text-gray-500 mt-1">Choose the interior design DNA for AI 3D space generation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGN_STYLES.map((style) => {
          const active = selectedStyle === style.name;
          return (
            <button
              key={style.name}
              type="button"
              onClick={() => onSelect(style.name)}
              className={`rounded-2xl border text-left overflow-hidden transition-all group flex flex-col ${
                active
                  ? "border-indigo-600 ring-2 ring-indigo-600/30"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300"
              }`}
            >
              <div className="h-44 w-full relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white font-black text-base">{style.name}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      active ? "bg-indigo-600 text-white" : "bg-black/50 text-white/60 backdrop-blur-sm"
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-gray-500 mb-3">{style.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    {style.palette.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
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
