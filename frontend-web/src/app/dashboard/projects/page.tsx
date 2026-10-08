"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateHomeCard } from "@/components/dashboard/CreateHomeCard";
import { Project } from "@/types";
import { projectApi } from "@/lib/projects";
import { Sparkles, Plus, Layers } from "lucide-react";

export default function ProjectsDashboardPage() {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("homeverse_projects");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      let localList: Project[] = [];
      try {
        const raw = localStorage.getItem("homeverse_projects");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localList = parsed;
        }
      } catch (_) {}

      try {
        const data = await projectApi.getProjects();
        if (data && data.length > 0) {
          // Merge unique projects with local ones taking priority
          const map = new Map<string, Project>();
          localList.forEach((p) => map.set(p.id, p));
          data.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          setProjects(Array.from(map.values()));
        } else if (localList.length > 0) {
          setProjects(localList);
        } else {
          setProjects([
            {
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
            },
          ]);
        }
      } catch {
        if (localList.length > 0) {
          setProjects(localList);
        } else {
          setProjects([
            {
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
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 relative overflow-hidden flex flex-col justify-between">
      {/* Background Architectural Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-105 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/75 to-[#06090e]/90" />
      </div>

      <div className="relative z-30">
        <Navbar />
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RESIDENTIAL PORTFOLIO</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-editorial">
              All Residential Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
              Filter, organize, and manage your multi-floor digital twins.
            </p>
          </div>

          <Link
            href="/home/new"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Residence</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateHomeCard onClick={() => (window.location.href = "/home/new")} />
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10 mt-12">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}
