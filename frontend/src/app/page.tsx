"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Hero3DScene from "@/components/landing/Hero3DScene";
import { 
  Sparkles, 
  Layers, 
  Box, 
  Wand2, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  ShoppingBag, 
  Compass, 
  Scan, 
  Cpu, 
  Play, 
  Sliders, 
  Eye, 
  X, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active styles for interactive showcases
  const [heroStyle, setHeroStyle] = useState<string>("Japandi");
  const [activeDnaStyle, setActiveDnaStyle] = useState<string>("Japandi");
  const [activeCompareStyle, setActiveCompareStyle] = useState<string>("Japandi");

  // Before / After Slider Position (0 to 100)
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Video / Interactive Demo Modal State
  const [demoModalOpen, setDemoModalOpen] = useState(false);

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

  // Design DNA System
  const designDnaList = [
    {
      id: "japandi",
      name: "Japandi",
      tagline: "Warm · Natural · Calm",
      desc: "A timeless fusion of Scandinavian functionality and Japanese wabi-sabi minimalism. Features low-profile platform oak furniture, organic linen textiles, handmade ceramic accents, and warm diffused lighting.",
      palette: ["#f5f5f4", "#e7e5e4", "#b45309", "#0f766e", "#78350f"],
      materials: ["Bleached White Oak", "Natural Raw Linen", "Washi Paper Shade", "Smooth Limestone"],
      image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800",
      budgetTier: "₹8.4L - ₹10.2L",
    },
    {
      id: "modern",
      name: "Modern",
      tagline: "Clean · Minimal · Structured",
      desc: "Architectural purity characterized by sleek geometric profiles, concealed storage systems, dark walnut wood paneling, matte black metal accents, and balanced neutral color palettes.",
      palette: ["#0f172a", "#1e293b", "#334155", "#0d9488", "#cbd5e1"],
      materials: ["Dark Smoked Walnut", "Matte Black Steel", "Smoked Grey Glass", "Seamless Concrete"],
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
      budgetTier: "₹8.8L - ₹11.0L",
    },
    {
      id: "scandinavian",
      name: "Scandinavian",
      tagline: "Bright · Functional · Airy",
      desc: "Maximized natural day-lighting with blonde birch furniture, high-contrast black hardware, plush hygge wool rugs, and ergonomic modular arrangements designed for effortless everyday living.",
      palette: ["#ffffff", "#f8fafc", "#e2e8f0", "#0284c7", "#10b981"],
      materials: ["Nordic Light Birch", "Bouclé Wool Fabric", "Powder White Metal", "Fluted Glass Panels"],
      image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
      budgetTier: "₹7.9L - ₹9.8L",
    },
    {
      id: "luxury",
      name: "Modern Luxury",
      tagline: "Elegant · Refined · Premium",
      desc: "High-end bespoke craftsmanship featuring bookmatched Calacatta Gold marble, brushed gold brass trims, emerald velvet upholstery, and integrated architectural LED cove illumination.",
      palette: ["#090d16", "#1e1b4b", "#d97706", "#047857", "#fef08a"],
      materials: ["Calacatta Gold Marble", "Brushed Brass Trims", "Emerald Italian Velvet", "High-Gloss Veneer"],
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
      budgetTier: "₹14.2L - ₹22.5L",
    },
    {
      id: "industrial",
      name: "Industrial",
      tagline: "Raw · Bold · Urban",
      desc: "Uncovered structural character with exposed red brickwork, polished warehouse concrete floors, antique cognac leather seating, and industrial black steel framing.",
      palette: ["#18181b", "#27272a", "#ea580c", "#451a03", "#71717a"],
      materials: ["Exposed Heritage Brick", "Cognac Saddle Leather", "Reclaimed Barn Wood", "Black Cast Iron"],
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800",
      budgetTier: "₹9.1L - ₹11.8L",
    },
    {
      id: "contemporary",
      name: "Contemporary",
      tagline: "Fluid · Curvaceous · Fresh",
      desc: "Embraces current trend-forward architectural movements: sculpted organic sofa curves, warm taupe palettes, sculptural statement chandeliers, and layered tactile textures.",
      palette: ["#f1f5f9", "#e2e8f0", "#6366f1", "#475569", "#d97706"],
      materials: ["Curved Bouclé Fleece", "Honed Travertine Stone", "Champagne Bronze", "Ribbed Walnut"],
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
      budgetTier: "₹10.5L - ₹13.4L",
    },
  ];

  const currentDna = designDnaList.find((s) => s.name === activeDnaStyle) || designDnaList[0];

  // 6-Style Comparison images
  const styleComparisonData: Record<string, { img: string; title: string; cost: string; highlight: string }> = {
    Modern: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_modern_living_room_walnut_wood_charcoal_sofa_sleek_minimalist_4k?width=800&height=550&nologo=true&seed=111",
      title: "Structured Minimal Modern",
      cost: "₹8,80,000",
      highlight: "Clean lines · Smoked glass · Dark walnut paneling",
    },
    Japandi: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_japandi_living_room_light_oak_linen_low_furniture_wabi_sabi_4k?width=800&height=550&nologo=true&seed=222",
      title: "Organic Warm Japandi",
      cost: "₹8,42,000",
      highlight: "Bleached oak · Wabi-sabi linen · Paper lantern lights",
    },
    Scandinavian: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_scandinavian_living_room_bright_airy_white_birch_cozy_hygge_4k?width=800&height=550&nologo=true&seed=333",
      title: "Hygge Scandinavian",
      cost: "₹7,95,000",
      highlight: "Birchwood · Plush wool rug · Max natural light",
    },
    "Modern Luxury": {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_modern_luxury_living_room_calacatta_marble_gold_brass_velvet_4k?width=800&height=550&nologo=true&seed=444",
      title: "Bespoke Modern Luxury",
      cost: "₹14,20,000",
      highlight: "Italian marble · Brushed brass · Custom moldings",
    },
    Industrial: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_industrial_loft_living_room_exposed_brick_black_steel_leather_4k?width=800&height=550&nologo=true&seed=555",
      title: "Raw Urban Industrial",
      cost: "₹9,10,000",
      highlight: "Exposed brick · Saddle leather · Black steel grid",
    },
    Contemporary: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_contemporary_living_room_curved_furniture_statement_lighting_4k?width=800&height=550&nologo=true&seed=666",
      title: "Curvaceous Contemporary",
      cost: "₹10,50,000",
      highlight: "Organic curves · Travertine stone · Ambient glow",
    },
  };

  const currentCompare = styleComparisonData[activeCompareStyle] || styleComparisonData["Japandi"];

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-slate-800/20 rounded-full blur-[180px]" />
      </div>

      {/* ========================================================================================= */}
      {/* 1. TOP NAVIGATION HEADER (Commercial SaaS Navigation) */}
      {/* ========================================================================================= */}
      <header className="sticky top-0 z-50 bg-[#070b10]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => router.push("/")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070b10] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                HV
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                HOMEVERSE <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">SPATIAL OS</span>
              </span>
            </div>
          </div>

          {/* SaaS Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-wider text-slate-300">
            <button onClick={() => scrollToSection("workflow")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span>HOW IT WORKS</span>
            </button>
            <button onClick={() => scrollToSection("ai-engine")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span>AI SCANNER</span>
            </button>
            <button onClick={() => scrollToSection("design-dna")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span>DESIGN DNA</span>
            </button>
            <button onClick={() => scrollToSection("compare-styles")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span>6-STYLE STUDIO</span>
            </button>
            <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              <span>PRICING</span>
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    {user.name ? user.name[0].toUpperCase() : "A"}
                  </div>
                  <span>{user.name ? user.name.split(" ")[0] : "Dashboard"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="text-xs font-mono text-slate-300 hover:text-white px-3 py-2 transition-colors cursor-pointer hidden sm:block"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => router.push(user ? "/upload" : "/login")}
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Designing</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================================= */}
      {/* 2. HERO SECTION — "Make the first 10 seconds insane" */}
      {/* ========================================================================================= */}
      <section id="hero" className="relative pt-12 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Huge Hook & Value Prop */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next-Gen Spatial CAD + Generative AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Design your space.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Before you build it.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
              Turn a single room photo, architectural floor plan, or blank canvas into an interactive, editable 3D digital twin — powered by real-time spatial AI.
            </p>

            {/* Dual CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="group flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm uppercase tracking-wider px-7 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95"
              >
                <Wand2 className="w-4 h-4" />
                <span>✨ Design My Room</span>
              </button>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="flex items-center justify-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-mono text-sm px-6 py-4 rounded-full transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Watch Interactive Demo</span>
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-400 font-mono border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1.5s Fast Diffusion Hand-Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Editable Three.js Twin</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Interactive 3D Room with Floating HUDs */}
          <div className="lg:col-span-7 relative">
            <Hero3DScene styleName={heroStyle} onStyleChange={(st) => setHeroStyle(st)} />
          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 3. "FROM PHOTO → DIGITAL TWIN" 5-STEP JOURNEY SECTION */}
      {/* ========================================================================================= */}
      <section id="workflow" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span>ZERO HALLUCINATIONS · TRUE SPATIAL PRECISION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              From Raw Room Photo to Live 3D Digital Twin
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-light">
              Traditional AI generates flattened, static 2D pictures you can't edit. HomeVerse extracts depth, boundaries, and furniture nodes to assemble a CAD-grade 3D environment in seconds.
            </p>
          </div>

          {/* 5-Step Visual Workflow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
            
            {/* Step 01 */}
            <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 group-hover:scale-110 transition-transform">
                  01
                </div>
                <h3 className="text-base font-bold text-white">Upload Your Room</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Take a photo with your phone, upload an MP4 walkthrough video, or drop in a 2D architectural blueprint.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Photo · Video · Blueprint
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-mono font-bold text-xs text-teal-400 group-hover:scale-110 transition-transform">
                  02
                </div>
                <h3 className="text-base font-bold text-white">AI Understands Space</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Gemini Vision analyzes walls, floor boundaries, light vectors, and isolates existing furniture coordinates.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-teal-400">
                4.8m × 6.2m Dimensions
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 group-hover:scale-110 transition-transform">
                  03
                </div>
                <h3 className="text-base font-bold text-white">Digital Twin Generated</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  HomeVerse constructs an interactive 3D WebGL viewport with parametric geometries, PBR lighting, and physics.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Three.js / R3F Engine
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-xs text-amber-400 group-hover:scale-110 transition-transform">
                  04
                </div>
                <h3 className="text-base font-bold text-white">Edit Everything</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Move sofas 30cm, repaint walls, swap floor tiles, test clearance distances, or prompt the conversational AI Copilot.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-amber-400">
                Full CAD Control
              </div>
            </div>

            {/* Step 05 */}
            <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-xs text-indigo-400 group-hover:scale-110 transition-transform">
                  05
                </div>
                <h3 className="text-base font-bold text-white">Buy What You Love</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Every 3D object maps directly to catalog products from IKEA, Urban Ladder, and Pepperfry with real pricing and dimensions.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-indigo-400">
                Direct Vendor Links
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 4. "SHOW THE AI — DON'T JUST SAY AI-POWERED" (Vision Scanner Readout) */}
      {/* ========================================================================================= */}
      <section id="ai-engine" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#070b10] relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Educational Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Scan className="w-3.5 h-3.5" />
              <span>SPATIAL COMPUTER VISION PIPELINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              See what the AI actually sees in your room.
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed font-light">
              Unlike consumer AI chatbots that treat rooms as abstract concepts, HomeVerse runs deep semantic room decomposition: calculating aspect ratios, lighting angles, walking clearances, and bounding boxes.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono">Boundary Detection</h4>
                  <p className="text-xs text-slate-400 font-light">Identifies structural walls, load-bearing partitions, and floor slabs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono">Object Classification</h4>
                  <p className="text-xs text-slate-400 font-light">Isolates sofas, coffee tables, TV consoles, doors, windows, and light fixtures.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono">Coordinate Translation</h4>
                  <p className="text-xs text-slate-400 font-light">Maps 2D pixel coordinates into 3D Cartesian space ($X, Y, Z$) for WebGL.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 hover:border-emerald-500 hover:text-white transition-all cursor-pointer"
              >
                <span>Try Room Scanner</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Terminal / Vision Scanner Readout HUD */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl overflow-hidden font-mono text-xs">
              
              {/* Terminal Header */}
              <div className="px-5 py-3.5 bg-[#0e141e] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-400 text-[11px]">gemini-vision-spatial-analyzer v3.5</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  CONFIDENCE 96.4%
                </span>
              </div>

              {/* Terminal Body */}
              <div className="p-6 space-y-6">
                
                {/* Room Geometry Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">WALL BOUNDS</div>
                    <div className="text-sm font-bold text-white mt-1">4 Aligned ✓</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">FLOOR AREA</div>
                    <div className="text-sm font-bold text-white mt-1">29.76 m²</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">CEILING H</div>
                    <div className="text-sm font-bold text-white mt-1">3.05 m (10ft)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">FURNITURE NODES</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">7 Objects</div>
                  </div>
                </div>

                {/* Spatial Coordinate Stream */}
                <div className="p-4 rounded-xl bg-[#05070a] border border-slate-800/80 text-[11px] space-y-2 text-slate-300">
                  <div className="text-slate-500">// EXTRACTED SCENE GRAPH COORDINATES (X, Y, Z)</div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">• sofa_modular_01</span>
                    <span className="text-slate-400">pos: [-0.80, 0.00, 0.00] · rot: 0.78 rad</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">• coffee_table_01</span>
                    <span className="text-slate-400">pos: [0.50, 0.00, 0.90] · rot: -0.39 rad</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">• floor_lamp_ambient</span>
                    <span className="text-slate-400">pos: [-2.30, 0.00, -1.20] · 2700K Lux</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">• wall_art_canvas</span>
                    <span className="text-slate-400">pos: [0.00, 2.20, -3.92] · North Wall</span>
                  </div>
                </div>

                {/* Ergonomics & Clearance Check */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Spatial Clearance: All main walking pathways exceed standard 80cm clearance.</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">PASS</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 5. "DESIGN DNA" SYSTEM SECTION */}
      {/* ========================================================================================= */}
      <section id="design-dna" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span>CURATED INTERIOR DESIGN DNA</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Cohesive architectural style profiles.
              </h2>
              <p className="text-slate-400 text-sm font-light">
                Explore our six core interior aesthetic models. Each DNA profile comes with curated PBR materials, color palettes, lighting rules, and budget metrics.
              </p>
            </div>

            {/* Quick DNA Style Pill Selector */}
            <div className="flex flex-wrap gap-2">
              {designDnaList.map((dna) => (
                <button
                  key={dna.id}
                  onClick={() => setActiveDnaStyle(dna.name)}
                  className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 rounded-full transition-all cursor-pointer ${
                    activeDnaStyle === dna.name
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30"
                      : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {dna.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active DNA Detail Showcase Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-10 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl">
            
            {/* Visual Photo Preview */}
            <div className="lg:col-span-6 relative overflow-hidden rounded-2xl border border-white/[0.08] group h-[380px]">
              <img
                src={currentDna.image}
                alt={currentDna.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">{currentDna.tagline}</div>
                  <h3 className="text-2xl font-bold text-white mt-0.5">{currentDna.name} Space</h3>
                </div>
                <div className="text-xs font-mono bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-slate-200">
                  Est. {currentDna.budgetTier}
                </div>
              </div>
            </div>

            {/* Architectural Profile Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              
              <div>
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{currentDna.tagline}</div>
                <h3 className="text-3xl font-bold text-white mt-1">{currentDna.name} Design System</h3>
                <p className="text-slate-300 text-sm font-light leading-relaxed mt-2">
                  {currentDna.desc}
                </p>
              </div>

              {/* Color Palette Swatches */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Color Palette DNA</div>
                <div className="flex items-center gap-3">
                  {currentDna.palette.map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div 
                        className="w-10 h-10 rounded-xl border border-white/20 shadow-md transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[9px] font-mono text-slate-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials List */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Curated PBR Finishes</div>
                <div className="grid grid-cols-2 gap-2">
                  {currentDna.materials.map((mat, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{mat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => router.push(user ? `/studio?style=${currentDna.name}` : "/login")}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>Launch in 3D Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 6. 6-STYLE SHOWSTOPPER COMPARISON & BEFORE / AFTER SLIDER */}
      {/* ========================================================================================= */}
      <section id="compare-styles" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#070b10]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span>LOCKED-COORDINATE MULTI-STYLE RENDERING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              One Room Layout. Six Distinct Worlds.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-light">
              HomeVerse locks the physical 3D furniture coordinates and dimensions, then applies six separate material, lighting, and textural style profiles in parallel.
            </p>

            {/* 6 Style Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {["Japandi", "Modern", "Scandinavian", "Modern Luxury", "Industrial", "Contemporary"].map((style) => (
                <button
                  key={style}
                  onClick={() => setActiveCompareStyle(style)}
                  className={`text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-full transition-all cursor-pointer ${
                    activeCompareStyle === style
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30"
                      : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Before vs After Comparison Card */}
          <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6">
            
            {/* Interactive Image Comparison Container */}
            <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden select-none border border-slate-800">
              
              {/* After: Redesigned Room */}
              <img
                src={currentCompare.img}
                alt="HomeVerse AI Redesign"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Before: Original Empty / Unstyled Room (Clipped via Slider) */}
              <div 
                className="absolute inset-0 overflow-hidden border-r-2 border-emerald-400 shadow-2xl"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200"
                  alt="Original Raw Room Photo"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: "100%", minWidth: "100%", height: "100%" }}
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[11px] font-mono uppercase text-slate-200">
                  ORIGINAL ROOM PHOTO
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 text-[11px] font-mono uppercase text-emerald-300">
                HOMEVERSE {activeCompareStyle.toUpperCase()}
              </div>

              {/* Slider Drag Line & Controller */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-emerald-400 cursor-ew-resize flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xl border-2 border-white">
                  ⟷
                </div>
              </div>

              {/* HTML Slider Range Input Overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
              />

            </div>

            {/* Checklist Verification Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Room Analyzed ✓</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Furniture Optimized ✓</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Lighting Improved ✓</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Budget Verified ✓</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 7. "WHY HOMEVERSE?" — 3 CORE VALUE PILLARS */}
      {/* ========================================================================================= */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span>COMMERCIAL ADVANTAGES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Why HomeVerse Changes Everything
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-light">
              Built for homeowners, interior designers, and architects who need actual precision instead of disposable concept images.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Spatial Intelligence</h3>
              <p className="text-slate-300 text-sm font-light leading-relaxed">
                We don't generate hallucinatory pixel renders. HomeVerse understands room geometry, architectural scale, door swing clearances, and physical dimensions.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">True 3D CAD Editing</h3>
              <p className="text-slate-300 text-sm font-light leading-relaxed">
                Don't just look at an image — edit every millimeter. Move furniture, customize wood finishes, repaint accent walls, and walk through your room in first person.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Design → Purchase Commerce</h3>
              <p className="text-slate-300 text-sm font-light leading-relaxed">
                Seamlessly bridge design and reality. Click any 3D furniture piece to see real catalog items from IKEA, Urban Ladder, and Pepperfry with exact dimensions and prices.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 8. PRICING & COMMERCIAL TIERS */}
      {/* ========================================================================================= */}
      <section id="pricing" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#070b10]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span>TRANSPARENT PRICING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Plans for Homeowners & Design Studios
            </h2>
            <p className="text-slate-400 text-sm font-light">
              Start designing for free. Upgrade whenever you need unlimited 4K renders, Blender exports, and collaborative sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Free Explorer */}
            <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Explorer</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">₹0</span>
                  <span className="text-xs text-slate-400">/ forever free</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Ideal for homeowners visualizing a single room makeover.</p>
                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Active Room Project</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Fast AI Redesigns</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3D WebGL Studio & 2D CAD</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Furniture Marketplace Guide</div>
                </div>
              </div>
              <button
                onClick={() => router.push(user ? "/upload" : "/signup")}
                className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 cursor-pointer transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Designer (Featured) */}
            <div className="p-8 rounded-3xl bg-[#0a121c] border-2 border-emerald-500 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">Pro Designer</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">₹1,999</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 font-light">For interior designers and active renovation projects.</p>
                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited 3D Digital Twins</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ultra-HD 4K AI Diffusion</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Conversational AI Design Copilot</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3D Walkthrough & 360° VR Mode</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Three.js & Blender CAD Exporters</div>
                </div>
              </div>
              <button
                onClick={() => router.push(user ? "/upload" : "/signup")}
                className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-lg shadow-emerald-500/30"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Studio / Firm */}
            <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Architecture Studio</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">₹6,999</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Full collaborative multi-user OS for architectural firms.</p>
                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Real-time WebSocket Co-Designing</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-Floor House Blueprints</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unity Scene & BIM Integrations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated API & Priority Support</div>
                </div>
              </div>
              <button
                onClick={() => router.push(user ? "/upload" : "/signup")}
                className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 cursor-pointer transition-all"
              >
                Contact Enterprise
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 9. BOTTOM CTA BANNER */}
      {/* ========================================================================================= */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/[0.06] bg-gradient-to-b from-[#070b10] to-[#04080c] text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Ready to experience your space in 3D?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-light max-w-2xl mx-auto">
            Join thousands of homeowners and architects transforming their interior ideas into tangible digital twins.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push(user ? "/upload" : "/login")}
              className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-emerald-500/30 hover:scale-105"
            >
              <span>Launch HomeVerse Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 10. SAAS ARCHITECTURAL FOOTER */}
      {/* ========================================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#04070a] px-6 lg:px-12 py-14 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                HV
              </div>
              <span>HOMEVERSE SPATIAL OS</span>
            </div>
            <p className="text-slate-400 text-xs font-sans font-light max-w-sm">
              Transforming 2D room photos and architectural blueprints into interactive, editable 3D living spaces with real-time AI.
            </p>
            <div className="pt-2 text-[11px] text-emerald-400">
              ● All Systems Operational · Three.js v0.170
            </div>
          </div>

          <div>
            <div className="text-white font-bold uppercase tracking-wider mb-3">Product</div>
            <ul className="space-y-2 font-sans text-xs">
              <li><button onClick={() => scrollToSection("ai-engine")} className="hover:text-white">AI Vision Scanner</button></li>
              <li><button onClick={() => router.push("/studio")} className="hover:text-white">3D Studio Space</button></li>
              <li><button onClick={() => scrollToSection("workflow")} className="hover:text-white">CAD 2D Blueprint</button></li>
              <li><button onClick={() => scrollToSection("compare-styles")} className="hover:text-white">Furniture Marketplace</button></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold uppercase tracking-wider mb-3">Design DNA</div>
            <ul className="space-y-2 font-sans text-xs">
              <li><button onClick={() => setActiveDnaStyle("Japandi")} className="hover:text-white">Japandi</button></li>
              <li><button onClick={() => setActiveDnaStyle("Modern")} className="hover:text-white">Modern Minimal</button></li>
              <li><button onClick={() => setActiveDnaStyle("Scandinavian")} className="hover:text-white">Scandinavian</button></li>
              <li><button onClick={() => setActiveDnaStyle("Modern Luxury")} className="hover:text-white">Modern Luxury</button></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold uppercase tracking-wider mb-3">Company</div>
            <ul className="space-y-2 font-sans text-xs">
              <li><button onClick={() => router.push("/login")} className="hover:text-white">User Portal</button></li>
              <li><button onClick={() => router.push("/profile")} className="hover:text-white">Saved Projects</button></li>
              <li><a href="https://github.com/AnishaPaturi/HomeVerse" target="_blank" rel="noreferrer" className="hover:text-white">GitHub Repository</a></li>
              <li><button onClick={() => scrollToSection("pricing")} className="hover:text-white">Pricing Tiers</button></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div suppressHydrationWarning>
            © {new Date().getFullYear()} HomeVerse AI. Created by Anisha Paturi. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">Privacy Policy</span>
            <span className="text-slate-500">Terms of Service</span>
            <span className="text-slate-500">Security Architecture</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================================= */}
      {/* 11. INTERACTIVE DEMO MODAL */}
      {/* ========================================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-[#090e15] border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  HV
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">HomeVerse Interactive 3D Studio Preview</h3>
                  <p className="text-xs text-slate-400 font-mono">Live WebGL Spatial OS Demo</p>
                </div>
              </div>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Live 3D Scene */}
            <div className="h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-800">
              <Hero3DScene styleName={heroStyle} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono text-slate-400 hidden sm:block">
                Tip: Click & drag on the 3D canvas to inspect from all angles.
              </div>
              <button
                onClick={() => {
                  setDemoModalOpen(false);
                  router.push(user ? "/upload" : "/login");
                }}
                className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Launch Full 3D Studio →
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
