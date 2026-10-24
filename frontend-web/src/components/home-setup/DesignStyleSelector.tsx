"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Sparkles,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";
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
    image: "/styles/japandi.png",
    tagline: "Natural · Calm · Earthy",
    description:
      "Harmonious union of Japanese wabi-sabi minimalism and Scandinavian warmth with organic curves, natural light woods, linen, and uncluttered spaces.",
    budgetEst: "Mid-range (₹1,500–₹2,300/sq.ft)",
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
    image: "/styles/industrial.png",
    tagline: "Raw · Bold · Urban",
    description:
      "Urban loft aesthetic featuring architectural concrete, matte black steel framing, exposed brick walls, and distressed leather accents.",
    budgetEst: "Mid-range (₹1,600–₹2,600/sq.ft)",
    bestFor: "exposed brick, concrete walls, black steel, distressed leather and reclaimed wood.",
    palette: [
      { name: "Concrete", hex: "#D6D2CB", role: "Primary" },
      { name: "Cement Gray", hex: "#8B8580", role: "Secondary" },
      { name: "Charcoal", hex: "#343638", role: "Contrast" },
      { name: "Matte Black", hex: "#17191B", role: "Metal" },
      { name: "Rust", hex: "#A65E36", role: "Accent" },
    ],
  },
  {
    name: "Minimalist",
    image: "/styles/minimalist.png",
    tagline: "Clean · Simple · Uncluttered",
    description:
      "Clean geometric discipline, open space, concealed storage, pure neutral discipline, and essential functional furniture that maximizes light.",
    budgetEst: "Budget-friendly (₹1,200–₹1,800/sq.ft)",
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
    description:
      "Opulent Italian marble surfaces, rich velvet upholstery, brushed gold brass finishes, fluted dark walnut cabinetry, and bespoke statement tables.",
    budgetEst: "Luxury (₹3,00,0–₹5,500+/sq.ft)",
    bestFor: "marble, velvet, metallic finishes, statement lighting and premium furniture.",
    palette: [
      { name: "Champagne", hex: "#F1E7D6", role: "Primary" },
      { name: "Gold", hex: "#C6A875", role: "Accent" },
      { name: "Walnut", hex: "#75513F", role: "Secondary" },
      { name: "Deep Green", hex: "#263D35", role: "Rich Accent" },
      { name: "Onyx", hex: "#242326", role: "Contrast" },
    ],
  },
  {
    name: "Contemporary",
    image: "/styles/contemporary.png",
    tagline: "Current · Refined · Versatile",
    description:
      "Sculptural curved silhouettes, layered textural plaster, honed roman travertine, slate blue accents, and champagne bronze fixtures.",
    budgetEst: "Premium (₹1,800–₹3,000/sq.ft)",
    bestFor: "mixed materials, curved furniture, artistic lighting, layered textures and balanced neutral tones.",
    palette: [
      { name: "Soft Cream", hex: "#F4F1EB", role: "Primary" },
      { name: "Greige", hex: "#C7BDB0", role: "Secondary" },
      { name: "Taupe", hex: "#8C8278", role: "Neutral" },
      { name: "Slate Blue", hex: "#75858B", role: "Accent" },
      { name: "Graphite", hex: "#303234", role: "Contrast" },
    ],
  },
  {
    name: "Modern Scandinavian",
    image: "/styles/Modern Scandinavian.png",
    tagline: "Bright · Cozy · Airy",
    description:
      "Light blonde birch, chalk-white breathable mineral walls, cozy oatmeal textiles, functional craftsmanship, and airy daylighting.",
    budgetEst: "Affordable (₹1,400–₹2,100/sq.ft)",
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

export const STYLE_RATES: Record<string, { min: number; max: number; tier: string; est1000: string }> = {
  Japandi: { min: 1500, max: 2300, tier: "Mid-range", est1000: "₹15–23 lakh" },
  Industrial: { min: 1600, max: 2600, tier: "Mid-range", est1000: "₹16–26 lakh" },
  Minimalist: { min: 1200, max: 1800, tier: "Budget-friendly", est1000: "₹12–18 lakh" },
  "Modern Luxury": { min: 3000, max: 5500, tier: "Luxury", est1000: "₹30–55 lakh+" },
  Contemporary: { min: 1800, max: 3000, tier: "Premium", est1000: "₹18–30 lakh" },
  "Modern Scandinavian": { min: 1400, max: 2100, tier: "Affordable", est1000: "₹14–21 lakh" },
};

function normalizeStyleName(name: string): string {
  if (!name) return "Japandi";
  const lower = name.toLowerCase();
  if (lower.includes("scandinavian")) return "Modern Scandinavian";
  if (lower.includes("luxury")) return "Modern Luxury";
  if (lower.includes("minimal")) return "Minimalist";
  if (lower.includes("japan")) return "Japandi";
  if (lower.includes("indust")) return "Industrial";
  if (lower.includes("contemp")) return "Contemporary";
  return name;
}

export const DesignStyleSelector: React.FC<DesignStyleSelectorProps> = ({
  selectedStyle,
  onSelect,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Interactive Budget Preview Calculator State
  const [calcStyle, setCalcStyle] = useState<string>(() => normalizeStyleName(selectedStyle));
  const [calcArea, setCalcArea] = useState<number>(1000);

  // Sync calcStyle when selectedStyle changes from parent
  useEffect(() => {
    if (selectedStyle) {
      setCalcStyle(normalizeStyleName(selectedStyle));
    }
  }, [selectedStyle]);

  const currentRates = STYLE_RATES[calcStyle] || STYLE_RATES["Japandi"];
  const lowerEstimate = calcArea * currentRates.min;
  const upperEstimate = calcArea * currentRates.max;

  const handleStyleChange = (newStyle: string) => {
    const canonical = normalizeStyleName(newStyle);
    setCalcStyle(canonical);
    onSelect(canonical);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadProgressText("Pre-loading visual assets...");
    try {
      await generateInteriorDesignReport({
        selectedStyle: calcStyle,
        carpetAreaSqFt: calcArea,
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
            normalizeStyleName(selectedStyle) === style.name ||
            normalizeStyleName(calcStyle) === style.name;

          return (
            <button
              key={style.name}
              type="button"
              onClick={() => handleStyleChange(style.name)}
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
                        className="flex-1 h-6 rounded-md shadow-sm border border-white/10 relative group/swatch cursor-help transition-transform hover:scale-110"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} (${c.hex}) - ${c.role}`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/swatch:flex flex-col items-center bg-slate-950 text-white text-[10px] py-1 px-2 rounded-md shadow-lg border border-white/10 whitespace-nowrap z-30 pointer-events-none">
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{c.hex}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    {style.palette.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] font-mono">
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

      {/* ======================================================== */}
      {/* INTERACTIVE BUDGET PREVIEW CALCULATOR                     */}
      {/* ======================================================== */}
      <div className="mt-10 pt-8 border-t border-white/[0.08]">
        <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/80 border border-emerald-500/20 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Calculator Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>INTERACTIVE BUDGET PREVIEW · 2026 BENCHMARKS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-editorial">
                HomeVerse Budget Preview
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-light">
                An illustrative calculator for comparing design styles.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Style: <strong className="text-emerald-400">{calcStyle}</strong></span>
            </div>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 relative z-10">
            {/* Left Column: Style Selection & Area Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Style Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2.5">
                  Select an interior style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(STYLE_RATES).map((styleName) => {
                    const isSelected = calcStyle === styleName;
                    const meta = STYLE_RATES[styleName];
                    return (
                      <button
                        key={styleName}
                        type="button"
                        onClick={() => handleStyleChange(styleName)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                            : "bg-slate-900/60 border-white/[0.08] hover:border-white/20 text-slate-300"
                        }`}
                      >
                        <div className="font-semibold text-xs text-white truncate">{styleName}</div>
                        <div className="text-[10px] font-mono text-emerald-400/90 mt-0.5">
                          {meta.tier}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          ₹{meta.min.toLocaleString()}–{meta.max.toLocaleString()}/sq.ft
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carpet Area Input & Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Carpet area (sq. ft.)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={300}
                      max={5000}
                      step={50}
                      value={calcArea}
                      onChange={(e) => setCalcArea(Math.max(100, Math.min(10000, Number(e.target.value) || 0)))}
                      className="w-28 px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-right text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-400 font-mono">sq. ft.</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={300}
                  max={4000}
                  step={50}
                  value={calcArea}
                  onChange={(e) => setCalcArea(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: "650 sq.ft (1BHK)", val: 650 },
                    { label: "1,000 sq.ft (2BHK)", val: 1000 },
                    { label: "1,450 sq.ft (3BHK)", val: 1450 },
                    { label: "2,200 sq.ft (4BHK/Villa)", val: 2200 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setCalcArea(preset.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                        calcArea === preset.val
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Estimated Project Cost Display (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-xl space-y-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  ESTIMATED PROJECT COST
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-editorial">
                  ₹{lowerEstimate.toLocaleString("en-IN")} – ₹{upperEstimate.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-emerald-300/80 font-mono mt-1">
                  ≈ ₹{(lowerEstimate / 100000).toFixed(1)} Lakhs – ₹{(upperEstimate / 100000).toFixed(1)} Lakhs
                </div>
              </div>

              {/* Lower vs Upper Estimate Split Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08]">
                  <span className="text-[10px] font-mono text-slate-400 block">Lower estimate</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    ₹{lowerEstimate.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    @ ₹{currentRates.min}/sq.ft
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08]">
                  <span className="text-[10px] font-mono text-slate-400 block">Upper estimate</span>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                    ₹{upperEstimate.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    @ ₹{currentRates.max}/sq.ft
                  </span>
                </div>
              </div>

              {/* Subtext Disclaimer */}
              <div className="pt-3 border-t border-white/[0.08] text-[11px] text-slate-400 font-light leading-relaxed">
                Illustrative planning estimate, not a contractor quote. Based on carpet area and the proposed HomeVerse rates.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OFFICIAL PDF REPORT DOWNLOAD BANNER (9-PAGE GUIDE)       */}
      {/* ======================================================== */}
      <div className="mt-6 pt-2">
        <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                <FileText className="w-3.5 h-3.5" />
                <span>OFFICIAL 9-PAGE SPECIFICATION & COST GUIDE</span>
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
                  Format: <strong className="text-white">PDF · A4 · 9-Page Guide</strong>
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
                PDF · A4 · 9-page guide
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
