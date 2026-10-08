"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { projectApi } from "@/lib/projects";
import { floorApi } from "@/lib/floors";
import { roomApi } from "@/lib/rooms";
import { budgetApi } from "@/lib/budgets";
import { formatIndianBudget } from "@/lib/utils";
import { Project, Floor, Room, Budget } from "@/types";
import {
  getStoredProject,
  getStoredProjectFloors,
  getStoredProjectRooms,
  getStoredProjectBudget,
} from "@/lib/projectStorage";
import {
  Home,
  Layers,
  DoorOpen,
  IndianRupee,
  ShoppingBag,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Box,
  Eye,
  Wand2,
} from "lucide-react";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Immediately read user's authentic project data from browser storage
      const storedProj = getStoredProject(projectId);
      const storedFloors = getStoredProjectFloors(projectId);
      const storedRooms = getStoredProjectRooms(projectId);
      const storedBudget = getStoredProjectBudget(projectId);

      if (storedProj) {
        setProject({
          id: storedProj.id || projectId,
          name: storedProj.name || "Custom Architectural Project",
          home_type: storedProj.home_type || "apartment",
          floors_count: storedProj.floors_count || (storedFloors.length > 0 ? storedFloors.length : 1),
          total_rooms: storedProj.total_rooms || (storedRooms.length > 0 ? storedRooms.length : 0),
          total_budget: storedProj.total_budget || 1500000,
          currency: storedProj.currency || "INR",
          budget_flexibility: storedProj.budget_flexibility || "moderate",
          design_style: storedProj.design_style || "Japandi",
          created_at: storedProj.created_at || new Date().toISOString(),
          updated_at: storedProj.updated_at || new Date().toISOString(),
        });
        if (storedFloors.length > 0) setFloors(storedFloors);
        if (storedRooms.length > 0) setRooms(storedRooms);
        if (storedBudget) setBudget(storedBudget);
        setLoading(false);
      }

      // 2. Try fetching from backend API if online (only override if no local authentic project)
      try {
        const projData = await projectApi.getProject(projectId);
        if (projData && projData.id && projData.name && !projData.name.includes("Demo Project") && !storedProj) {
          setProject(projData);

          const floorsData = await floorApi.getFloorsByProject(projectId);
          if (floorsData && floorsData.length > 0) {
            setFloors(floorsData);
            const allRooms: Room[] = [];
            for (const f of floorsData) {
              const flRooms = await roomApi.getRoomsByFloor(f.id);
              allRooms.push(...flRooms);
            }
            if (allRooms.length > 0) {
              setRooms(allRooms);
            }
          }

          const budgetData = await budgetApi.getProjectBudget(projectId);
          if (budgetData) {
            setBudget(budgetData);
          }
        }
      } catch (err) {
        console.warn("Backend API offline or returning fallback, using stored user project:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const navCards = [
    {
      title: "Interactive 3D Walkthrough",
      desc: "Walk room-by-room across all floors in first-person 3D CAD mode.",
      href: `/project/${projectId}/walkthrough`,
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      tag: "SPATIAL 3D",
    },
    {
      title: "Budget & Value Engineering",
      desc: "Track allocations, simulate what-if alterations, and run AI cost optimization.",
      href: `/project/${projectId}/budget`,
      icon: <IndianRupee className="w-5 h-5 text-teal-400" />,
      tag: "FINANCIAL OS",
    },
    {
      title: "Itemized Shopping & Procurement",
      desc: "Order verified catalog products with real Indian vendor links and prices.",
      href: `/project/${projectId}/shopping`,
      icon: <ShoppingBag className="w-5 h-5 text-cyan-400" />,
      tag: "VENDORS",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        {/* Project Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase">
                {project?.home_type || "RESIDENCE"}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                {project?.design_style || "Japandi"} DNA
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
                ID: {projectId.slice(0, 8)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {project?.name || "Project Overview"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 font-light max-w-xl">
              Unified spatial architecture model spanning {floors.length} floor level(s) and {rooms.length} room scene(s) under an established budget.
            </p>
          </div>

          {/* Budget & Level Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-w-36 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Target Budget</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {formatIndianBudget(budget?.total_budget || 1500000)}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 capitalize">
                Flexibility: {budget?.flexibility || "Moderate"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-w-32 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Floors</div>
              <div className="text-xl font-bold text-white mt-1">{floors.length}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Vertical Levels</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-w-32 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Rooms</div>
              <div className="text-xl font-bold text-white mt-1">{rooms.length}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">3D Twins</div>
            </div>
          </div>
        </div>

        {/* Primary Action Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navCards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {c.icon}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Open Section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Floors & Rooms Hierarchy */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>House Hierarchy: Floors & Rooms</span>
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Select any floor or individual room to launch its 3D design playground.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {floors.map((floor, fIdx) => {
              let floorRooms = rooms.filter((r) => r.floor_id === floor.id);
              if (floorRooms.length === 0) {
                if (floors.length === 1) {
                  floorRooms = rooms;
                } else {
                  const perFl = Math.ceil(rooms.length / floors.length);
                  const start = fIdx * perFl;
                  floorRooms = rooms.slice(start, start + perFl);
                }
              }

              return (
                <div
                  key={floor.id}
                  className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                        L{floor.level}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">
                          {floor.name || `Level ${floor.level}`}
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          {floorRooms.length} Room(s)
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/project/${projectId}/floors/${floor.id}`}
                      className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Manage Floor</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {floorRooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {room.name}
                          </h4>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {room.width_meters || room.width}m × {room.length_meters || room.length}m ({room.area_sqm || Math.round((room.area || 100) / 10.764)}m²)
                          </div>
                        </div>

                        <Link
                          href={`/project/${projectId}/rooms/${room.id}/playground`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-emerald-500 text-slate-300 group-hover:text-slate-950 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>3D</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
