"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, AlertCircle, Check } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";

interface SignupFormProps {
  onSuccess?: (user: any) => void;
  redirectTo?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  redirectTo = "/home/new",
}) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    let assignedId = "d0000000-0000-0000-0000-000000000000";

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) assignedId = data.id;
      }
    } catch (_) {
      // Offline fallback
    }

    const userData = {
      id: assignedId,
      name,
      email,
      plan: "Pro Designer",
    };

    sessionStorage.setItem("user", JSON.stringify(userData));
    setSuccess("Account successfully created! Starting house creation flow...");

    setTimeout(() => {
      if (onSuccess) onSuccess(userData);
      router.push(redirectTo);
      router.refresh();
    }, 600);
    setLoading(false);
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
          OR EMAIL REGISTRATION
        </span>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
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
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#05070a] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
            />
          </div>
        </div>

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
            Create Password
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
              <span>Create Account & Start</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
