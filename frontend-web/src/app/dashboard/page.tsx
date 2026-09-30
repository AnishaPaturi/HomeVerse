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
import {
  Home,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  BookOpen,
} from "lucide-react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await projectApi.getProjects();
        if (data && data.length > 0) {
          setProjects(data);
          const bData = await budgetApi.getProjectBudget(data[0].id);
          setActiveBudget(bData);
        } else {
          // Fallback mock
          const defaultProj: Project = {
            id: "p1-demo",
            name: "Modern Family Residence",
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

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SPATIAL CAD OS DASHBOARD</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              Architecture & Home Projects
            </h1>
            <p className="text-xs text-slate-400 font-light">
              Manage multi-floor spatial plans, real-time Indian budget allocations, and 3D digital twins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home/new"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Start New Home</span>
            </Link>
          </div>
        </div>

        {/* Spotlight Active House Project */}
        {activeProject && (
          <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                  <Home className="w-3 h-3" />
                  <span>ACTIVE RESIDENCE</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {activeProject.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {activeProject.home_type?.toUpperCase()} · {activeProject.floors_count || 2} Floors · {activeProject.design_style || "Japandi"} DNA
                </p>
              </div>

              <Link
                href={`/project/${activeProject.id}`}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-white rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>

            {/* Metrics: Budget Summary & Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBudget && (
                <BudgetSummary
                  totalBudget={activeBudget.total_budget || 1500000}
                  spentAmount={activeBudget.spent_amount || 980000}
                  remainingAmount={activeBudget.remaining_amount || 520000}
                  currency={activeBudget.currency || "INR"}
                  flexibility={activeBudget.flexibility || "moderate"}
                />
              )}

              <ProgressCard
                overallProgress={78}
                designProgress={85}
                procurementProgress={60}
                completedRooms={3}
                totalRooms={activeProject.total_rooms || 5}
              />
            </div>
          </div>
        )}

        {/* All Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">
              All Configured Residences
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {projects.length} Total Project(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CreateHomeCard onClick={() => (window.location.href = "/home/new")} />
            {projects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
