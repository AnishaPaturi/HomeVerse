"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";

export interface PaletteColor {
  name: string;
  hex: string;
  role: string;
}

export interface StyleOption {
  name: string;
  image: string;
  tagline: string;
  description: string;
  budgetEst: string;
  bestFor: string;
  palette: PaletteColor[];
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
    tagline: "Natural · Calm · Earthy",
    description: "Harmonious union of Japanese wabi-sabi minimalism and Scandinavian warmth with organic curves and uncluttered spaces.",
    budgetEst: "Balanced Value Tier",
    bestFor: "natural wood, linen, organic shapes, soft lighting and uncluttered spaces.",
    palette: [
      { name: "Warm Ivory", hex: "#F5F0E8", role: "Primary" },
      { name: "Sand Beige", hex: "#D8C8B0", role: "Secondary" },
      { name: "Sage Green", hex: "#A3A78B", role: "Accent" },
      { name: "Natural Oak", hex: "#A47755", role: "Wood" },
      { name: "Charcoal Brown", hex: "#4A463D", role: "Contrast" },
    ],
  },
  {
    name: "Industrial",
    image: "/styles/Industrial.png",
    tagline: "Raw · Bold · Urban",
    description: "Urban loft aesthetic featuring architectural concrete, matte black steel framing, raw surfaces, and distressed leather accents.",
    budgetEst: "Robust Mid-Range",
    bestFor: "exposed brick, concrete walls, black steel, distressed leather and reclaimed wood.",
    palette: [
      { name: "Concrete", hex: "#D6D2CB", role: "Primary (Concrete gray)" },
      { name: "Cement Gray", hex: "#8B8580", role: "Secondary" },
      { name: "Rust", hex: "#A65E36", role: "Accent (Rust orange)" },
      { name: "Charcoal", hex: "#343638", role: "Contrast" },
      { name: "Matte Black", hex: "#17191B", role: "Metal" },
    ],
  },
  {
    name: "Minimalist",
    image: "/styles/Minimalist.png",
    tagline: "Clean · Simple · Uncluttered",
    description: "Monolithic micro-surfaces, floating platform silhouettes, concealed architectural storage, and pure geometric discipline.",
    budgetEst: "Essential Forms Tier",
    bestFor: "clean geometry, open space, hidden storage and minimal decoration.",
    palette: [
      { name: "Pure White", hex: "#FFFFFF", role: "Primary" },
      { name: "Off White", hex: "#F2F2F0", role: "Secondary" },
      { name: "Light Gray", hex: "#D9D9D6", role: "Accent" },
      { name: "Stone Gray", hex: "#999995", role: "Neutral" },
      { name: "Soft Black", hex: "#252525", role: "Contrast" },
    ],
  },
  {
    name: "Modern Luxury",
    image: "/styles/Modern Luxury.png",
    tagline: "Elegant · Rich · Sophisticated",
    description: "Opulent Italian marble textures, rich velvet upholstery, brushed gold brass finishes, and statement dark walnut fluting.",
    budgetEst: "Premium Luxury Tier",
    bestFor: "marble, velvet, metallic finishes, statement lighting and premium furniture.",
    palette: [
      { name: "Champagne", hex: "#F1E7D6", role: "Primary (Champagne cream)" },
      { name: "Walnut", hex: "#75513F", role: "Secondary (Walnut brown)" },
      { name: "Gold", hex: "#C6A875", role: "Accent (Muted gold)" },
      { name: "Deep Green", hex: "#263D35", role: "Rich accent" },
      { name: "Onyx", hex: "#242326", role: "Contrast (Onyx black)" },
    ],
  },
  {
    name: "Contemporary",
    image: "/styles/contemprary.png",
    tagline: "Current · Refined · Versatile",
    description: "Sculptural curved silhouettes, layered textural plaster, honed roman travertine, slate blue accents, and champagne bronze fixtures.",
    budgetEst: "Turnkey Flexible Tier",
    bestFor: "mixed materials, curved furniture, artistic lighting, layered textures and balanced neutral tones.",
    palette: [
      { name: "Soft Cream", hex: "#F4F1EB", role: "Primary" },
      { name: "Greige", hex: "#C7BDB0", role: "Secondary" },
      { name: "Slate Blue", hex: "#75858B", role: "Accent" },
      { name: "Taupe", hex: "#8C8278", role: "Neutral" },
      { name: "Graphite", hex: "#303234", role: "Contrast" },
    ],
  },
  {
    name: "Modern Scandinavian",
    image: "/styles/Modern Scandinavian.png",
    tagline: "Bright · Cozy · Airy",
    description: "Light blonde birch, chalk-white breathable mineral walls, cozy oatmeal textiles, functional craftsmanship, and airy daylighting.",
    budgetEst: "Cost-Effective Tier",
    bestFor: "light wood, natural daylight, cozy textiles, functional furniture and subtle pastel accents.",
    palette: [
      { name: "Snow White", hex: "#FAF9F6", role: "Primary" },
      { name: "Oat Beige", hex: "#E8DDCA", role: "Secondary" },
      { name: "Light Oak", hex: "#D6C9B5", role: "Wood" },
      { name: "Soft Sage", hex: "#B8CBBE", role: "Accent" },
      { name: "Powder Blue", hex: "#91AFC1", role: "Secondary accent" },
    ],
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
            <span>STEP 9 · STYLE DNA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-editorial">
            Select Interior Design Aesthetic
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose the material DNA and architectural color palette portrayed on your room geometry.
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
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/[0.04] shadow-xl shadow-emerald-500/10 scale-[1.01]"
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold text-base tracking-tight font-editorial block drop-shadow-md">
                      {style.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide drop-shadow-sm">
                      {style.tagline}
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

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                <p className="text-xs text-slate-400 leading-relaxed font-light">{style.description}</p>

                {/* Color Palette DNA */}
                <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Color Palette DNA
                    </span>
                    <span className="text-[11px] font-mono font-medium text-emerald-400">
                      {style.budgetEst}
                    </span>
                  </div>

                  {/* 5 Swatches Row */}
                  <div className="flex items-center gap-2">
                    {style.palette.map((c, i) => (
                      <div
                        key={i}
                        className="group/swatch relative"
                        title={`${c.name} (${c.hex}) · ${c.role}`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20 inline-block shadow-sm transition-transform group-hover/swatch:scale-125 cursor-pointer"
                          style={{ backgroundColor: c.hex }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Color Swatch Names & Hex Grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-slate-400 pt-1">
                    {style.palette.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate" title={`${c.name} · ${c.hex} (${c.role})`}>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20 dark:border-white/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-slate-300 font-medium truncate">{c.name}</span>
                        <span className="text-slate-500 text-[9px] shrink-0">{c.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best For Section */}
                <div className="text-[11px] text-slate-400 font-light leading-snug pt-2 border-t border-white/[0.06]">
                  <span className="font-semibold text-slate-300">Best for: </span>
                  {style.bestFor}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
