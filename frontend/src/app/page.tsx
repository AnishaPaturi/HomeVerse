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
  ArrowUpRight,
  Wand2,
  MessageSquare,
  Compass,
  SlidersHorizontal,
  FolderPlus,
  Zap,
  ShieldCheck,
  Check
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active style tab in feature section
  const [activeStyleTab, setActiveStyleTab] = useState<string>("Japandi");

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

  const styleDetails: Record<string, { desc: string; img: string; items: string[] }> = {
    Japandi: {
      desc: "East meets West. Warm light wood, low-profile minimalist furniture, clean linen fabrics, and wabi-sabi natural textures.",
      img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800",
      items: ["Low Oak Platform Bed", "Burlap & Linen Armchair", "Paper Lantern Lamp", "Raw Stone Table"]
    },
    Modern: {
      desc: "Clean geometric lines, dark walnut accents, matte black metal fixtures, and subtle neutral monochromatic color schemes.",
      img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
      items: ["Modular Charcoal Sofa", "Walnut Coffee Table", "Track LED Lighting", "Polished Slate Floor"]
    },
    Scandinavian: {
      desc: "Bright airy aesthetic with bleached oak, high contrast accents, hygge textiles, and functional ergonomic furniture.",
      img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
      items: ["Light Birch Desk", "Woven Wool Rug", "White Curved Lounge Chair", "Minimalist Wall Shelving"]
    },
    "Modern Luxury": {
      desc: "Opulent interior architectural finishes with polished Calacatta marble, brushed gold brass trims, and emerald velvet upholstery.",
      img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
      items: ["Teal Velvet Chesterfield", "Gold Brass Chandelier", "Marble Accent Console", "Custom Molding Walls"]
    },
    Minimalist: {
      desc: "Decluttered architectural pureness with hidden storage, concealed recessed lighting, smooth concrete, and seamless surfaces.",
      img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800",
      items: ["Floating Wall Console", "Monochrome Studio Desk", "Recessed LED Strip", "Sliding Partition Screen"]
    }
  };

  return (
    <div className="min-h-screen bg-[#041a18] text-slate-100 font-sans selection:bg-[#0d9488] selection:text-white relative overflow-x-hidden">
      
      {/* Background Gradient Orbs */}
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
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-[#0d9488] p-1.5 rounded-lg border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-2xl font-extrabold tracking-tight text-white group-hover:text-[#0d9488] transition-colors">
              HOME<span className="text-emerald-400">VERSE</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-medium text-slate-300">
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Platform Features</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => scrollToSection("styles")} className="hover:text-white transition-colors cursor-pointer">AI Styles</button>
            <button onClick={() => scrollToSection("gallery")} className="hover:text-white transition-colors cursor-pointer">Showcase</button>
          </nav>

          {/* Header Action */}
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
                  onClick={() => router.push("/login")}
                  className="text-xs font-medium text-slate-200 hover:text-white px-4 py-2 rounded-full border border-emerald-800/60 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/upload")}
                  className="text-xs font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] px-5 py-2 rounded-full transition-all cursor-pointer shadow-lg shadow-[#0d9488]/20 flex items-center gap-2"
                >
                  Launch 3D Studio <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ---------------------------------------------------------------- Hero Section ---------------------------------------------------------------- */}
      <section id="hero" className="relative w-full min-h-[88vh] flex items-center justify-center overflow-hidden">
        
        {/* Full-width Emerald Luxury Interior Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000"
            alt="Emerald Interior Twin"
            className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-[1.1] saturate-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041a18] via-[#041a18]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#041a18]/95 via-[#041a18]/60 to-transparent" />
        </div>

        {/* Floating 3D Chair Cutouts Overlapping Hero (Matching Reference Image) */}
        <div className="absolute top-16 left-8 z-20 hidden lg:flex items-center gap-3 bg-[#062421]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl animate-float cursor-pointer" onClick={() => router.push("/upload")}>
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=200"
            alt="Beige Scandinavian Armchair"
            className="w-16 h-16 object-cover rounded-xl border border-emerald-400/40"
          />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">3D MESH GENERATED</span>
            <span className="text-xs font-serif font-bold text-white block">Beige Lounge Chair</span>
            <span className="text-[10px] text-slate-400">Click to place in studio</span>
          </div>
        </div>

        <div className="absolute bottom-24 right-12 z-20 hidden lg:flex items-center gap-3 bg-[#062421]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl animate-float-reverse cursor-pointer" onClick={() => router.push("/upload")}>
          <div className="p-2.5 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-xl">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">AI SPATIAL SCAN</span>
            <span className="text-xs font-serif font-bold text-white block">99.4% Depth Accuracy</span>
            <span className="text-[10px] text-slate-400">Gemini 2.5 Flash Engine</span>
          </div>
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 w-full flex flex-col justify-center items-start">
          
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d9488]/20 border border-[#0d9488]/40 rounded-full text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" /> AI Spatial Reconstruction & 3D Twin Studio
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-white tracking-tight drop-shadow-md">
              AI-Powered 3D Spatial Architecture & Digital Room Twins
            </h1>
            
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl font-light">
              Transform single room photos, video walkthroughs, or 2D floorplan blueprints into interactive 3D digital houses. Drag-and-drop 3D furniture, swap interior styles, edit materials, and chat with an AI Design Copilot in real time.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="group flex items-center justify-center gap-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-7 py-3.5 rounded-full transition-all cursor-pointer shadow-xl shadow-[#0d9488]/20 hover:scale-105"
              >
                Launch 3D Studio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="flex items-center justify-center gap-2 bg-[#062421]/90 hover:bg-emerald-900/60 text-slate-200 hover:text-white border border-emerald-700/50 text-xs font-medium uppercase tracking-wider px-6 py-3.5 rounded-full transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Upload Photo or Blueprint
              </button>
            </div>
          </div>

          {/* Centered Scroll Indicator */}
          <div className="w-full flex justify-center mt-16">
            <button
              onClick={() => scrollToSection("features")}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:text-white hover:border-white transition-all cursor-pointer animate-bounce"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- Platform Capabilities Grid (Explaining the Idea) ---------------------------------------------------------------- */}
      <section id="features" className="relative py-24 px-8 bg-[#041c19] border-t border-emerald-950 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">Platform Capabilities</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
              Everything You Need to Design Your Dream Space in 3D
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-light">
              HomeVerse replaces non-editable flat images with real-time WebGL interactive 3D twins, instant 5-style generation, and conversational AI prompt editing.
            </p>
          </div>

          {/* 6 Core Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                1. 2D Blueprint & House Generator
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Input floor count, room dimensions, purpose, and budget—or upload a 2D architectural blueprint—to auto-generate complete 3D house structures.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                2. Vision AI Room Scan
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Upload a single room photo or MP4 video walkthrough. Gemini Vision AI automatically identifies walls, doors, windows, and existing furniture coordinates.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                3. 5 Parallel AI Style Variations
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Generate 5 distinct photorealistic interior styles (Modern, Japandi, Scandinavian, Modern Luxury, Minimalist) with fast Pollinations AI image renders.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                4. Interactive 3D WebGL Studio
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Take full control in 3D! Rotate cameras 360°, execute WASD walkthroughs, drag and drop 3D furniture, rotate, scale, and adjust ceiling lighting.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                5. Conversational AI Design Copilot
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Describe desired changes in plain English—e.g., <em>"Make the walls blue and add an oak desk"</em>—and watch the AI Copilot update the 3D scene live.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#062421]/80 backdrop-blur-md p-7 rounded-3xl border border-emerald-800/40 hover:border-emerald-500/60 transition-all group space-y-4 shadow-xl">
              <div className="p-3 bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                6. Custom Material & Product Marketplace
              </h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Swap velvet, leather, oak, marble, and brass textures on real catalog furniture items, with cost estimation aligned to your project budget.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- How It Works Section (With Floating Cutouts) ---------------------------------------------------------------- */}
      <section id="how-it-works" className="relative py-24 px-8 bg-[#062421] border-t border-emerald-900/40 relative z-10">
        
        {/* Floating Cutout Overlap 1: Bright Teal Armchair (Right Margin - Matching Reference Image) */}
        <div className="absolute right-6 top-16 z-20 hidden xl:flex items-center gap-3 bg-[#041a18]/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl animate-float cursor-pointer" onClick={() => router.push("/upload")}>
          <img
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=200"
            alt="Teal Velvet Armchair"
            className="w-16 h-16 object-cover rounded-xl border border-emerald-400/40"
          />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">3D CATALOG ITEM</span>
            <span className="text-xs font-serif font-bold text-white block">Teal Velvet Chair</span>
            <span className="text-[10px] text-slate-400 font-light">Drag to place in 3D</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Room Showcase Image with Floating Badge & Bottom-Left Cutout */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-800/40 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1000"
                alt="Room Showcase"
                className="w-full h-[460px] object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
              />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 right-6 z-10 bg-[#062421]/90 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40 text-[10px] font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CREATE 3D RENDERING
              </div>
            </div>

            {/* Bottom-left Overlapping Wooden Accent Chair Cutout (Matching Reference Image) */}
            <div className="absolute -bottom-6 -left-6 z-20 hidden sm:flex items-center gap-3 bg-[#041c19]/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-700/60 shadow-2xl animate-float-reverse">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=150"
                alt="Wooden Accent Chair"
                className="w-14 h-14 object-cover rounded-xl"
              />
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">REAL-TIME PREVIEW</span>
                <span className="text-xs font-serif font-bold text-white">Accent Lounge Chair</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clear 4-Step Process */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">How It Works</span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
                From 2D Photo Upload to Interactive 3D Digital Twin
              </h2>
            </div>

            {/* Step List */}
            <div className="space-y-6">
              
              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-2xl bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0d9488] group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-white">1. Upload Room Photo, Video, or House Blueprint</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Upload a single picture of your room, an MP4 walkthrough video, or enter house room dimensions and floorplan requirements.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-2xl bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0d9488] group-hover:text-white transition-colors">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-white">2. AI Spatial Reconstruction & Depth Scan</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Gemini 2.5 Flash extracts wall coordinates, window orientations, door clearance bounds, and room layout dimensions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-2xl bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0d9488] group-hover:text-white transition-colors">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-white">3. Multi-Style AI Generation & Furniture Mapping</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Instantly preview 5 interior style variations (Modern, Japandi, Scandinavian, Luxury, Minimalist) with catalog item mapping.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-2xl bg-[#0d9488]/20 border border-[#0d9488]/50 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0d9488] group-hover:text-white transition-colors">
                  <Box className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-white">4. Interactive 3D WebGL Studio & Copilot Chat</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Walk through the 3D scene in WebGL, drag and drop furniture, swap materials, and command the AI Copilot via voice or text.
                  </p>
                </div>
              </div>

            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="inline-flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-8 py-3.5 rounded-full transition-all cursor-pointer shadow-lg shadow-[#0d9488]/20 hover:scale-105"
              >
                Start Designing Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- AI Style Explorer Section ---------------------------------------------------------------- */}
      <section id="styles" className="relative py-24 px-8 bg-[#041c19] border-t border-emerald-950 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">AI Style Presets</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Explore 5 Parallel Interior Design Themes
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-light">
              Select a style preset below to see how HomeVerse maps textures, materials, lighting, and catalog furniture.
            </p>
          </div>

          {/* Style Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.keys(styleDetails).map((styleName) => (
              <button
                key={styleName}
                onClick={() => setActiveStyleTab(styleName)}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeStyleTab === styleName
                    ? "bg-[#0d9488] text-white shadow-lg shadow-[#0d9488]/20 scale-105"
                    : "bg-[#062421] text-slate-300 hover:text-white border border-emerald-800/50"
                }`}
              >
                {styleName}
              </button>
            ))}
          </div>

          {/* Style Display Card */}
          <div className="bg-[#062421]/90 backdrop-blur-md rounded-3xl border border-emerald-800/40 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
            <div className="lg:col-span-7 relative overflow-hidden rounded-2xl border border-emerald-700/50 group">
              <img
                src={styleDetails[activeStyleTab].img}
                alt={activeStyleTab}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-[#062421]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-300 border border-emerald-500/40">
                ACTIVE AI PRESET: {activeStyleTab}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <h3 className="font-serif text-2xl font-bold text-white">{activeStyleTab} Style Aesthetic</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                {styleDetails[activeStyleTab].desc}
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">MAPPED CATALOG ASSETS</span>
                <div className="grid grid-cols-2 gap-2">
                  {styleDetails[activeStyleTab].items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-[#041a18] p-2 rounded-xl border border-emerald-900/60">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/studio?style=${activeStyleTab}`)}
                className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-full transition-all cursor-pointer shadow-md shadow-[#0d9488]/20 flex items-center justify-center gap-2"
              >
                Apply {activeStyleTab} in 3D Studio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- Gallery / 360 Showcase Section ---------------------------------------------------------------- */}
      <section id="gallery" className="relative py-24 px-8 bg-[#041a18] border-t border-emerald-950 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#0d9488] block">Visual Showcase</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
                Explore Generated 3D Interior Twins
              </h2>
            </div>
          </div>

          {/* Main Full-Width Gallery Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-800/40 shadow-2xl group h-[480px]">
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1800"
              alt="Luxury Interior Showcase"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-95"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#041a18]/90 via-transparent to-transparent" />

            {/* Bottom Floating Glassmorphism Filter Pills Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[#062421]/95 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-500/40 flex items-center gap-6 shadow-2xl">
              <button
                onClick={() => setGalleryFilter("images")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "images" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "images" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                Images <span className="text-[10px] text-slate-400 font-normal">12 Previews</span>
              </button>

              <button
                onClick={() => setGalleryFilter("videos")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "videos" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "videos" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                Videos <span className="text-[10px] text-slate-400 font-normal">10 Previews</span>
              </button>

              <button
                onClick={() => setGalleryFilter("panoramas")}
                className={`text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                  galleryFilter === "panoramas" ? "text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${galleryFilter === "panoramas" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                360° Panoramas <span className="text-[10px] text-slate-400 font-normal">Coming Soon</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom-right Floating Planter Cutout Overlay (Matching Reference Image) */}
        <div className="absolute bottom-6 right-8 z-20 hidden lg:flex items-center gap-3 bg-[#062421]/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-700/50 shadow-2xl animate-float">
          <img
            src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=150"
            alt="Potted Indoor Plant"
            className="w-14 h-14 object-cover rounded-xl"
          />
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-400 block">DECOR ASSET</span>
            <span className="text-xs font-serif font-bold text-white">Fiddle Leaf Planter</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Bottom Call to Action Banner (No Repetitive Contact Us) ---------------------------------------------------------------- */}
      <section className="py-20 px-8 bg-[#062421] border-t border-emerald-900/40 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 bg-gradient-to-b from-[#041c19] to-[#041a18] p-12 rounded-3xl border border-emerald-700/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d9488]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Ready to Build & Customize Your Home in 3D?
          </h2>
          
          <p className="text-slate-300 text-xs sm:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Upload your room photo or blueprint to start your AI-powered 3D digital twin design journey today.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => router.push(user ? "/upload" : "/login")}
              className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium text-xs uppercase tracking-wider px-9 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-[#0d9488]/30 hover:scale-105 flex items-center gap-2"
            >
              Launch HomeVerse Studio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Footer ---------------------------------------------------------------- */}
      <footer className="bg-[#021412] border-t border-emerald-950 py-12 px-8 text-slate-400 text-xs relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold text-white tracking-wider">HOMEVERSE</span>
            <span className="text-[10px] text-slate-500 mt-0.5">AI Spatial Architecture & 3D Digital Twin Studio Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button onClick={() => scrollToSection("hero")} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Features</button>
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
