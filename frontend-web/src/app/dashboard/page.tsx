"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateHomeCard } from "@/components/dashboard/CreateHomeCard";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { Project, Budget } from "@/types";
import { projectApi } from "@/lib/projects";
import { budgetApi } from "@/lib/budgets";
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
} from "lucide-react";
import { formatIndianBudget } from "@/lib/utils";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStyle, setFilterStyle] = useState<"all" | "villa" | "apartment">("all");

  useEffect(() => {
    setUser(getStoredUser());

    async function loadData() {
      try {
        const data = await projectApi.getProjects();
        if (data && data.length > 0) {
          setProjects(data);
          const bData = await budgetApi.getProjectBudget(data[0].id);
          setActiveBudget(bData);
        } else {
          // Fallback canonical demo project
          const defaultProj: Project = {
            id: "p1-demo",
            name: "Modern Luxury Villa Residence",
            home_type: "villa",
            floors_count: 2,
            total_rooms: 5,
            total_budget: 1500000,
            currency: "INR",
            budget_flexibility: "moderate",
            design_style: "Japandi",
            created_at: new Date().toISOString(),
          };
          setProjects([defaultProj]);
          setActiveBudget({
            id: "b1",
            project_id: defaultProj.id,
            total_budget: 1500000,
            spent_amount: 980000,
            remaining_amount: 520000,
            currency: "INR",
            flexibility: "moderate",
          });
        }
      } catch (err) {
        console.warn("Using default catalog", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeProject = projects[0];

  const filteredProjects = projects.filter((p) => {
    if (filterStyle === "all") return true;
    return (p.home_type || "").toLowerCase().includes(filterStyle);
  });

  const totalPortfolioBudget = projects.reduce(
    (sum, p) => sum + (p.total_budget || p.budget || 1500000),
    0
  );

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 relative overflow-hidden flex flex-col justify-between">
      {/* Background Architectural Canvas & Ambient Lighting (matching Landing & Login) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-105 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        {/* Ambient Glowing Orbs */}
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
              Inspect multi-floor digital twins, control Indian room-by-room budget envelopes, and switch real-time Japandi materials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
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
          </div>
        </div>

        {/* Quick Intelligence Ribbon (Matching Landing Page Metrics) */}
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
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {formatIndianBudget(totalPortfolioBudget)}
            </div>
          </div>

          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Design Architecture
            </span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1 truncate">
              {activeProject?.design_style || "Japandi"} Parity
            </div>
          </div>

          <div className="glass-morphism-card rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              RERA Guardrails
            </span>
            <div className="text-xl font-bold text-white font-mono mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Locked</span>
            </div>
          </div>
        </div>

        {/* Spotlight Active House Project */}
        {activeProject && (
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
                  {activeProject.name}
                </h2>

                <p className="text-xs text-slate-400 font-mono">
                  {activeProject.home_type?.toUpperCase()} · {activeProject.floors_count || 2} Floors · {activeProject.design_style || "Japandi"} Architectural DNA · {activeProject.total_rooms || 5} Rooms
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
              {activeBudget && (
                <BudgetSummary
                  projectName={activeProject.name}
                  projectId={activeProject.id}
                  totalBudget={activeBudget.total_budget || 1500000}
                  spentAmount={activeBudget.spent_amount || 980000}
                  remainingAmount={activeBudget.remaining_amount || 520000}
                  currency={activeBudget.currency || "INR"}
                  flexibility={activeBudget.flexibility || "moderate"}
                  totalRooms={activeProject.total_rooms || 5}
                  completionPercentage={78}
                />
              )}

              <ProgressCard
                completedRooms={3}
                totalRooms={activeProject.total_rooms || 5}
                activeDesignStyle={activeProject.design_style || "Japandi"}
                overallProgress={78}
                designProgress={85}
                procurementProgress={60}
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
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10 mt-12">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}
