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
  CheckCircle2,
  Star
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mode: 'login' | 'signup'
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

  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const DEMO_EMAIL = "designer@homeverse.ai";
  const DEMO_PASSWORD = "demo";
  const DEMO_NAME = "Anisha Paturi";

  const TESTER_EMAIL = "demo@homeverse.ai";
  const TESTER_NAME = "Demo Tester";

  // Check if already logged in
  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      router.push("/upload");
    }
  }, [router]);

  // Handle Demo Login
  const handleDemoLogin = async (asTester: boolean = false) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetEmail = asTester ? TESTER_EMAIL : DEMO_EMAIL;
    const targetName = asTester ? TESTER_NAME : DEMO_NAME;
    const targetId = asTester ? "d1111111-1111-1111-1111-111111111111" : "d0000000-0000-0000-0000-000000000000";

    setEmail(targetEmail);
    setPassword(DEMO_PASSWORD);
    setName(targetName);

    try {
      // Sync with backend demo endpoint if backend is running
      await fetch("http://localhost:8080/api/auth/demo", { method: "POST" });
    } catch (_) {
      // Graceful offline fallback
    }

    setTimeout(() => {
      const demoUser = {
        id: targetId,
        name: targetName,
        email: targetEmail,
        plan: "Pro Designer",
        isDemo: true,
      };

      sessionStorage.setItem("user", JSON.stringify(demoUser));
      setSuccess(`Welcome ${targetName}! Entering HomeVerse Studio...`);
      
      setTimeout(() => {
        router.push("/upload");
        router.refresh();
      }, 500);
      setLoading(false);
    }, 600);
  };

  const handleFillCredentials = (emailVal: string, nameVal: string) => {
    setEmail(emailVal);
    setPassword("demo");
    setName(nameVal);
  };

  // Handle Submit (Login or Signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    let assignedId = "d0000000-0000-0000-0000-000000000000";

    try {
      const res = await fetch(`http://localhost:8080/api/auth/login?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) assignedId = data.id;
      }
    } catch (_) {
      // Fallback
    }

    setTimeout(() => {
      const userData = {
        id: assignedId,
        name: isLoginMode ? (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)) : name,
        email,
        plan: "Pro Designer",
      };

      sessionStorage.setItem("user", JSON.stringify(userData));
      setSuccess(isLoginMode ? "Welcome back! Entering studio..." : "Account created successfully! Launching...");

      setTimeout(() => {
        router.push("/upload");
        router.refresh();
      }, 600);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      
      {/* Top Header Navigation */}
      <header className="h-16 px-6 lg:px-12 bg-[#090e15]/80 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between z-30">
        <div 
          onClick={() => router.push("/")} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-mono font-bold text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            HV
          </div>
          <span className="font-mono text-base font-bold text-white tracking-tight">
            HOMEVERSE
          </span>
        </div>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main SaaS Split Layout */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Visual Statement & Image Preview */}
        <div className="lg:col-span-6 hidden lg:flex flex-col justify-center space-y-8 pr-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI SPATIAL CAD OS</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
            Your space.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Your vision.
            </span>
          </h1>

          <p className="text-slate-300 text-base font-light leading-relaxed max-w-md">
            Turn any room photo, architectural floorplan, or creative prompt into an editable 3D digital twin in seconds.
          </p>

          {/* Social Proof Badge */}
          <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08] flex items-center gap-4 max-w-md shadow-xl">
            <div className="flex -space-x-2">
              {["https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100"].map((img, i) => (
                <img key={i} src={img} alt="User avatar" className="w-8 h-8 rounded-full border-2 border-[#090e15] object-cover" />
              ))}
            </div>
            <div className="space-y-0.5 text-xs font-mono">
              <div className="flex items-center gap-1 text-emerald-400">
                <Star className="w-3.5 h-3.5 fill-emerald-400" />
                <span className="font-bold text-white">4.9 / 5.0</span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">Used by 2,400+ homeowners & interior studios</div>
            </div>
          </div>

        </div>

        {/* Right Column: Clean SaaS Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#05070a] p-1 rounded-2xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                  isLoginMode ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                  !isLoginMode ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                {isLoginMode ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="text-xs text-slate-400 font-light">
                {isLoginMode ? "Access your saved 3D digital twins and active studio projects." : "Start building your 3D digital room in seconds."}
              </p>
            </div>

            {/* Error / Success Banners */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-mono">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
              
              {!isLoginMode && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Anisha Paturi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="designer@homeverse.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLoginMode ? "Sign In to Studio" : "Create Account"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Option */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-slate-800" />
              <span className="absolute bg-[#090e15] px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                OR
              </span>
            </div>

            {/* Demo Accounts Section */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>⚡ 1-Click Demo Profiles</span>
                <span className="text-emerald-400">DEV & TESTING</span>
              </div>

              {/* Designer Demo Account */}
              <button
                type="button"
                onClick={() => handleDemoLogin(false)}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    AP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Anisha Paturi (Lead Designer)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      designer@homeverse.ai · Pro Studio
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* QA / Tester Demo Account */}
              <button
                type="button"
                onClick={() => handleDemoLogin(true)}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
                    DT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      Demo Tester (QA Profile)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      demo@homeverse.ai · Pro Designer
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* Quick credentials hint */}
            <div className="p-2.5 rounded-xl bg-[#05070a] border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Password for all demo accounts: <strong className="text-emerald-400 font-bold">demo</strong></span>
              <button
                type="button"
                onClick={() => handleFillCredentials(DEMO_EMAIL, DEMO_NAME)}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Autofill
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06]">
        © {new Date().getFullYear()} HomeVerse AI. Spatial CAD & Generative Architecture OS.
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b10] flex items-center justify-center text-emerald-400 font-mono">LOADING HOMEVERSE AUTH...</div>}>
      <LoginContent />
    </Suspense>
  );
}
