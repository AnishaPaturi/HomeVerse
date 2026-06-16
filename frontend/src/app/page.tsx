"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Check, 
  Layers, 
  AlertCircle, 
  ArrowRight, 
  Play, 
  Cpu, 
  Palette, 
  MessageSquare, 
  ShoppingCart, 
  Info, 
  Star, 
  ChevronRight, 
  HelpCircle,
  RefreshCw,
  Box
} from "lucide-react";
import Hero3DScene from "@/components/landing/Hero3DScene";

export default function HomePage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      setUser(JSON.parse(userSession));
      router.push("/upload");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.refresh();
  };
  
  // Hero 3D style state
  const [heroStyle, setHeroStyle] = useState<string>("Modern");

  // AI Copilot Simulator states
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "copilot",
      text: "Hello! I am your AI Design Copilot. Try clicking one of the preset prompts below to see how I can transform this 3D scene in real-time!",
      time: "Just now"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Upload/Demo States (MVP Core)
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing" | "complete">("idle");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern");
  const [generatedDesigns, setGeneratedDesigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sample styles for the MVP selector
  const styles = [
    { name: "Modern", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350", desc: "Sleek lines, dark wood accents, metal fixtures" },
    { name: "Japandi", img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350", desc: "East meets West. Warm wood, clean canvas, low profile" },
    { name: "Scandinavian", img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350", desc: "Light oak, high contrast, hygge vibes" },
    { name: "Minimalist", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350", desc: "Maximum space, hidden storage, monochrome" },
    { name: "Luxury", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350", desc: "Polished marble, gold lining, velvet upholstery" },
  ];

  // Simulated AI Copilot prompt handler
  const handleCopilotPrompt = (prompt: string, styleTarget: string, responseText: string) => {
    if (isTyping) return;

    // Add user message
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: prompt, time: "Just now" }
    ]);
    setIsTyping(true);

    // Simulate thinking and update style
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: responseText,
          time: "Just now"
        }
      ]);
      setHeroStyle(styleTarget);
      setIsTyping(false);
    }, 1200);
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setFileType(type);

    // Client-side Room Validation
    const filenameLower = file.name.toLowerCase();
    const nonRoomKeywords = [
      "cat", "dog", "animal", "car", "vehicle", "apple", "banana", "fruit", 
      "outdoor", "outside", "landscape", "nature", "forest", "mountain", 
      "ocean", "beach", "sky", "garden", "park", "street", "exterior",
      "cityscape", "food"
    ];
    let isRoom = true;
    for (const kw of nonRoomKeywords) {
      if (filenameLower.includes(kw)) {
        isRoom = false;
        break;
      }
    }

    if (!isRoom) {
      setError("Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room or home area.");
      setUploadStep("idle");
      setSelectedFile(null);
      return;
    }

    setUploadStep("uploading");

    // Retrieve active user ID
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    try {
      // 1. Create project on backend
      const projTitle = file.name.split(".")[0] || "My Interior Design";
      let projectData = null;

      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: "Living Room",
            thumbnail: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350",
            user_id: userId
          })
        });
        if (projRes.ok) {
          projectData = await projRes.json();
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client-side UUID:", err);
      }

      const projectId = projectData?.id || crypto.randomUUID();

      // Trigger UI analysis state
      setTimeout(() => {
        setUploadStep("analyzing");
      }, 1000);

      // 2. Upload file & analyze on backend
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("file", file);

      let designsList = [];
      try {
        const analyzeRes = await fetch("http://localhost:8080/api/ai/analyze-upload", {
          method: "POST",
          body: formData
        });
        if (analyzeRes.ok) {
          designsList = await analyzeRes.json();
        } else {
          const errData = await analyzeRes.json();
          throw new Error(errData.detail || "Backend analysis failed");
        }
      } catch (err: any) {
        console.warn("Backend analysis failed, fallback to local mock designs:", err);
        if (err.message.includes("Not appropriate data")) {
          throw err;
        }
        // Fallback mock designs
        designsList = [
          { id: crypto.randomUUID(), style: "Modern", image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Japandi", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Scandinavian", image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Minimalist", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Luxury", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350" }
        ];
      }

      setGeneratedDesigns(designsList);
      
      // Delay completion step for smoother UX animation
      setTimeout(() => {
        setUploadStep("complete");
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during room analysis. Please try again.");
      setUploadStep("idle");
      setSelectedFile(null);
    }
  };

  const handleEnterStudio = () => {
    // Find design matching the selected style
    const matchedDesign = generatedDesigns.find(
      (d) => d.style.toLowerCase() === selectedStyle.toLowerCase()
    );
    if (matchedDesign) {
      router.push(`/studio?style=${selectedStyle}&designId=${matchedDesign.id}`);
    } else {
      router.push(`/studio?style=${selectedStyle}`);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Redirecting to design studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
            HomeVerse
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer">Features</button>
          <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
          <button onClick={() => scrollToSection("copilot-demo")} className="hover:text-white transition-colors cursor-pointer">AI Copilot</button>
          <button onClick={() => scrollToSection("playground")} className="hover:text-white transition-colors cursor-pointer text-blue-400">Launch Demo</button>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold px-3 py-1.5 bg-blue-950/40 text-blue-400 border border-blue-900/60 rounded-full hidden sm:inline-block">
            MVP Academic Prototype
          </span>
          {user ? (
            <div className="flex items-center gap-2.5">
              <div 
                onClick={() => router.push("/profile")}
                className="w-8 h-8 rounded-full bg-indigo-650 hover:bg-indigo-500 border border-indigo-500/50 hover:border-indigo-400 flex items-center justify-center font-bold text-xs cursor-pointer select-none text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                title={`View Profile: ${user.name} (${user.email}) - Plan: ${user.plan}`}
              >
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold hover:text-white text-slate-400 border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-xs font-semibold text-slate-350 hover:text-white border border-slate-800 bg-slate-900/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hover:bg-slate-900/50"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => router.push(user ? "/upload" : "/login")}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all cursor-pointer glow-btn shadow-md shadow-blue-600/20"
          >
            Launch Studio
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 px-6 border-b border-slate-900">
        {/* Abstract Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row gap-12 items-center relative z-10">
          {/* Hero Content Left */}
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/30 border border-blue-900/40 rounded-full text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" /> Introducing Next-Gen AI Room Customization
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
              Transform Your Space <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Instantly with AI & 3D
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload a single room photo or a 3D video walkthrough. HomeVerse reconstructs it into an editable, interactive 3D studio where you can customize furniture, swap styles, and collaborate with an AI design partner.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => scrollToSection("playground")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn shadow-lg shadow-blue-500/20 text-sm"
              >
                Try Interactive Demo <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(user ? "/upload" : "/login")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-905 hover:bg-slate-800 text-slate-205 border border-slate-800 hover:border-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
              >
                Open Empty Studio
              </button>
            </div>

            {/* Quick Feature Accents */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-900 max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-2xl font-black text-slate-200">5+</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Style Presets</div>
              </div>
              <div className="border-l border-slate-900 pl-4">
                <div className="text-2xl font-black text-slate-200">Instant</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">AI Room Scan</div>
              </div>
              <div className="border-l border-slate-900 pl-4">
                <div className="text-2xl font-black text-slate-200">Interactive</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">3D Editor</div>
              </div>
            </div>
          </div>

          {/* Hero 3D Showroom Right */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="aspect-[4/3] w-full min-h-[350px]">
              <Hero3DScene styleName={heroStyle} />
            </div>

            {/* Live Theme Controller */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider text-[10px] font-mono">
                Active Preset:
              </span>
              {["Modern", "Scandinavian", "Japandi", "Minimalist", "Luxury"].map((style) => (
                <button
                  key={style}
                  onClick={() => setHeroStyle(style)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    heroStyle === style
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Section */}
      <section className="py-6 bg-slate-950 overflow-hidden border-b border-slate-900 select-none">
        <div className="space-y-4">
          {/* Row 1: Leftward Marquee */}
          <div className="marquee-container">
            <div className="animate-marquee-left flex gap-12 items-center text-sm font-semibold tracking-wider text-slate-500 uppercase font-mono">
              <span>Japandi Style</span> <span className="text-blue-500">•</span>
              <span>Real-Time 3D Rendering</span> <span className="text-indigo-500">•</span>
              <span>AI Room Reconstruction</span> <span className="text-purple-500">•</span>
              <span>Custom Material Editor</span> <span className="text-blue-500">•</span>
              <span>Scandinavian Design</span> <span className="text-indigo-500">•</span>
              <span>Instant AI Styling</span> <span className="text-purple-500">•</span>
              <span>Smart Scene Layouts</span> <span className="text-blue-500">•</span>
              <span>Photorealistic Walkthroughs</span> <span className="text-indigo-500">•</span>
              
              {/* Duplicate for loop */}
              <span>Japandi Style</span> <span className="text-blue-500">•</span>
              <span>Real-Time 3D Rendering</span> <span className="text-indigo-500">•</span>
              <span>AI Room Reconstruction</span> <span className="text-purple-500">•</span>
              <span>Custom Material Editor</span> <span className="text-blue-500">•</span>
              <span>Scandinavian Design</span> <span className="text-indigo-500">•</span>
              <span>Instant AI Styling</span> <span className="text-purple-500">•</span>
              <span>Smart Scene Layouts</span> <span className="text-blue-500">•</span>
              <span>Photorealistic Walkthroughs</span> <span className="text-indigo-500">•</span>
            </div>
          </div>

          {/* Row 2: Rightward Marquee */}
          <div className="marquee-container">
            <div className="animate-marquee-right flex gap-12 items-center text-sm font-semibold tracking-wider text-slate-600 uppercase font-mono">
              <span>Interactive Furniture Swapping</span> <span className="text-purple-500">•</span>
              <span>Wabi-Sabi Aesthetics</span> <span className="text-blue-500">•</span>
              <span>Mid-Century Modern</span> <span className="text-indigo-500">•</span>
              <span>Live AI Design Copilot</span> <span className="text-purple-500">•</span>
              <span>Smart Furniture Marketplace</span> <span className="text-blue-500">•</span>
              <span>Instant Material Swap</span> <span className="text-indigo-500">•</span>
              <span>Multi-Style Visualizations</span> <span className="text-purple-500">•</span>

              {/* Duplicate for loop */}
              <span>Interactive Furniture Swapping</span> <span className="text-purple-500">•</span>
              <span>Wabi-Sabi Aesthetics</span> <span className="text-blue-500">•</span>
              <span>Mid-Century Modern</span> <span className="text-indigo-500">•</span>
              <span>Live AI Design Copilot</span> <span className="text-purple-500">•</span>
              <span>Smart Furniture Marketplace</span> <span className="text-blue-500">•</span>
              <span>Instant Material Swap</span> <span className="text-indigo-500">•</span>
              <span>Multi-Style Visualizations</span> <span className="text-purple-500">•</span>
            </div>
          </div>
        </div>
      </section>

      {/* Explainer / Workflow Roadmap */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl w-full mx-auto border-b border-slate-900">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How HomeVerse Transforms Your Room
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Our pipeline seamlessly integrates state-of-the-art computer vision models with real-time 3D interactive graphics.
          </p>
        </div>

        {/* Step-by-Step Roadmap Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl relative space-y-4 group">
            <div className="absolute top-0 right-0 p-4 font-black text-slate-800 text-5xl select-none group-hover:text-blue-500/10 transition-colors">
              01
            </div>
            <div className="p-3 bg-blue-950/40 border border-blue-950 text-blue-400 rounded-xl w-fit">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">1. Capture & Upload</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take a single picture of your room from any angle, or upload a video walkthrough scan.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl relative space-y-4 group">
            <div className="absolute top-0 right-0 p-4 font-black text-slate-800 text-5xl select-none group-hover:text-indigo-500/10 transition-colors">
              02
            </div>
            <div className="p-3 bg-indigo-950/40 border border-indigo-950 text-indigo-400 rounded-xl w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">2. Semantic AI Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI automatically recognizes your room layout, identifying walls, floors, windows, and existing furniture pieces in seconds.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl relative space-y-4 group">
            <div className="absolute top-0 right-0 p-4 font-black text-slate-800 text-5xl select-none group-hover:text-purple-500/10 transition-colors">
              03
            </div>
            <div className="p-3 bg-purple-950/40 border border-purple-950 text-purple-400 rounded-xl w-fit">
              <Palette className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors">3. Style Variations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get 5 distinct interior design styles generated by AI, mapped to standard furniture catalog items.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl relative space-y-4 group">
            <div className="absolute top-0 right-0 p-4 font-black text-slate-800 text-5xl select-none group-hover:text-emerald-500/10 transition-colors">
              04
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-950 text-emerald-400 rounded-xl w-fit">
              <Box className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">4. Interactive 3D Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hop into the editor! Select items, apply custom colors/materials, move items around, or ask the Copilot to redesign on the fly.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* AI Design Copilot Feature Featurette & Interactive Chat Simulator */}
      <section id="copilot-demo" className="py-20 px-6 max-w-6xl w-full mx-auto border-b border-slate-900">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Text Info Left */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/30 border border-indigo-900/40 rounded-full text-xs font-semibold text-indigo-400">
              <MessageSquare className="w-3.5 h-3.5" /> Conversational AI Partner
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Design via Conversation with <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AI Design Copilot
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Don't want to tweak every single detail manually? Just describe what you want. The AI Copilot interprets your instructions to update materials, adjust floor colors, add specific items, and reconfigure layouts.
            </p>

            {/* Simulator Prompts Triggers */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Click a command to test the simulator:
              </span>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => 
                    handleCopilotPrompt(
                      "Make this room cozy & warm", 
                      "Japandi", 
                      "Applying Japandi aesthetic! Upholstering the sofa in rich tan leather, swapping the coffee table for dark walnut wood, and setting the walls to a warm off-white."
                    )
                  }
                  disabled={isTyping}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer font-semibold"
                >
                  "Make it cozy & warm" 🍂
                </button>
                <button
                  onClick={() => 
                    handleCopilotPrompt(
                      "Convert this room into a minimalist home office", 
                      "Minimalist", 
                      "Setting up a clean Minimalist work study! Changing the desk material to steel grey, opting for a concrete slate coffee table, and setting the walls to clean clinical white."
                    )
                  }
                  disabled={isTyping}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer font-semibold"
                >
                  "Convert to home office" 💻
                </button>
                <button
                  onClick={() => 
                    handleCopilotPrompt(
                      "Apply luxury green velvet materials", 
                      "Luxury", 
                      "Executing Luxury theme! Changing the sofa material to deep teal velvet, table trim to gold brass, and setting the walls to dark royal indigo."
                    )
                  }
                  disabled={isTyping}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer font-semibold"
                >
                  "Green velvet luxury" 💎
                </button>
                <button
                  onClick={() => 
                    handleCopilotPrompt(
                      "Reset the layout style to defaults", 
                      "Modern", 
                      "Restoring Modern defaults. Applying clean slate walls, dark grey floor, charcoal sofa, and natural walnut coffee table."
                    )
                  }
                  disabled={isTyping}
                  className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer font-semibold"
                >
                  "Reset layout" 🔄
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Chat Console Right */}
          <div className="w-full lg:w-1/2">
            <div className="glass-panel border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[350px]">
              
              {/* Header */}
              <div className="bg-slate-900/80 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600/10 p-1.5 rounded-lg border border-blue-500/20">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">AI Design Copilot Simulator</h4>
                    <span className="text-[9px] text-slate-500 font-medium">Connected to 3D Viewport</span>
                  </div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[80%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-slate-900/90 border border-slate-850 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-500 mt-1 font-mono">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex flex-col items-start mr-auto max-w-[80%]">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Footer */}
              <div className="bg-slate-950 px-4 py-3 border-t border-slate-900/60 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Click a preset prompt above to send..."
                  disabled
                  className="flex-1 bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs text-slate-400 focus:outline-none placeholder-slate-600"
                />
                <button 
                  disabled 
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-600 rounded-xl cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Core Tool / Upload Playground (Brings existing functionality) */}
      <section id="playground" className="py-20 px-6 max-w-6xl w-full mx-auto border-b border-slate-900 relative">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/30 border border-blue-900/40 rounded-full text-xs font-semibold text-blue-400">
            <Play className="w-3 h-3" /> Live Sandbox
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Interactive Upload Playground
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Test the MVP core pipeline. Drag and drop a photo/video walkthrough of your room, wait for our simulated AI to run segmentation, then launch the studio!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Side: Upload Panel */}
          <div className="w-full lg:w-1/2 space-y-6">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-400 rounded-2xl text-xs flex items-start gap-3 shadow-lg animate-fadeIn">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-300">Invalid Upload Attempt</h4>
                  <p className="text-red-400/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
            <div className="glass-panel p-6 rounded-2xl border-slate-800/80 space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Upload Console
                </span>
                <span className="text-[10px] text-blue-400 font-semibold px-2 py-0.5 bg-blue-950/40 border border-blue-900/40 rounded-full">
                  Status: {uploadStep.toUpperCase()}
                </span>
              </div>

              {/* Upload Dropzone */}
              {uploadStep === "idle" && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative group ${
                    dragActive
                      ? "border-blue-500 bg-blue-950/20"
                      : "border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-blue-500/40 group-hover:bg-slate-900 transition-colors">
                      <Upload className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, or MP4 (Video walkthrough)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Room Photo</span>
                      <span className="text-slate-700">|</span>
                      <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video Scan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploading progress */}
              {uploadStep === "uploading" && (
                <div className="border border-slate-800 rounded-2xl p-8 space-y-4 text-center bg-slate-950/30">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h3 className="font-bold text-sm">Uploading Assets...</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-xs mx-auto">File: {selectedFile?.name}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis pipeline logs */}
              {uploadStep === "analyzing" && (
                <div className="border border-slate-850 rounded-2xl p-6 space-y-5 bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" /> AI Room Reconstruction
                    </h3>
                    <span className="text-[10px] text-blue-400 font-mono animate-pulse">Running AI Layout Scan...</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded-xl border border-slate-900/60 leading-relaxed">
                    <div className="flex items-center justify-between text-green-400">
                      <span>✔ Loaded {fileType} file metadata</span>
                      <span>[OK]</span>
                    </div>
                    <div className="flex items-center justify-between text-green-400">
                      <span>✔ Furniture Recognition (Sofa, Table, TV)</span>
                      <span>[OK]</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-400">
                      <span className="animate-pulse">🔄 Segmenting walls, doors, ceiling</span>
                      <span>[RUNNING]</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-650">
                      <span>☐ Creating 3D semantic layout coordinates</span>
                      <span>[WAITING]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style Presets selection after analysis */}
              {uploadStep === "complete" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                    <div>
                      <h3 className="font-bold text-xs text-slate-200">AI Design Suggestions</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Choose your design style to open in 3D studio</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold bg-green-950/20 border border-green-900/40 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" /> Reconstruction Complete
                    </span>
                  </div>

                  {/* Grid of Styles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {styles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => setSelectedStyle(style.name)}
                        className={`group relative rounded-xl overflow-hidden border text-left p-3.5 bg-slate-950/50 hover:bg-slate-900/80 transition-all cursor-pointer ${
                          selectedStyle === style.name
                            ? "border-blue-500 ring-1 ring-blue-500/50"
                            : "border-slate-850"
                        }`}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                          <img src={style.img} alt={style.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                        </div>
                        <span className="font-bold text-xs text-slate-200">{style.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Enter Studio Trigger */}
                  <button
                    onClick={handleEnterStudio}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all cursor-pointer glow-btn mt-4 text-sm"
                  >
                    Open in Design Studio <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right Side: Demo showcase preview */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Workspace Preview</span>
                <span className={`w-2.5 h-2.5 rounded-full ${uploadStep === "complete" ? "bg-emerald-500 animate-pulse" : "bg-blue-500 animate-pulse"}`} />
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {uploadStep === "complete" ? (
                  <img
                    src={styles.find((s) => s.name === selectedStyle)?.img}
                    alt={selectedStyle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                    <Layers className="w-12 h-12 mb-3 text-slate-800" />
                    <p className="text-sm font-semibold text-slate-400">3D Room View Empty</p>
                    <p className="text-xs max-w-xs mt-1 text-slate-500 leading-relaxed">
                      Upload a photo or video walkthrough to see the AI redesign options and enter the editable viewport.
                    </p>
                  </div>
                )}
              </div>

              {uploadStep === "complete" && (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850">
                  <span className="text-xs font-semibold text-blue-400 block mb-1">Style Profile: {selectedStyle}</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {styles.find((s) => s.name === selectedStyle)?.desc}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Bypass / Demo Trigger */}
            <div className="border border-slate-800 bg-slate-900/20 p-5 rounded-2xl flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-slate-200">Testing Without Uploading?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  You can bypass upload to test immediately. Click the button below to load our pre-analyzed demo room template right inside the studio.
                </p>
                <button
                  onClick={() => router.push("/studio?style=Modern")}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-blue-950/20 border border-blue-900/40 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Launch Pre-Loaded Demo Studio →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Details */}
      <section id="features" className="py-20 px-6 max-w-6xl w-full mx-auto border-b border-slate-900">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Advanced Design Capabilities
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            HomeVerse combines intelligent computer vision, spatial AI, and interactive 3D modeling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tech 1 */}
          <div className="glass-card p-6 rounded-2xl border-slate-850 space-y-3">
            <div className="p-3 bg-blue-950/30 text-blue-400 border border-blue-950 rounded-xl w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Layout & Object Mapping</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our spatial analysis model detects existing furniture, estimates exact dimensional bounding boxes, and traces wall boundary locations to build a scale-accurate layout.
            </p>
          </div>

          {/* Tech 2 */}
          <div className="glass-card p-6 rounded-2xl border-slate-850 space-y-3">
            <div className="p-3 bg-indigo-950/30 text-indigo-400 border border-indigo-950 rounded-xl w-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">AI Design Swapping</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A generative styling engine redraws your room's style into multiple presets instantly, keeping structural lines identical while applying new colors, decorations, and aesthetics.
            </p>
          </div>

          {/* Tech 3 */}
          <div className="glass-card p-6 rounded-2xl border-slate-850 space-y-3">
            <div className="p-3 bg-purple-950/30 text-purple-400 border border-purple-950 rounded-xl w-fit">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Real-Time 3D Customizer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directly edit the workspace in real-time. Click to select items, drag to move them, customize finishes or materials, and view changes from any perspective.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 px-6 border-t border-slate-900 text-center space-y-4 text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" /> HomeVerse
        </div>
        <p className="max-w-md mx-auto leading-relaxed">
          HomeVerse is an Academic Prototype MVP designed for AI-Powered Interior Design. Powered by FastAPI, Next.js, and Three.js.
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">GitHub Repository</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
        <p className="pt-2">© 2026 HomeVerse Project. All rights reserved.</p>
      </footer>
    </div>
  );
}
