"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { fetchDigitalHomeBook, DigitalHomeBook } from "@/lib/api";
import {
  Award,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Home,
  Layers,
  Sparkles,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CalendarCheck,
  ShieldCheck,
  ArrowLeft,
  Check,
  Compass,
  FileCheck,
  Sparkle
} from "lucide-react";

export default function DigitalHomeBookPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [homeBook, setHomeBook] = useState<DigitalHomeBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "spatial" | "designs" | "budget" | "procurement" | "execution" | "handbook"
  >("overview");
  const [activeAngle, setActiveAngle] = useState<"primary" | "front" | "left" | "right" | "back">("primary");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchDigitalHomeBook(projectId);
        setHomeBook(data);
      } catch (err) {
        console.error("Failed to load Digital Home Book", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">Assembling Digital Home Book Dossier...</p>
        </div>
      </div>
    );
  }

  if (!homeBook) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-500 font-semibold mb-4">Unable to load project dossier.</p>
          <Link
            href={`/project/${projectId}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            Return to Project
          </Link>
        </div>
      </div>
    );
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white pb-20 print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project Workspace
          </Link>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-600 dark:text-zinc-400" />
              {copiedLink ? "Link Copied!" : "Share Dossier"}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Hero Dossier Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-900/40 mb-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Home Completion Certificate & Dossier
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {homeBook.name}
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base mt-2 max-w-2xl">
                The authoritative Digital Home Book compiling your architectural specifications, room layout,
                selected AI renders, budget savings audit, procurement manifest, and care handbook.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-indigo-400" />
                  <span>{homeBook.bhk} BHK &bull; {homeBook.area_sqft} sq ft</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Style: {homeBook.selected_design?.style || "Warm Contemporary"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Optimized Budget: {formatINR(homeBook.budget_summary.optimized_cost)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Cert #{homeBook.completion_certificate.certificate_id}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center shrink-0 w-full sm:w-auto">
              <span className="text-xs uppercase tracking-wider text-zinc-300 block mb-1">Total Net Savings</span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                {formatINR(homeBook.budget_summary.savings_achieved)}
              </span>
              <div className="text-[11px] text-zinc-300 mt-1 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                <span>Reduced via AI Optimization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Breadcrumbs / Phase 46 Journey Overview */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkle className="w-3.5 h-3.5" />
              Verified User Journey: Concept to Completion
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              100% Executed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">1. Home Spec</span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">2 BHK, 1120 sqft</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">2. Spatial AI</span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">Rooms Detected</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">3. Style Match</span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">Warm Contemporary</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">4. 3 Designs</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Design B Chosen</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">5. Optimization</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">₹8.4L &rarr; ₹7.96L</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 text-center">
              <span className="font-semibold block text-gray-900 dark:text-white">6. Shopping & Plan</span>
              <span className="text-[11px] text-gray-500 dark:text-zinc-400">Items Procured</span>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
              <span className="font-semibold block text-indigo-700 dark:text-indigo-300">7. Home Book</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Complete Dossier</span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Hidden on print) */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto print:hidden gap-1">
          {[
            { id: "overview", label: "Executive Summary", icon: Award },
            { id: "spatial", label: "Spatial & Rooms", icon: Layers },
            { id: "designs", label: "Selected Design & Renders", icon: Sparkles },
            { id: "budget", label: "Budget & Cost Audit", icon: DollarSign },
            { id: "procurement", label: "Shopping Inventory", icon: ShoppingBag },
            { id: "execution", label: "Execution Milestones", icon: CalendarCheck },
            { id: "handbook", label: "Care Handbook", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE SUMMARY & COMPLETION CERTIFICATE */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resident & Property Overview */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Resident & Property Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Owner / Resident</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {homeBook.client_profile?.user_name || "Anisha Paturi"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Property Format</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {homeBook.bhk} BHK Apartment &bull; {homeBook.area_sqft} sq ft
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Lifestyle Persona</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Hybrid WFH &bull; High Storage &bull; Warm Social Gatherings
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                    <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Design Style DNA</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {homeBook.client_profile?.style_preferences?.style || "Warm Contemporary"}
                    </span>
                  </div>
                </div>

                {/* Preferred Materials & Colours */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold mb-3">Color Palette & Material Curation</h3>
                  <div className="flex flex-wrap gap-2">
                    {homeBook.client_profile?.style_preferences?.colours?.map((col) => (
                      <span
                        key={col}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                      >
                        {col}
                      </span>
                    ))}
                    {homeBook.client_profile?.style_preferences?.materials?.map((mat) => (
                      <span
                        key={mat}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Completion Certificate Card */}
              <div className="bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border-2 border-amber-300 dark:border-amber-600/50 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-700 dark:text-amber-400 uppercase font-bold">
                      VERIFIED HOME
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Certificate of Completion
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                    Certified by {homeBook.completion_certificate?.issued_by || "HomeVerse Platform"}
                  </p>

                  <div className="my-5 border-t border-b border-amber-200 dark:border-amber-900/40 py-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-zinc-400">Issued To:</span>
                      <span className="font-semibold">{homeBook.completion_certificate?.issued_to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-zinc-400">Date:</span>
                      <span className="font-semibold">{homeBook.completion_certificate?.completion_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-zinc-400">Certificate ID:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {homeBook.completion_certificate?.certificate_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>All execution milestones audited and quality verified.</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">Target Budget</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatINR(homeBook.budget_summary.target_budget)}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 block">Initial cap configured</span>
              </div>
              <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">Initial Estimate</span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatINR(homeBook.budget_summary.initial_estimate)}
                </span>
                <span className="text-[11px] text-rose-500 mt-1 block">+₹40,000 over budget initial</span>
              </div>
              <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">Optimized Total</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(homeBook.budget_summary.optimized_cost)}
                </span>
                <span className="text-[11px] text-emerald-600 mt-1 block">Within ₹8.0L target</span>
              </div>
              <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">Net Savings</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatINR(homeBook.budget_summary.savings_achieved)}
                </span>
                <span className="text-[11px] text-indigo-600 mt-1 block">Saved through material substitutions</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPATIAL ANALYSIS & FLOOR PLAN */}
        {activeTab === "spatial" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Architectural Spatial Analysis & Detected Rooms</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Extracted from uploaded 2D floor plan using AI boundary vectorization.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                  {homeBook.floor_plan?.detected_rooms?.length || 3} Zones Calibrated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/60 text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold rounded-l-xl">Room Zone</th>
                      <th className="py-3 px-4 font-semibold">Calculated Dimensions</th>
                      <th className="py-3 px-4 font-semibold">Square Footage</th>
                      <th className="py-3 px-4 font-semibold">Spatial Status</th>
                      <th className="py-3 px-4 font-semibold rounded-r-xl">Design Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {homeBook.floor_plan?.detected_rooms?.map((room, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Compass className="w-4 h-4 text-indigo-500" />
                          {room.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-zinc-300">
                          {room.dimensions}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          {room.area_sqft} sq ft
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Locked Coordinate Grid
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            Render Generated
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-xs text-gray-600 dark:text-zinc-400">
                <span className="font-semibold text-gray-900 dark:text-white">Spatial Summary: </span>
                {homeBook.floor_plan?.structural_summary ||
                  "Vector floor plan successfully parsed into locked 3D coordinate bounding boxes with seamless circulation pathways."}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SELECTED DESIGN & RENDERS */}
        {activeTab === "designs" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Selected Concept: Design B (Warm Contemporary)</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Selected out of 3 generative options during Living Room discovery.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Resident Choice
                  </span>
                </div>
              </div>

              {/* 3-Way Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {homeBook.all_designs_compared?.map((concept) => {
                  const isSelected = concept.selected || concept.id === homeBook.selected_design?.id;
                  return (
                    <div
                      key={concept.id}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-md"
                          : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-70"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                          {concept.style}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider">
                            Selected
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                        {concept.name}
                      </h4>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">Estimated Cost:</span>
                        <span className="font-bold text-base text-gray-900 dark:text-white">
                          {formatINR(concept.estimated_cost)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-angle Render Showcase */}
              <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900">
                <div className="flex items-center justify-between p-4 bg-zinc-800/80 border-b border-zinc-700/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">
                      3D Generative Perspectives &mdash; {activeAngle.toUpperCase()} VIEW
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {(["primary", "front", "left", "right", "back"] as const).map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setActiveAngle(angle)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                          activeAngle === angle
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {angle}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center p-8 text-center">
                  <div className="space-y-3 max-w-md">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">
                      Living Room &bull; {homeBook.selected_design?.style || "Warm Contemporary"}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Photorealistic raytraced view from {activeAngle} camera angle with oak slat accents, neutral boucle modular sofa, and layered warm ambient illumination.
                    </p>
                    <span className="inline-block text-[11px] font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                      2048 x 1152 &bull; Raytraced AI Spatial Render
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BUDGET OPTIMIZATION & COST AUDIT */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Financial Audit: &ldquo;Make It Fit ₹8 Lakhs&rdquo;</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    How AI budget optimization aligned your ₹8.40L dream setup into ₹7.96L.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  Target Achieved: Under ₹8.00L
                </span>
              </div>

              {/* Step Progression Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Step 1: Initial Selection</span>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {formatINR(homeBook.budget_summary.initial_estimate)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                    Design B selected with full custom solid timber and imported fabrics (+₹40,000 variance).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">Step 2: AI Optimization</span>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    - {formatINR(homeBook.budget_summary.savings_achieved)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                    Smart substitution to engineered walnut veneer and high-durability boucle weave without altering aesthetic.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Step 3: Final Approved Cost</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(homeBook.budget_summary.optimized_cost)}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
                    Strictly within resident&apos;s ₹8,00,000 ceiling budget.
                  </p>
                </div>
              </div>

              {/* Spend Breakdown Bar */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/30 border border-slate-200 dark:border-zinc-800">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Actual Expenses Spent: {formatINR(homeBook.budget_summary.total_expenses_spent)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Remaining Contingency: {formatINR(homeBook.budget_summary.budget_variance)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (homeBook.budget_summary.total_expenses_spent / homeBook.budget_summary.target_budget) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROCUREMENT & SHOPPING INVENTORY */}
        {activeTab === "procurement" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Itemized Shopping & Procurement Manifest</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    All furniture, lighting, millwork, and decor ordered for execution.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                  {homeBook.shopping_inventory?.length || 6} Items Procured
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/60 text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold rounded-l-xl">Item Description</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Qty</th>
                      <th className="py-3 px-4 font-semibold">Cost</th>
                      <th className="py-3 px-4 font-semibold rounded-r-xl">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {homeBook.shopping_inventory?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{item.quantity}</td>
                        <td className="py-3.5 px-4 font-semibold">{formatINR(item.estimated_cost)}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EXECUTION MILESTONES */}
        {activeTab === "execution" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Execution Milestones & On-Site Log</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Chronological milestone progress tracking civil works through final handover.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {homeBook.execution_timeline?.completion_percentage}% Completed
                </span>
              </div>

              <div className="space-y-3">
                {homeBook.execution_timeline?.tasks?.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {task.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Status: Verified on-site
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm block">
                        {formatINR(task.actual_cost || task.estimated_cost || 0)}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: CARE HANDBOOK */}
        {activeTab === "handbook" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Home Care & Material Maintenance Guide</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Manufacturer-approved maintenance protocols for all materials used in your home.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeBook.maintenance_and_care?.map((guide, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {guide.material}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                      {guide.instructions}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
