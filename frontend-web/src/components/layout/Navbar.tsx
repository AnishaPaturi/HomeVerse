"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import {
  Sparkles,
  Plus,
  Home,
  SlidersHorizontal,
  FolderKanban,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  Trash2,
} from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { User } from "@/types/user";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  const handleSignOut = () => {
    clearStoredUser();
    setUser(null);
    router.push("/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Create Home", href: "/home/new", icon: Plus },
    { label: "Preferences", href: "/preferences", icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-50 h-20 px-6 lg:px-12 backdrop-blur-xl bg-[#06090e]/85 border-b border-white/[0.08] flex items-center justify-between transition-all">
      {/* Brand Identity (Matching Landing & Login Page) */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070b10] rounded-[15px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
              HV
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              HOMEVERSE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                SPATIAL OS
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-full font-mono text-xs tracking-wider transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Notifications, User Profile & CTA */}
      <div className="flex items-center gap-3.5">
        <NotificationBell />

        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-200 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-[11px]">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="max-w-[120px] truncate font-medium">{user.name || "User"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-morphism-card border border-white/15 bg-[#090e15]/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs font-mono">
                  <div className="px-3 py-2 border-b border-white/[0.08] space-y-0.5">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {user.plan || "Pro Designer"}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Home className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Studio Dashboard</span>
                    </Link>
                    <Link
                      href="/preferences"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Style Preferences</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Studio Settings</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-white/[0.08] space-y-0.5">
                    <Link
                      href="/dashboard/settings#danger-zone"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all"
            >
              Sign In
            </Link>
          </div>
        )}

        <Link
          href="/home/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Home</span>
        </Link>
      </div>
    </header>
  );
};
