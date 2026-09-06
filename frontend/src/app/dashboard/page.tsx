"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Project } from "@/types";
import { fetchApi } from "@/lib/api";
import {
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingDown,
  Layers,
  ArrowRight,
  Lightbulb,
  Plus,
  BookOpen
} from "lucide-react";

const DEMO_PROJECTS: Project[] = [
  {
    id: "p1-demo",
    user_id: "u1",
    name: "Serene 2BHK Urban Apartment",
    property_type: "apartment",
    bhk: 2,
    area_sqft: 1120,
    budget: 800000,
    currency: "INR",
  },
  {
    id: "p2-demo",
    user_id: "u1",
    name: "Skyline Residency 3BHK",
    property_type: "apartment",
    bhk: 3,
    area_sqft: 1650,
    budget: 1200000,
    currency: "INR",
  },
  {
    id: "p3-demo",
    user_id: "u1",
    name: "Palm Grove Villa",
    property_type: "villa",
    bhk: 4,
    area_sqft: 2800,
    budget: 2500000,
    currency: "INR",
  },
];

interface RoomStatus {
  name: string;
  status: "completed" | "in_progress" | "pending";
  progress?: string;
}

const CANONICAL_ROOMS: RoomStatus[] = [
  { name: "Living Room", status: "completed" },
  { name: "Kitchen", status: "completed" },
  { name: "Master Bedroom", status: "completed" },
  { name: "Bedroom 2", status: "in_progress", progress: "60%" },
  { name: "Bathroom", status: "pending" },
  { name: "Balcony", status: "pending" },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchApi<Project[]>("/api/projects");
        if (data && data.length > 0) {
          // Merge real projects with demo if needed or set directly
          setProjects(data);
        }
      } catch (err) {
        console.warn("Using default project catalog", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const activeProject = projects[0] || DEMO_PROJECTS[0];

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Home Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Real-time design intelligence, space planning, budget optimization, and milestone progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/project/${activeProject.id}/home-book`}
              className="px-4 py-2 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              Digital Home Book
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Create New Project
            </Link>
          </div>
        </div>

        {/* Phase 22 & 47 MVP Spotlight: MY HOME */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-200 dark:border-indigo-800/80">
                <Home className="w-3.5 h-3.5" />
                MY HOME &bull; ACTIVE WORKSPACE
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">{activeProject.name}</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {activeProject.bhk || 2} BHK &bull; {activeProject.area_sqft || 1120} sq ft &bull; {activeProject.property_type || "Apartment"}
              </p>
            </div>

            <Link
              href={`/project/${activeProject.id}`}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 self-start lg:self-center"
            >
              <span>Open Project Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Budget Financials Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
              <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Budget</span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                {formatINR(activeProject.budget || 800000)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
              <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Estimated</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ₹7,72,000
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
              <span className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">Spent</span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                ₹5,21,000
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">Remaining</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹2,79,000
              </span>
            </div>
          </div>

          {/* Progress Indicators & Rooms Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Progress Bars */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-gray-700 dark:text-zinc-300">Design Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">80%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: "80%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-gray-700 dark:text-zinc-300">Project Progress</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">70%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: "70%" }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Space Optimization
                </span>
                <p className="text-gray-600 dark:text-zinc-300">
                  Living room design optimized to fit under ₹8L budget cap with ₹44,000 savings achieved.
                </p>
              </div>
            </div>

            {/* Rooms Status Checklist */}
            <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Rooms Status
              </h3>
              <div className="space-y-2.5 text-xs">
                {CANONICAL_ROOMS.map((room) => (
                  <div
                    key={room.name}
                    className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-800/60 last:border-0"
                  >
                    <span className="font-semibold text-gray-800 dark:text-zinc-200">{room.name}</span>
                    {room.status === "completed" && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    )}
                    {room.status === "in_progress" && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                        {room.progress}
                      </span>
                    )}
                    {room.status === "pending" && (
                      <span className="text-gray-400 font-medium">&mdash;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Decision Interactive Prompt */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-pink-50/20 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-pink-950/10 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Next Decision Required
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                  Choose your bedroom lighting
                </h4>
                <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1">
                  AI has formulated 3 illumination schemes matching your Warm Contemporary style DNA:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { id: "A", name: "Option A", desc: "Recessed Warm 2700K" },
                  { id: "B", name: "Option B", desc: "Sconces + Pendants" },
                  { id: "C", name: "Option C", desc: "Cove Halo Accent" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedDecision(opt.id)}
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      selectedDecision === opt.id
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 text-gray-900 dark:text-white"
                    }`}
                  >
                    <span className="font-bold text-xs block">{opt.name}</span>
                    <span className="text-[10px] opacity-80 block leading-tight mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {selectedDecision && (
                <div className="mt-3 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Option {selectedDecision} selected and queued for procurement.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Projects Gallery */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">All Configured Projects</h3>
            <span className="text-xs text-gray-500 dark:text-zinc-400">{projects.length} Total Spaces</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
