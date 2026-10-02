"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Check, Sparkles } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";

interface LoginFormProps {
  onSuccess?: (user: any) => void;
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = "/dashboard",
}) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    let assignedId = "d0000000-0000-0000-0000-000000000000";

    try {
      const res = await fetch(
        `http://localhost:8080/api/auth/login?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.id) assignedId = data.id;
      }
    } catch (_) {
      // Fallback for offline / local mode
    }

    const userData = {
      id: assignedId,
      name:
        email.split("@")[0].charAt(0).toUpperCase() +
        email.split("@")[0].slice(1),
      email,
      plan: "Pro Designer",
    };

    sessionStorage.setItem("user", JSON.stringify(userData));
    setSuccess("Welcome back! Redirecting to studio...");

    setTimeout(() => {
      if (onSuccess) onSuccess(userData);
      router.push(redirectTo);
      router.refresh();
    }, 500);
    setLoading(false);
  };

  const handleDemoSignIn = (demoUserEmail: string, demoUserName: string) => {
    setEmail(demoUserEmail);
    setPassword("demo-password");
    const demoUser = {
      id: "d0000000-0000-0000-0000-000000000000",
      name: demoUserName,
      email: demoUserEmail,
      plan: "Pro Designer",
      isDemo: true,
    };
    sessionStorage.setItem("user", JSON.stringify(demoUser));
    setSuccess(`Entering HomeVerse as ${demoUserName}...`);
    setTimeout(() => {
      if (onSuccess) onSuccess(demoUser);
      router.push(redirectTo);
      router.refresh();
    }, 400);
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-2xl text-xs flex items-center gap-2 font-mono backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 font-mono backdrop-blur-md">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Social Auth */}
      <GoogleAuthButton
        onSuccess={(u) => {
          if (onSuccess) onSuccess(u);
          router.push(redirectTo);
        }}
      />

      <div className="relative flex items-center justify-center my-3">
        <div className="w-full border-t border-white/[0.08]" />
        <span className="absolute glass-morphism px-3 py-0.5 rounded-full text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          OR EMAIL ACCESS
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Email Address</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="architect@domain.com"
              className="glass-morphism-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Password</span>
            <Link
              href="/forgot-password"
              className="text-[10px] text-emerald-400 hover:underline cursor-pointer transition-colors"
            >
              Forgot?
            </Link>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass-morphism-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <span>{loading ? "Authenticating..." : "Sign In to Studio"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 1-Click Quick Demo Sign-Ins */}
      <div className="pt-3 border-t border-white/[0.08] space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">
          ⚡ 1-Click Instant Demo Access
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn("homeowner@homeverse.ai", "Rohan & Priya")}
            className="p-2.5 rounded-xl glass-morphism hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
          >
            <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Homeowner</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">3BHK Penthouse</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSignIn("architect@homeverse.ai", "Ar. Vikram Sen")}
            className="p-2.5 rounded-xl glass-morphism hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
          >
            <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Architect</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">Studio Sen Practice</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
