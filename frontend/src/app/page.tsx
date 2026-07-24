"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Upload,
  Cpu,
  Palette,
  Box,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Eye,
  Camera,
  Layers,
  ArrowUpRight
} from "lucide-react";
import Hero3DScene from "@/components/landing/Hero3DScene";

export default function HomePage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter selection state for bottom gallery section
  const [galleryFilter, setGalleryFilter] = useState<"images" | "videos" | "panoramas">("images");

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      setUser(JSON.parse(userSession));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.refresh();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#041a18] text-slate-100 font-sans selection:bg-[#0d9488] selection:text-white relative overflow-x-hidden">
      
      {/* ---------------------------------------------------------------- border / background geometry overlays ---------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0d9488]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-[#059669]/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-[#042f2c]/40 rounded-full blur-[140px]" />
      </div>

      {/* ---------------------------------------------------------------- Top Navigation Header ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#062421]/90 backdrop-blur-md border-b border-emerald-900/40 px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => router.push("/")} 
            className="flex flex-col cursor-pointer group"
          >
            <span className="font-serif text-2xl font-extrabold tracking-tight text-white group-hover:text-[#0d9488] transition-colors">
              DHI <span className="text-xs font-sans font-light tracking-widest uppercase text-emerald-400 block -mt-1">STUDIOS</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-medium text-slate-300">
            <button onClick={() => scrollToSection("hero")} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer">Projects</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">Assets</button>
            <button onClick={() => scrollToSection("gallery")} className="hover:text-white transition-colors cursor-pointer">Our Clients</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">Contact</button>
            <button onClick={() => router.push("/upload")} className="hover:text-white transition-colors cursor-pointer text-emerald-400">Studio</button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/profile")}
                  className="w-9 h-9 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-xs shadow-md border border-emerald-400/30 cursor-pointer hover:scale-105 transition-transform"
                >
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-slate-300 hover:text-white border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-900/40 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push("/signup")}
                  className="text-xs font-medium text-slate-200 hover:text-white px-4 py-2 rounded-full border border-emerald-800/60 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="text-xs font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] px-5 py-2 rounded-full transition-all cursor-pointer shadow-lg shadow-[#0d9488]/20"
                >
                  Login
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ---------------------------------------------------------------- Hero Section ---------------------------------------------------------------- */}
      <section id="hero" className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Full-width Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000"
            alt="Emerald Luxury Interior"
            className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.1] saturate-[1.1]"
          />
          {/* Subtle Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#041a18] via-[#041a18]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#041a18]/90 via-[#041a18]/50 to-transparent" />
        </div>

        {/* Hero Content Overlays */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 w-full flex flex-col justify-center items-start">
          
          <div className="max-w-2xl space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-white tracking-tight drop-shadow-md">
              Transform Any Room Into An AI-Powered Living Space
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-light">
              HomeVerse bridges static 2D room photos and top-down blueprints into editable, interactive 3D digital twins powered by generative AI spatial engines.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="group flex items-center gap-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-7 py-3.5 rounded-full transition-all cursor-pointer shadow-xl shadow-[#0d9488]/20 hover:scale-105"
              >
                Launch 3D Studio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Centered Down Scroll Indicator */}
          <div className="w-full flex justify-center mt-16">
            <button
              onClick={() => scrollToSection("about")}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white transition-all cursor-pointer animate-bounce"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Floating 3D Scandinavian Chairs Cutout (Left Margin Overlay) */}
        <div className="absolute bottom-6 left-6 z-20 hidden lg:flex items-center gap-3 bg-[#062421]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-800/40 shadow-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => router.push("/upload")}>
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=250"
            alt="Beige Armchairs"
            className="w-16 h-16 object-cover rounded-xl border border-emerald-700/50"
          />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">PROPOSED 3D MESH</span>
            <span className="text-xs font-serif font-bold text-white block">Scandinavian Chairs</span>
            <span className="text-[10px] text-slate-400">Click to place in room</span>
          </div>
        </div>

      </section>

      {/* ---------------------------------------------------------------- About Us Section ---------------------------------------------------------------- */}
      <section id="about" className="relative py-24 px-8 bg-[#041c19] border-t border-emerald-950 relative z-10">
        
        {/* Angular Green Background Accent Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-900/30 transform skew-x-12 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-1/3 h-full bg-teal-900/20 transform -skew-x-12 -translate-x-32" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: About Info & Metrics */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">About Us</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
                Reimagining Interior Architecture with AI Precision
              </h2>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
              HomeVerse replaces static non-editable 2D concept images with real-time WebGL 3D digital twins. Drag and drop furniture, repaint walls, audit lighting clearance, and chat with an AI Design Copilot in seconds.
            </p>

            {/* 4 Stat Counter Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-emerald-900/40">
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white">255+</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Projects Completed</div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white">255+</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">3D Assets Catalog</div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white">255+</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">AI Style Presets</div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white">255+</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Happy Homeowners</div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="inline-flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-7 py-3 rounded-full transition-all cursor-pointer shadow-lg shadow-[#0d9488]/20 hover:scale-105"
              >
                Contact Us <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: 4-Photo Collage Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            {/* Main Tall Image (Left of Collage) */}
            <div className="sm:col-span-6 relative group overflow-hidden rounded-3xl border border-emerald-800/40 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800"
                alt="3D Interior Render"
                className="w-full h-[460px] object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
              />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 z-10 bg-[#062421]/90 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-[10px] font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CREATE 3D RENDERING
              </div>
            </div>

            {/* 2x2 Grid of Smaller Photos (Right of Collage) */}
            <div className="sm:col-span-6 grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-emerald-800/40 shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400"
                  alt="Console Table Setup"
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-800/40 shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400"
                  alt="Emerald Wall Plants"
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-800/40 shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400"
                  alt="Modern Armchair"
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-emerald-800/40 shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400"
                  alt="Pendant Lamps"
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- How It Works Section ---------------------------------------------------------------- */}
      <section id="how-it-works" className="relative py-24 px-8 bg-[#062421] border-t border-emerald-900/40 relative z-10">
        
        {/* Floating Teal Armchair Cutout (Right Margin) */}
        <div className="absolute right-8 top-12 z-20 hidden xl:flex items-center gap-3 bg-[#041a18]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/30 shadow-2xl hover:scale-105 transition-transform cursor-pointer" onClick={() => router.push("/upload")}>
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=200"
            alt="Teal Velvet Armchair"
            className="w-14 h-14 object-cover rounded-xl border border-emerald-400/40"
          />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">CATALOG ITEM</span>
            <span className="text-xs font-serif font-bold text-white block">Teal Velvet Chair</span>
            <span className="text-[10px] text-slate-400">Click to add to design</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Room Showcase Image */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-800/40 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1000"
                alt="Room Showcase"
                className="w-full h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
              />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 right-6 z-10 bg-[#062421]/90 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-[10px] font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CREATE 3D RENDERING
              </div>
            </div>

            {/* Bottom-left Overlapping Wooden Accent Chair */}
            <div className="absolute -bottom-6 -left-6 z-20 hidden sm:flex items-center gap-3 bg-[#041c19]/95 backdrop-blur-md p-3 rounded-2xl border border-emerald-800/50 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=150"
                alt="Wooden Chair"
                className="w-12 h-12 object-cover rounded-xl"
              />
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">3D SWAP READY</span>
                <span className="text-xs font-serif text-white">Accent Lounge Chair</span>
              </div>
            </div>
          </div>

          {/* Right Column: Steps & Instructions */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">How It Works</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
                From 2D Photo Upload to Interactive 3D Studio Twin
              </h2>
            </div>

            {/* Step List */}
            <div className="space-y-6">
              
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/50 text-[#0d9488] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-bold text-white">Capture & Upload Photo or Video</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Upload any 2D room picture, MP4 walkthrough video, solid-state LiDAR scan, or house floorplan blueprint.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/50 text-[#0d9488] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-bold text-white">AI Spatial Analysis & Depth Scan</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Gemini 3.5 Flash extracts wall boundaries, door openings, window placements, light directions, and room dimensions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/50 text-[#0d9488] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-bold text-white">Multi-Style Generation & Material Customization</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Instantly generate 5 parallel design styles (Modern, Japandi, Scandinavian, Luxury, Minimalist) with fast image renders.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/50 text-[#0d9488] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                  4
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-serif font-bold text-white">Interactive 3D Studio & CAD Export</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Customize furniture, paint walls, run WASD 3D walkthroughs, chat with the AI Copilot, and export Three.js JSON or Blender CAD scripts.
                  </p>
                </div>
              </div>

            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="inline-flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-7 py-3 rounded-full transition-all cursor-pointer shadow-lg shadow-[#0d9488]/20 hover:scale-105"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- Gallery / 360 Showcase Section ---------------------------------------------------------------- */}
      <section id="gallery" className="relative py-20 px-8 bg-[#041a18] border-t border-emerald-950 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Main Full-Width Gallery Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-800/40 shadow-2xl group h-[480px]">
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1800"
              alt="Luxury Interior Showcase"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-95"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#041a18]/90 via-transparent to-transparent" />

            {/* Bottom Floating Glassmorphism Filter Pills Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[#062421]/90 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-500/40 flex items-center gap-6 shadow-2xl">
              <button
                onClick={() => setGalleryFilter("images")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "images" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "images" ? "bg-emerald-400" : "bg-slate-500"}`} />
                Images <span className="text-[10px] text-slate-400 font-normal">12 Previews</span>
              </button>

              <button
                onClick={() => setGalleryFilter("videos")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "videos" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "videos" ? "bg-emerald-400" : "bg-slate-500"}`} />
                Videos <span className="text-[10px] text-slate-400 font-normal">10 Previews</span>
              </button>

              <button
                onClick={() => setGalleryFilter("panoramas")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "panoramas" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "panoramas" ? "bg-emerald-400" : "bg-slate-500"}`} />
                360° Panoramas <span className="text-[10px] text-slate-400 font-normal">Coming Soon</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom-right Floating Planter Cutout Overlay */}
        <div className="absolute bottom-6 right-8 z-20 hidden lg:flex items-center gap-3 bg-[#062421]/90 backdrop-blur-md p-3 rounded-2xl border border-emerald-700/50 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=150"
            alt="Potted Indoor Plant"
            className="w-12 h-12 object-cover rounded-xl"
          />
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-400 block">DECOR ASSET</span>
            <span className="text-xs font-serif text-white">Fiddle Leaf Planter</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Footer ---------------------------------------------------------------- */}
      <footer className="bg-[#021412] border-t border-emerald-950 py-12 px-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold text-white tracking-wider">DHI STUDIOS / HOMEVERSE</span>
            <span className="text-[10px] text-slate-500 mt-0.5">AI Spatial Architecture & 3D Studio Twin Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button onClick={() => scrollToSection("hero")} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors cursor-pointer">About Us</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => router.push("/upload")} className="hover:text-white transition-colors cursor-pointer text-emerald-400">Upload Room</button>
            <button onClick={() => router.push("/studio")} className="hover:text-white transition-colors cursor-pointer text-emerald-400">3D Studio</button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            © 2026 HomeVerse Inc. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
