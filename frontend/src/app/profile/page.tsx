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
  LayoutGrid
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
  designs: Design[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Load user session and projects
  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (!userSession) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userSession);
    setCurrentUser(parsedUser);

    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      
      const userId = parsedUser.id || "00000000-0000-0000-0000-000000000000";

      try {
        const res = await fetch(`http://localhost:8080/api/projects/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        } else {
          throw new Error("Failed to load projects");
        }
      } catch (err) {
        console.warn("Backend unavailable, loading mock local projects:", err);
        // Fallback mock projects for development
        setProjects([
          {
            id: "mock-proj-1",
            title: "Cozy Living Room Redesign",
            room_type: "Living Room",
            thumbnail: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350",
            created_at: new Date().toISOString(),
            designs: [
              { id: "mock-design-1", style: "Japandi", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350", selected: true },
              { id: "mock-design-2", style: "Scandinavian", image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350", selected: false },
              { id: "mock-design-3", style: "Luxury", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350", selected: false }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
    router.refresh();
  };

  // Upgrade Plan Toggle
  const handleUpgradePlan = async () => {
    if (!currentUser) return;
    setUpgrading(true);
    setError(null);

    const nextPlan = currentUser.plan === "Premium" ? "Free" : "Premium";

    try {
      // Try hitting registration route to update backend (or custom route if existed)
      // For simplicity in MVP, we save locally and try registering user again
      try {
        await fetch("http://localhost:8080/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentUser.name,
            email: currentUser.email,
            plan: nextPlan
          })
        });
      } catch (backendErr) {
        console.warn("Backend offline, skipping server plan update:", backendErr);
      }

      // Update session storage
      const updatedUser = { ...currentUser, plan: nextPlan };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (err) {
      setError("Failed to update plan.");
    } finally {
      setUpgrading(false);
    }
  };

  // Delete Project handler
  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project and all its designs?")) {
      // Delete locally first
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      // Delete on backend
      if (!projectId.startsWith("mock-")) {
        try {
          await fetch(`http://localhost:8080/api/projects/${projectId}`, {
            method: "DELETE"
          });
        } catch (err) {
          console.warn("Failed to delete project on backend:", err);
        }
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 font-mono text-xs">
        <div className="animate-pulse">Loading profile session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-200">
              User Profile
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-850 hover:bg-slate-900 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* Main Profile Frame */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start relative z-10">
        
        {/* Left Side: Profile Card */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="glass-panel border-slate-800 rounded-3xl p-6 space-y-6">
            
            {/* Avatar Circle */}
            <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-slate-800/60">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-500/10">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{currentUser.name || "HomeVerse User"}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  currentUser.plan === "Premium" 
                    ? "bg-amber-950/40 text-amber-400 border-amber-900/50" 
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}>
                  {currentUser.plan === "Premium" ? "🏆 PREMIUM MEMBER" : "FREE TIER"}
                </span>
              </div>
            </div>

            {/* Info details */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-350">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Email Address</div>
                  <div className="text-slate-300 font-medium truncate">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-350">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Session Registered</div>
                  <div className="text-slate-300 font-medium">
                    {currentUser.isDemo ? "Live Development Sandbox" : "Standard Registered User"}
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={handleUpgradePlan}
              disabled={upgrading}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                currentUser.plan === "Premium"
                  ? "bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300"
                  : "bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/10"
              }`}
            >
              {upgrading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : currentUser.plan === "Premium" ? (
                "Downgrade to Free tier"
              ) : (
                <>Upgrade to Premium <Sparkles className="w-3.5 h-3.5" /></>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-[10px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Saved Projects Portfolio */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-200">
              <FolderOpen className="w-5 h-5 text-blue-400" /> Saved Design Projects
            </h2>
            <span className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-400 font-mono">
              Count: {projects.length}
            </span>
          </div>

          {loading ? (
            <div className="glass-panel border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs animate-pulse font-mono">
              Loading saved projects from database...
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-panel border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <LayoutGrid className="w-10 h-10 text-slate-800 mx-auto" />
              <p className="text-sm font-semibold">No saved projects found</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                Try uploading a room scan on our homepage to populate design options and save them to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="glass-panel border-slate-800/80 rounded-3xl p-5 space-y-4 hover:border-slate-700/60 transition-colors">
                  
                  {/* Project Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-900/60">
                    <div>
                      <h3 className="font-bold text-slate-100">{project.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                        <span className="capitalize">Room: {project.room_type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-red-900/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Project Designs Grid */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      Generated Design Presets:
                    </span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {project.designs.map((design) => (
                        <div
                          key={design.id}
                          onClick={() => router.push(`/studio?style=${design.style}&designId=${design.id}`)}
                          className="group relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950/50 hover:border-blue-500/40 hover:bg-slate-900 cursor-pointer p-2 text-left transition-all"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5">
                            <img 
                              src={design.image_url} 
                              alt={design.style} 
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/0 transition-colors" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] text-slate-300 truncate">{design.style}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 ml-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
