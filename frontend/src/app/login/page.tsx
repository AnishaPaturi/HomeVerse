"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Box,
  CheckCircle2,
  Wand2,
  Compass,
  Layers,
  Star
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Toggle between 'login' and 'signup' mode
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLoginMode(false);
    } else {
      setIsLoginMode(true);
    }
  }, [searchParams]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("Free");

  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Style details state for showcase preview
  const styleDetails: Record<string, { desc: string; img: string; title: string }> = {
    Contemporary: {
      title: "Contemporary Sculptural & Fluid Suite",
      desc: "Curved fluid silhouettes, soft ambient illumination, plush bouclé fabrics, and organic architectural forms.",
      img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=400"
    },
    Scandinavian: {
      title: "Scandinavian Nordic Daylight Suite",
      desc: "Bright airy aesthetic with bleached oak, high contrast accents, hygge textiles, and functional furniture.",
      img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400"
    },
    Modern: {
      title: "Modern Minimalist Studio Suite",
      desc: "Clean geometric lines, dark walnut accents, matte black metal fixtures, and monochromatic schemes.",
      img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400"
    },
    Japandi: {
      title: "Japandi & Wabi-Sabi Interior Suite",
      desc: "Real-time photorealistic lighting & floorplan matching with warm light wood and natural wabi-sabi textures.",
      img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=400"
    },
    Minimalist: {
      title: "Pure Architectural Minimalist Suite",
      desc: "Decluttered architectural pureness with hidden storage, concealed LED lighting, and smooth surfaces.",
      img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400"
    },
    "Modern Luxury": {
      title: "Modern Luxury Marble & Brass Suite",
      desc: "Opulent interior finishes with Calacatta marble, brushed gold trims, and velvet upholstery.",
      img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400"
    }
  };

  const [selectedStyle, setSelectedStyle] = useState<string>("Japandi");
  const DEMO_EMAIL = "demo@homeverse.ai";
  const DEMO_PASSWORD = "demo";
  const DEMO_NAME = "Demo Designer";

  // Check if already logged in
  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      router.push("/upload");
    }
  }, [router]);

  // Handle Demo Login
  const handleDemoLogin = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Autofill values for visual effect
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setName(DEMO_NAME);

    setTimeout(async () => {
      try {
        let demoUser = {
          id: "d0000000-0000-0000-0000-000000000000",
          name: DEMO_NAME,
          email: DEMO_EMAIL,
          plan: "Premium",
          isDemo: true
        };

        // Try registering/fetching demo user in backend if it's running
        try {
          const res = await fetch(`http://localhost:8080/api/auth/me?email=${DEMO_EMAIL}`);
          let data;
          if (res.ok) {
            data = await res.json();
          } else {
            const regRes = await fetch("http://localhost:8080/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: DEMO_NAME,
                email: DEMO_EMAIL,
                plan: "Premium"
              })
            });
            if (regRes.ok) {
              data = await regRes.json();
            }
          }
          if (data && data.id) {
            demoUser.id = data.id;
          }
        } catch (backendErr) {
          console.warn("Backend server not reachable, logging in locally:", backendErr);
        }

        // Save to sessionStorage
        sessionStorage.setItem("user", JSON.stringify(demoUser));
        setSuccess("Success! Logged in with Demo credentials.");
        
        setTimeout(() => {
          router.push("/upload");
          router.refresh();
        }, 800);
      } catch (err: any) {
        setError("Something went wrong with the demo login.");
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  // Handle Submit (Standard registration or login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLoginMode) {
        // --- LOGIN MODE ---
        let userData = { id: "d0000000-0000-0000-0000-000000000000", name: email.split("@")[0], email, plan: "Free" };

        try {
          const response = await fetch(`http://localhost:8080/api/auth/me?email=${email}`);
          if (response.ok) {
            const data = await response.json();
            userData = { id: data.id, name: data.name, email: data.email, plan: data.plan };
          } else {
            throw new Error("User not found in database. Please sign up first.");
          }
        } catch (backendErr: any) {
          console.warn("Backend offline or error, logging in locally:", backendErr.message);
          if (backendErr.message.includes("database")) {
            throw backendErr;
          }
        }

        sessionStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Welcome back! Logging in...");
        
        setTimeout(() => {
          router.push("/upload");
          router.refresh();
        }, 1000);

      } else {
        // --- SIGNUP MODE ---
        let userData = { id: "d0000000-0000-0000-0000-000000000000", name, email, plan };

        try {
          const response = await fetch("http://localhost:8080/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name,
              email,
              plan
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Registration failed.");
          }

          const data = await response.json();
          userData = { id: data.id, name: data.name, email: data.email, plan: data.plan };
        } catch (backendErr: any) {
          console.warn("Backend offline or error, registering locally:", backendErr.message);
          if (backendErr.message.includes("failed") || backendErr.message.includes("registered")) {
            throw backendErr;
          }
        }

        sessionStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Account created successfully!");
        
        setTimeout(() => {
          router.push("/upload");
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#041a18] text-slate-100 font-sans selection:bg-[#0d9488] selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Backdrop Image with Emerald Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000"
          alt="Emerald Interior Twin"
          className="w-full h-full object-cover object-center filter brightness-[0.22] contrast-[1.1] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041a18] via-[#041a18]/70 to-[#041a18]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041a18] via-[#041a18]/85 to-[#041a18]/60" />
      </div>

      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0d9488]/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-[#059669]/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-[#042f2c]/60 rounded-full blur-[140px]" />
      </div>

      {/* ---------------- Navigation Bar Header ---------------- */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => router.push("/")} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-[#0d9488] p-2 rounded-xl border border-emerald-400/30 group-hover:scale-105 transition-transform shadow-lg shadow-[#0d9488]/20">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-2xl font-extrabold tracking-tight text-white group-hover:text-[#0d9488] transition-colors">
            HOME<span className="text-emerald-400">VERSE</span>
          </span>
        </div>

        {/* Back to Home Button */}
        <button
          suppressHydrationWarning
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#062421]/90 hover:bg-[#062421] border border-emerald-800/60 hover:border-emerald-500/60 px-4 py-2 rounded-full transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" /> Back to Home
        </button>
      </header>

      {/* ---------------- Main Content Grid ---------------- */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side Visual Showcase (Visible on Large Screens) */}
        <div className="lg:col-span-6 xl:col-span-7 hidden lg:flex flex-col justify-center space-y-8 pr-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0d9488]/20 border border-[#0d9488]/40 rounded-full text-xs font-semibold text-emerald-300 w-fit shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> AI Spatial Reconstruction & 3D Twin Studio
          </div>

          <h1 className="font-serif text-4xl xl:text-5xl font-extrabold leading-[1.18] text-white tracking-tight">
            Reimagine Any Room in Photorealistic <span className="text-emerald-400 italic">3D Precision</span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-lg font-light">
            Step into HomeVerse to transform 2D room photos into interactive 3D spatial twins, re-skin interior materials, and consult your AI copilot in real time.
          </p>

          {/* Feature Bullets */}
          <div className="space-y-3.5 pt-1 text-xs text-slate-200 font-medium">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-[#0d9488]/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Instant 2D-to-3D Floorplan & Spatial Reconstruction</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-[#0d9488]/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Real-time Material Swap & Texture Re-skinning</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-[#0d9488]/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Interactive AI Copilot for Automated Room Styling</span>
            </div>
          </div>

          {/* Interactive Style Previewer Showcase */}
          <div className="relative pt-2 max-w-lg space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {Object.keys(styleDetails).map((styleKey) => (
                <button
                  suppressHydrationWarning
                  key={styleKey}
                  type="button"
                  onClick={() => setSelectedStyle(styleKey)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedStyle === styleKey
                      ? "bg-[#0d9488] text-white shadow-sm shadow-[#0d9488]/30"
                      : "bg-[#042f2c]/60 hover:bg-[#062421] text-slate-300 border border-emerald-900/50"
                  }`}
                >
                  {styleKey}
                </button>
              ))}
            </div>

            <div className="bg-[#062421]/90 backdrop-blur-md border border-emerald-800/50 rounded-2xl p-4 shadow-xl flex items-center gap-4 transition-all">
              <img 
                src={styleDetails[selectedStyle].img} 
                alt={selectedStyle} 
                className="w-20 h-20 rounded-xl object-cover border border-emerald-500/30 shrink-0 shadow-md transition-all duration-300"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1 text-[#0d9488]">
                  <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs font-bold text-white">4.9/5</span>
                  <span className="text-[11px] text-emerald-300/80 pl-1">(2,400+ Designers)</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{styleDetails[selectedStyle].title}</h4>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{styleDetails[selectedStyle].desc}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Form Panel */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
          
          <div className="bg-[#062421]/90 backdrop-blur-xl border border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#041a18] p-1.5 rounded-2xl border border-emerald-900/60">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2.5 text-xs rounded-xl transition-all cursor-pointer text-center ${
                  isLoginMode
                    ? "bg-[#0d9488] text-white font-bold shadow-md shadow-[#0d9488]/20"
                    : "text-slate-400 hover:text-slate-200 font-medium"
                }`}
              >
                Sign In
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2.5 text-xs rounded-xl transition-all cursor-pointer text-center ${
                  !isLoginMode
                    ? "bg-[#0d9488] text-white font-bold shadow-md shadow-[#0d9488]/20"
                    : "text-slate-400 hover:text-slate-200 font-medium"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Header Text */}
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-serif font-extrabold text-white">
                {isLoginMode ? "Welcome Back" : "Join HomeVerse"}
              </h2>
              <p className="text-xs text-slate-300 font-light">
                {isLoginMode
                  ? "Enter your credentials to access your 3D design studio"
                  : "Start designing photorealistic 3D interior twins today"}
              </p>
            </div>

            {/* Success / Error Banners */}
            {error && (
              <div className="p-3.5 bg-red-950/50 border border-red-800/60 text-red-300 rounded-xl text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Signup only) */}
              {!isLoginMode && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      suppressHydrationWarning
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#041a18] border border-emerald-900/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 placeholder:text-emerald-700/60 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    suppressHydrationWarning
                    type="email"
                    required
                    placeholder="designer@homeverse.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#041a18] border border-emerald-900/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 placeholder:text-emerald-700/60 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    suppressHydrationWarning
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#041a18] border border-emerald-900/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 placeholder:text-emerald-700/60 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Plan Selection (Signup mode only) */}
              {!isLoginMode && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
                    Plan Tier
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {["Free", "Premium"].map((tier) => (
                      <button
                        suppressHydrationWarning
                        key={tier}
                        type="button"
                        onClick={() => setPlan(tier)}
                        className={`text-xs py-2.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                          plan === tier
                            ? "bg-[#0d9488]/20 border-emerald-400 text-emerald-300 shadow-sm"
                            : "bg-[#041a18] border-emerald-900/70 hover:border-emerald-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#0d9488]/30 glow-btn mt-3 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLoginMode ? (
                  <>Sign In To Studio <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Create Account <Check className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Dev Options Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-emerald-900/60" />
              </div>
              <span className="relative bg-[#062421] px-3 text-[10px] uppercase font-extrabold text-emerald-500/80 tracking-widest z-10 select-none">
                Dev Access
              </span>
            </div>

            {/* Quick Demo Login Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-950/80 via-[#042f2c] to-emerald-950/80 hover:from-emerald-900/80 hover:to-emerald-900/80 border border-emerald-700/50 rounded-xl text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Login with Demo Credentials</span>
            </button>

          </div>

        </div>

      </main>

      {/* ---------------- Footer Bar ---------------- */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-4 text-center text-[11px] text-emerald-600/70 border-t border-emerald-900/30">
        © 2026 HomeVerse AI. All rights reserved. • Photorealistic 3D Spatial Architecture
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#041a18] text-emerald-300 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold tracking-wide">Loading authentication workspace...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
