"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  FolderOpen, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  LogOut,
  LayoutGrid,
  Plus,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Activity,
  Layers,
  Wand2,
  Box
} from "lucide-react";

interface Design {
  id: string;
  style: string;
  image_url: string;
  selected: boolean;
}

interface Project {
  id: string;
  title: string;
  room_type: string;
  thumbnail: string;
  created_at: string;
  lastEdited?: string;
  spatialScore?: number;
  completeness?: number;
  budgetAdherence?: number;
  designs: Design[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user session and projects
  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (!userSession) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userSession);
    setCurrentUser(parsedUser);

    // Initial mock projects with SaaS workspace health stats
    setProjects([
      {
        id: "proj-1",
        title: "Sunset Boulevard Living Space",
        room_type: "Living Room",
        thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400",
        created_at: new Date().toISOString(),
        lastEdited: "Edited 2h ago",
        spatialScore: 96,
        completeness: 92,
        budgetAdherence: 94,
        designs: [
          { id: "des-1", style: "Japandi", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=400", selected: true },
          { id: "des-2", style: "Modern Luxury", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400", selected: false },
        ],
      },
      {
        id: "proj-2",
        title: "Master Suite Sanctuary",
        room_type: "Master Bedroom",
        thumbnail: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=400",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        lastEdited: "Edited 1d ago",
        spatialScore: 94,
        completeness: 88,
        budgetAdherence: 98,
        designs: [
          { id: "des-3", style: "Scandinavian", image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400", selected: true },
        ],
      },
      {
        id: "proj-3",
        title: "Minimalist Culinary Kitchen",
        room_type: "Kitchen & Dining",
        thumbnail: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        lastEdited: "Edited 3d ago",
        spatialScore: 91,
        completeness: 85,
        budgetAdherence: 90,
        designs: [
          { id: "des-4", style: "Modern", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400", selected: true },
        ],
      },
    ]);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this space?")) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const recentActivity = [
    { time: "12:42 PM", action: "Changed living room flooring to European White Oak", icon: "🪵" },
    { time: "12:38 PM", action: "Added IKEA KIVIK 3-seat sectional to 3D scene", icon: "🛋️" },
    { time: "12:31 PM", action: "Generated Japandi locked-coordinate variation", icon: "🎨" },
    { time: "11:15 AM", action: "Executed spatial clearance audit (96% score)", icon: "✓" },
    { time: "Yesterday", action: "Exported scene graph to Three.js JSON & Blender .py", icon: "📤" },
  ];

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="h-16 px-6 lg:px-12 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
            <span>HOMEVERSE</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-normal">Workspace Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Space</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-12">
        
        {/* Welcome Greeting & Summary Card */}
        <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>SPATIAL DESIGN OS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Good morning, {currentUser?.name ? currentUser.name.split(" ")[0] : "Creator"}.
            </h1>
            <p className="text-slate-400 text-sm font-light">
              You have <span className="text-emerald-400 font-bold">{projects.length} active digital twin spaces</span> ready for CAD editing and AI copilot transformations.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">SPATIAL ACCURACY</div>
              <div className="text-base font-bold text-emerald-400 mt-1">94.8%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">BUDGET ADHERENCE</div>
              <div className="text-base font-bold text-white mt-1">92.4%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">PLAN TIER</div>
              <div className="text-base font-bold text-cyan-400 mt-1">Pro Studio</div>
            </div>
          </div>
        </div>

        {/* Section: Your Spaces Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                YOUR SPACES
              </h2>
              <p className="text-xs text-slate-400 font-sans font-light">
                Interactive 3D digital twins and room configurations.
              </p>
            </div>
            <button
              onClick={() => router.push("/upload")}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>+ Create New Room</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Project Cards */}
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all shadow-xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Thumbnail Image */}
                <div className="relative h-48 overflow-hidden border-b border-slate-800">
                  <img
                    src={proj.thumbnail}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-white/10">
                    {proj.room_type}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-300 border border-white/10">
                    {proj.lastEdited}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                      {proj.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-1">
                      <span>{proj.designs.length} Design Variations</span>
                      <span>•</span>
                      <span className="text-emerald-400">Score {proj.spatialScore}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                    <button
                      onClick={() => router.push(`/studio?projectId=${proj.id}&style=${proj.designs[0]?.style || "Modern"}`)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <span>Open 3D Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Space"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* "+ New Project" Card */}
            <div
              onClick={() => router.push("/upload")}
              className="rounded-3xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer group bg-[#070b10]/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-base font-mono">Create New Space</div>
                <p className="text-xs text-slate-400 font-light max-w-xs">
                  Upload photo, scan video walkthrough, or start with a 5-step floorplan wizard.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Section: Recent Activity Timeline Stream */}
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <h2 className="text-xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            RECENT ACTIVITY TIMELINE
          </h2>

          <div className="rounded-3xl bg-[#090e15] border border-white/[0.08] p-6 space-y-3 font-mono text-xs">
            {recentActivity.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{act.icon}</span>
                  <span className="font-sans font-light text-slate-200">{act.action}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
}
