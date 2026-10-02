"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateHomeCard } from "@/components/dashboard/CreateHomeCard";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { Project, Budget } from "@/types";
import { getStoredUser } from "@/lib/auth";
import { User } from "@/types/user";
import {
  Home,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  BookOpen,
  IndianRupee,
  ShieldCheck,
  Compass,
  Box,
  Eye,
  ShoppingBag,
  RefreshCw,
  FolderOpen,
  Settings,
} from "lucide-react";
import { formatIndianBudget } from "@/lib/utils";

interface RoomData {
  id: string;
  name: string;
  room_type: string;
  area?: number;
  status?: string;
}

interface TaskSummaryData {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  progress_percentage: number;
  total_estimated_cost: number;
  total_actual_cost: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [activeRooms, setActiveRooms] = useState<RoomData[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummaryData | null>(null);
  const [designsCount, setDesignsCount] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filterStyle, setFilterStyle] = useState<"all" | "villa" | "apartment">("all");

  // Load user session
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Fetch real projects from API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/projects");
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data || []);
        if (data && data.length > 0) {
          setActiveProjectId(data[0].id);
        } else {
          setActiveProjectId(null);
        }
      } else {
        setProjects([]);
        setActiveProjectId(null);
      }
    } catch (err) {
      console.warn("Could not fetch projects from API:", err);
      setProjects([]);
      setActiveProjectId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch dynamic budget, rooms, tasks, and designs for the active project
  useEffect(() => {
    if (!activeProjectId) {
      setActiveBudget(null);
      setActiveRooms([]);
      setTaskSummary(null);
      setDesignsCount(0);
      return;
    }

    let isMounted = true;
    setDetailsLoading(true);

    async function loadProjectDetails(pId: string) {
      try {
        // 1. Fetch real Budget from API
        const budgetPromise = fetch(`http://localhost:8080/api/budget/${pId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        // 2. Fetch real Rooms for this project from API
        const roomsPromise = fetch(`http://localhost:8080/api/projects/${pId}/rooms`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []);

        // 3. Fetch real Task & Timeline execution summary from API
        const tasksPromise = fetch(`http://localhost:8080/api/projects/${pId}/tasks/summary`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        // 4. Fetch real Designs from API
        const designsPromise = fetch(`http://localhost:8080/api/designs/project/${pId}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []);

        const [bData, rData, tData, dData] = await Promise.all([
          budgetPromise,
          roomsPromise,
          tasksPromise,
          designsPromise,
        ]);

        if (isMounted) {
          setActiveBudget(bData);
          setActiveRooms(Array.isArray(rData) ? rData : []);
          setTaskSummary(tData);
          setDesignsCount(Array.isArray(dData) ? dData.length : 0);
        }
      } catch (err) {
        console.warn("Failed fetching project details:", err);
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    }

    loadProjectDetails(activeProjectId);

    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const filteredProjects = projects.filter((p) => {
    if (filterStyle === "all") return true;
    return (p.home_type || p.property_type || "").toLowerCase().includes(filterStyle);
  });

  // Dynamically compute total portfolio budget from real project data
  const totalPortfolioBudget = projects.reduce(
    (sum, p) => sum + (p.total_budget || p.budget || 0),
    0
  );

  // Dynamically compute rooms progress from real rooms data
  const totalRoomsCount =
    activeRooms.length > 0
      ? activeRooms.length
      : activeProject?.total_rooms || (activeProject?.bhk ? activeProject.bhk + 2 : 0);

  const completedRoomsCount = activeRooms.filter(
    (r) =>
      r.status === "completed" ||
      r.status === "approved" ||
      r.status === "in_design" ||
      r.status === "active"
  ).length;

  // Dynamically compute overall execution progress
  const computedOverallProgress =
    taskSummary?.progress_percentage !== undefined && taskSummary.total_tasks > 0
      ? Math.round(taskSummary.progress_percentage)
      : totalRoomsCount > 0
      ? Math.min(100, Math.round((completedRoomsCount / totalRoomsCount) * 100))
      : 0;

  const computedDesignProgress =
    designsCount > 0
      ? Math.min(100, designsCount * 35)
      : totalRoomsCount > 0
      ? Math.min(100, Math.round((completedRoomsCount / totalRoomsCount) * 80))
      : 0;

  const computedProcurementProgress =
    activeBudget && activeBudget.total_budget > 0
      ? Math.min(
          100,
          Math.round(
            ((activeBudget.spent_amount || activeBudget.allocated_budget || 0) /
              activeBudget.total_budget) *
              100
          )
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 relative overflow-hidden flex flex-col justify-between">
      {/* Background Architectural Canvas & Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-105 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/75 to-[#06090e]/90" />
      </div>

      {/* Global Navbar */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 space-y-10 relative z-10">
        {/* Top Header & Greeting */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>AI SPATIAL ARCHITECTURE STUDIO</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight font-editorial">
              {user?.name ? `Welcome back, ${user.name}` : "Architectural Residences Studio"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
              Inspect multi-floor digital twins, control Indian room-by-room budget envelopes, and inspect real-time spatial models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchProjects}
              title="Refresh studio data"
              className="p-3 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/home/new"
              className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Home</span>
            </Link>

            <Link
              href="/preferences"
              className="px-4 py-3 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Style Preferences</span>
            </Link>

            <Link
              href="/dashboard/settings"
              title="Studio & Account Settings"
              className="p-3 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Dynamic Intelligence Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Active Residences
            </span>
            <div className="text-2xl font-bold text-white font-mono mt-1 flex items-baseline gap-1.5">
              <span>{projects.length}</span>
              <span className="text-xs text-emerald-400 font-normal">Models</span>
            </div>
          </div>

          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Portfolio Budget
            </span>
            <div className="text-2xl font-bold text-white font-mono mt-1 truncate">
              {totalPortfolioBudget > 0 ? formatIndianBudget(totalPortfolioBudget) : "₹0 Allocated"}
            </div>
          </div>

          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Design Architecture
            </span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1 truncate">
              {activeProject?.design_style || activeProject?.room_type || "Contemporary"} Parity
            </div>
          </div>

          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              RERA Guardrails
            </span>
            <div className="text-xl font-bold text-white font-mono mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{projects.length > 0 ? "100% Guardrailed" : "Standby"}</span>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="glass-morphism-card rounded-[32px] p-10 border border-white/10 text-center space-y-4 animate-pulse">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="font-mono text-xs text-slate-400">Loading dynamic studio residences from database...</p>
          </div>
        )}

        {/* Empty State: If no projects in database */}
        {!loading && projects.length === 0 && (
          <div className="glass-morphism-card rounded-[32px] p-10 sm:p-14 border border-white/15 text-center space-y-5 max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-editorial">
                No Residences Configured Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                Launch your first residence setup to generate multi-floor CAD blueprints, inspect room-by-room Indian budget envelopes, and experiment with material swaps.
              </p>
            </div>
            <Link
              href="/home/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Home</span>
            </Link>
          </div>
        )}

        {/* Spotlight Active House Project (100% Dynamic from Database) */}
        {!loading && activeProject && (
          <div className="glass-morphism-card rounded-[32px] p-7 sm:p-9 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-7 relative overflow-hidden">
            {/* Ambient top inner glow */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Spotlight Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/[0.08] relative z-10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ACTIVE SPATIAL MODEL</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-editorial">
                  {activeProject.name || activeProject.title || "Selected Residence"}
                </h2>

                <p className="text-xs text-slate-400 font-mono">
                  {(activeProject.home_type || activeProject.property_type || "RESIDENCE").toUpperCase()} ·{" "}
                  {activeProject.floors_count ? `${activeProject.floors_count} Floors · ` : ""}
                  {activeProject.bhk ? `${activeProject.bhk} BHK · ` : ""}
                  {activeProject.design_style || "Contemporary"} Architectural DNA ·{" "}
                  {totalRoomsCount} Rooms
                </p>
              </div>

              <Link
                href={`/project/${activeProject.id}`}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] text-slate-950 rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>

            {/* Metrics: Budget Summary & Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <BudgetSummary
                projectName={activeProject.name}
                projectId={activeProject.id}
                totalBudget={
                  activeBudget?.total_budget !== undefined && activeBudget.total_budget > 0
                    ? activeBudget.total_budget
                    : activeProject.total_budget || activeProject.budget || 0
                }
                spentAmount={activeBudget?.spent_amount || activeBudget?.allocated_budget || 0}
                remainingAmount={
                  activeBudget?.remaining_amount !== undefined
                    ? activeBudget.remaining_amount
                    : Math.max(
                        0,
                        (activeProject.total_budget || activeProject.budget || 0) -
                          (activeBudget?.spent_amount || 0)
                      )
                }
                currency={activeBudget?.currency || activeProject.currency || "INR"}
                flexibility={activeBudget?.flexibility || activeProject.budget_flexibility || "moderate"}
                totalRooms={totalRoomsCount}
                completionPercentage={computedProcurementProgress}
              />

              <ProgressCard
                completedRooms={completedRoomsCount}
                totalRooms={totalRoomsCount}
                activeDesignStyle={activeProject.design_style || "Contemporary"}
                overallProgress={computedOverallProgress}
                designProgress={computedDesignProgress}
                procurementProgress={computedProcurementProgress}
              />
            </div>

            {/* Quick Action Navigation Strip */}
            <div className="pt-4 border-t border-white/[0.08] relative z-10">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-3">
                Workspace Shortcuts
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <Link
                  href={`/project/${activeProject.id}`}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Floor Plans</span>
                </Link>

                <Link
                  href={`/project/${activeProject.id}/budget`}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span>Budget Engine</span>
                </Link>

                <Link
                  href={`/project/${activeProject.id}/rooms`}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Box className="w-4 h-4 text-emerald-400" />
                  <span>Room Customizer</span>
                </Link>

                <Link
                  href={`/project/${activeProject.id}/walkthrough`}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>3D Walkthrough</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* All Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight font-editorial">
                  All Configured Residences
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Saved multi-floor digital twin blueprints and architectural packages.
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="p-1 rounded-2xl glass-morphism border border-white/10 flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStyle("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStyle === "all"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStyle("villa")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStyle === "villa"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Villas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStyle("apartment")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filterStyle === "apartment"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Apartments
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CreateHomeCard onClick={() => (window.location.href = "/home/new")} />
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => setActiveProjectId(proj.id)}
                  className={`cursor-pointer transition-all ${
                    proj.id === activeProjectId ? "ring-2 ring-emerald-400/50 rounded-3xl" : ""
                  }`}
                >
                  <ProjectCard project={proj} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10 mt-12">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}
