"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Check } from "lucide-react";
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

  const DEMO_EMAIL = "designer@homeverse.ai";
  const DEMO_NAME = "Anisha Paturi";

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
      // Fallback in case backend is offline
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
    setPassword("demo");
    const demoUser = {
      id: "d0000000-0000-0000-0000-000000000000",
      name: demoUserName,
      email: demoUserEmail,
      plan: "Pro Designer",
      isDemo: true,
    };
    sessionStorage.setItem("user", JSON.stringify(demoUser));
    setSuccess(`Welcome ${demoUserName}! Entering HomeVerse...`);
    setTimeout(() => {
      if (onSuccess) onSuccess(demoUser);
      router.push(redirectTo);
      router.refresh();
    }, 400);
  };

  return (
    <div className="space-y-6">
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

      <GoogleAuthButton
        onSuccess={(u) => {
          if (onSuccess) onSuccess(u);
          router.push(redirectTo);
        }}
      />

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-800" />
        <span className="absolute bg-[#090e15] px-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
          OR EMAIL
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
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
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
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
              <span>Sign In to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Access */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => handleDemoSignIn(DEMO_EMAIL, DEMO_NAME)}
          className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-mono text-slate-300 flex items-center justify-between transition-all"
        >
          <span>⚡ Quick 1-Click Demo (Anisha Paturi)</span>
          <span className="text-emerald-400">Autofill & Login →</span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
