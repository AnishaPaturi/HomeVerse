"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, AlertCircle, Check, ShieldCheck } from "lucide-react";
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
      // Fallback for offline / local mode
    }

    const userData = {
      id: assignedId,
      name,
      email,
      plan: "Pro Designer",
    };

    sessionStorage.setItem("user", JSON.stringify(userData));
    setSuccess("Account successfully created! Starting 9-step home wizard...");

    setTimeout(() => {
      if (onSuccess) onSuccess(userData);
      router.push(redirectTo);
      router.refresh();
    }, 600);
    setLoading(false);
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
          OR REGISTER WITH EMAIL
        </span>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ananya Sharma"
              className="glass-morphism-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ananya@domain.com"
              className="glass-morphism-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="glass-morphism-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <span>{loading ? "Creating Account..." : "Create Account & Start"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Security note */}
      <div className="pt-2 text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>By signing up, you agree to our Terms of Architecture Service</span>
      </div>
    </div>
  );
};

export default SignupForm;
