"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, Check, AlertCircle } from "lucide-react";

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

  // Demo Credentials
  const DEMO_EMAIL = "demo@homeverse.ai";
  const DEMO_PASSWORD = "demo";
  const DEMO_NAME = "Demo Designer";

  // Check if already logged in
  useEffect(() => {
    const userSession = localStorage.getItem("user");
    if (userSession) {
      router.push("/studio?style=Modern");
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
          id: "00000000-0000-0000-0000-000000000000",
          name: DEMO_NAME,
          email: DEMO_EMAIL,
          plan: "Premium",
          isDemo: true
        };

        // Try registering/fetching demo user in backend if it's running
        try {
          // Attempt check
          const res = await fetch(`http://localhost:8080/api/auth/me?email=${DEMO_EMAIL}`);
          let data;
          if (res.ok) {
            data = await res.json();
          } else {
            // Register if not exist
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

        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(demoUser));
        setSuccess("Success! Logged in with Demo credentials.");
        
        setTimeout(() => {
          router.push("/studio?style=Modern");
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
        let userData = { id: "00000000-0000-0000-0000-000000000000", name: email.split("@")[0], email, plan: "Free" };

        try {
          // Attempt backend query
          const response = await fetch(`http://localhost:8080/api/auth/me?email=${email}`);
          if (response.ok) {
            const data = await response.json();
            userData = { id: data.id, name: data.name, email: data.email, plan: data.plan };
          } else {
            throw new Error("User not found in database. Please sign up first.");
          }
        } catch (backendErr: any) {
          console.warn("Backend offline or error, logging in locally:", backendErr.message);
          // If backend returned 404 explicitly, raise error
          if (backendErr.message.includes("database")) {
            throw backendErr;
          }
          // Otherwise fallback to local success
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Welcome back! Logging in...");
        
        setTimeout(() => {
          router.push("/studio?style=Modern");
          router.refresh();
        }, 1000);

      } else {
        // --- SIGNUP MODE ---
        let userData = { id: "00000000-0000-0000-0000-000000000000", name, email, plan };

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

        localStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Account created successfully!");
        
        setTimeout(() => {
          router.push("/studio?style=Modern");
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center space-y-3">
        <div className="inline-flex bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/10 mx-auto">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
          {isLoginMode ? "Sign in to HomeVerse" : "Create your account"}
        </h2>
        <p className="text-xs text-slate-400">
          {isLoginMode ? "Access your 3D design workspace" : "Get started with AI-powered interior design"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel border-slate-800/80 rounded-3xl py-8 px-6 shadow-2xl space-y-6 sm:px-10">
          
          {/* Success / Error Messages */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-950/40 border border-green-900/40 text-green-400 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name field (Signup only) */}
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="designer@homeverse.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Plan Selector (Signup only) */}
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Plan Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Free", "Premium"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPlan(tier)}
                      className={`text-xs py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                        plan === tier
                          ? "bg-blue-600/10 border-blue-500 text-blue-400"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
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
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn mt-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLoginMode ? (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Sign Up <Check className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-850" />
            </div>
            <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-widest z-10 select-none">
              Dev Options
            </span>
          </div>

          {/* Quick Demo Credentials login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 hover:from-blue-900/40 hover:to-purple-900/40 border border-indigo-900/40 rounded-xl text-indigo-400 hover:text-indigo-300 font-bold transition-all text-xs cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Login with Demo Credentials</span>
          </button>

          {/* Toggle link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              {isLoginMode ? "New to HomeVerse? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Loading authentication workspace...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
