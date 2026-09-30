"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Scale,
  DollarSign,
  ShieldCheck,
  Leaf,
  Sliders,
  Paintbrush,
  IndianRupee,
} from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  code?: string;
  albedo_color: string;
  roughness: number;
  metalness: number;
  normal_scale: number;
  cost_per_sqft: number;
  texture_url?: string;
  durability_rating: number;
  maintenance_score: number;
  eco_rating: string;
  description?: string;
}

interface MaterialComparisonResult {
  material_a: MaterialItem;
  material_b: MaterialItem;
  area_sqft: number;
  cost_a: number;
  cost_b: number;
  cost_difference: number;
  savings_percentage: number;
  durability_comparison: string;
  maintenance_comparison: string;
  recommendation: string;
  technical_tradeoffs?: string[];
}

interface MaterialExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMaterial?: (material: MaterialItem, target: "wall" | "floor") => void;
  roomAreaSqft?: number;
}

const CATEGORIES = ["all", "wood", "stone", "fabric", "metal", "paint", "glass"];

export default function MaterialExplorerModal({
  isOpen,
  onClose,
  onApplyMaterial,
  roomAreaSqft = 280.0,
}: MaterialExplorerModalProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareMatA, setCompareMatA] = useState<MaterialItem | null>(null);
  const [compareMatB, setCompareMatB] = useState<MaterialItem | null>(null);
  const [comparisonResult, setComparisonResult] = useState<MaterialComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/materials`);
        if (res.ok) {
          const data = await res.json();
          setMaterials(data);
          if (data.length > 0) {
            setSelectedMaterial(data[0]);
            setCompareMatA(data[0]);
            if (data.length > 1) setCompareMatB(data[1]);
          }
        }
      } catch (err) {
        console.warn("Notice: Fetching materials library:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [isOpen]);

  const handleRunComparison = async () => {
    if (!compareMatA || !compareMatB) return;
    setComparing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/materials/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_a_id: compareMatA.id,
          material_b_id: compareMatB.id,
          area_sqft: roomAreaSqft,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setComparisonResult(result);
      }
    } catch (e) {
      console.warn("Notice: Comparing materials:", e);
    } finally {
      setComparing(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesCat = activeCategory === "all" || m.category.toLowerCase() === activeCategory;
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                PBR Material Visualization & Comparison Engine
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  v3 PBR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Physically Based Rendering (Albedo, Roughness, Metalness) with dynamic installed cost comparison
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode) handleRunComparison();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                compareMode
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              {compareMode ? "Exit Comparison Mode" : "Side-by-Side Comparison"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category filters & Search */}
        {!compareMode && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs capitalize px-3 py-1 rounded-lg transition font-medium ${
                    activeCategory === cat
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials (marble, oak, brass)..."
              className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">Loading PBR material library...</span>
            </div>
          ) : compareMode ? (
            /* Comparison Mode View */
            <div className="space-y-6">
              {/* Selectors for Material A and B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material A Selector */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Option A (Baseline)
                    </span>
                    <select
                      value={compareMatA?.id || ""}
                      onChange={(e) => {
                        const m = materials.find((item) => item.id === e.target.value);
                        if (m) {
                          setCompareMatA(m);
                          handleRunComparison();
                        }
                      }}
                      className="bg-slate-900 text-xs text-white border border-slate-700 rounded-lg px-2.5 py-1"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (₹{m.cost_per_sqft}/sqft)
                        </option>
                      ))}
                    </select>
                  </div>
                  {compareMatA && (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl border border-white/20 shadow-md shrink-0"
                        style={{ backgroundColor: compareMatA.albedo_color }}
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-white">{compareMatA.name}</div>
                        <div className="text-slate-400 text-[11px] capitalize">
                          {compareMatA.category} • Roughness: {compareMatA.roughness} • Metalness:{" "}
                          {compareMatA.metalness}
                        </div>
                        <div className="text-amber-400 font-bold mt-0.5">
                          ₹{compareMatA.cost_per_sqft}/sq ft
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Material B Selector */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      Option B (Alternative)
                    </span>
                    <select
                      value={compareMatB?.id || ""}
                      onChange={(e) => {
                        const m = materials.find((item) => item.id === e.target.value);
                        if (m) {
                          setCompareMatB(m);
                          handleRunComparison();
                        }
                      }}
                      className="bg-slate-900 text-xs text-white border border-slate-700 rounded-lg px-2.5 py-1"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (₹{m.cost_per_sqft}/sqft)
                        </option>
                      ))}
                    </select>
                  </div>
                  {compareMatB && (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl border border-white/20 shadow-md shrink-0"
                        style={{ backgroundColor: compareMatB.albedo_color }}
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-white">{compareMatB.name}</div>
                        <div className="text-slate-400 text-[11px] capitalize">
                          {compareMatB.category} • Roughness: {compareMatB.roughness} • Metalness:{" "}
                          {compareMatB.metalness}
                        </div>
                        <div className="text-sky-400 font-bold mt-0.5">
                          ₹{compareMatB.cost_per_sqft}/sq ft
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Calculation Results */}
              {comparisonResult && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400">Total Installed Cost for {roomAreaSqft} sq ft</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        ₹{comparisonResult.cost_a.toLocaleString("en-IN")} vs ₹
                        {comparisonResult.cost_b.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
                      Difference: {comparisonResult.cost_difference > 0 ? "Save " : "Add "}
                      ₹{Math.abs(comparisonResult.cost_difference).toLocaleString("en-IN")} (
                      {comparisonResult.savings_percentage}%)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Durability & Scratch Resistance
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {comparisonResult.durability_comparison}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-amber-400" />
                        Maintenance & Porosity Overhead
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {comparisonResult.maintenance_comparison}
                      </p>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-amber-300">HomeVerse Specification Advisory:</span>
                      <p className="text-[11px] leading-relaxed text-amber-200/90 mt-0.5">
                        {comparisonResult.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Apply Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (compareMatA) {
                          onApplyMaterial?.(compareMatA, compareMatA.category === "paint" ? "wall" : "floor");
                          onClose();
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                    >
                      Apply {compareMatA?.name}
                    </button>
                    <button
                      onClick={() => {
                        if (compareMatB) {
                          onApplyMaterial?.(compareMatB, compareMatB.category === "paint" ? "wall" : "floor");
                          onClose();
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 transition"
                    >
                      Apply {compareMatB?.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Materials Catalogue Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`group relative rounded-2xl p-4 cursor-pointer transition-all border ${
                    selectedMaterial?.id === mat.id
                      ? "bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  {/* Swatch & Category Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl border border-white/20 shadow-md"
                      style={{ backgroundColor: mat.albedo_color }}
                    />
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {mat.category}
                    </span>
                  </div>

                  {/* Title & Code */}
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                    {mat.name}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{mat.code || "PBR-STD"}</div>

                  {/* PBR Parameters */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10.5px] text-slate-400 font-mono">
                    <div className="flex justify-between bg-slate-900/80 px-2 py-1 rounded">
                      <span>Rough:</span>
                      <span className="text-slate-200">{mat.roughness}</span>
                    </div>
                    <div className="flex justify-between bg-slate-900/80 px-2 py-1 rounded">
                      <span>Metal:</span>
                      <span className="text-slate-200">{mat.metalness}</span>
                    </div>
                  </div>

                  {/* Cost & Rating */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="font-bold text-amber-400">₹{mat.cost_per_sqft}/sqft</div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{mat.durability_rating}/5</span>
                    </div>
                  </div>

                  {/* Apply Quick Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyMaterial?.(mat, mat.category === "paint" ? "wall" : "floor");
                      onClose();
                    }}
                    className="w-full mt-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-[11px] font-semibold transition"
                  >
                    Apply to {mat.category === "paint" ? "Walls" : "Flooring"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-medium">{filteredMaterials.length}</span> PBR materials
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
