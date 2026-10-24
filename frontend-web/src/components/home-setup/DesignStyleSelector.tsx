"use client";

import React, { useState } from "react";
import { Check, Sparkles, Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { generateInteriorDesignReport } from "@/lib/pdfReportGenerator";

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
  selectedRoom?: string;
  roomDimensions?: {
    width?: number;
    length?: number;
    area?: number;
  };
  detectedRooms?: any[];
  homeType?: string;
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
  budgetAmount,
  selectedRoom = "Drawing Room",
  roomDimensions,
  homeType,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadProgressText("Pre-loading visual assets...");
    try {
      await generateInteriorDesignReport({
        roomName: selectedRoom,
        roomDimensions: roomDimensions || { width: 4.5, length: 5.0, area: 22.5 },
        totalBudget: budgetAmount || 1500000,
        homeType: homeType || "Residential Apartment",
        selectedStyle,
        onProgress: (_progress, status) => {
          setDownloadProgressText(status);
        },
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to generate PDF report:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgressText("");
    }
  };

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

      {/* Step 9: Interior Design Report Download Banner */}
      <div className="mt-8 pt-6 border-t border-white/[0.08]">
        <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
          {/* Background Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                <FileText className="w-3.5 h-3.5" />
                <span>OFFICIAL SPECIFICATION & COST CATALOGUE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-editorial">
                Your Interior Design Report
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                Your six-style catalogue, colour palettes, material breakdown and estimated installation costs.
              </p>

              {/* Catalogue Scope Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
                  Scope: <strong className="text-emerald-400">All 6 Design Styles</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
                  Pricing: <strong className="text-white">Per Sq.Ft Benchmarks & Ensembles</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300">
                  Format: <strong className="text-white">PDF · A4 · 8 Pages</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="relative inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{downloadProgressText || "Generating PDF..."}</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Report Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>

              <span className="text-[11px] font-mono text-slate-400 text-center sm:text-right">
                PDF · A4 · 6 interior styles
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
