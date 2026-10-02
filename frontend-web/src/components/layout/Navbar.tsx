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
  Box,
  Layers
} from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { User } from "@/types/user";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const u = getStoredUser();
      setUser(u);
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleSignOut = () => {
    clearStoredUser();
    setUser(null);
    setProfileOpen(false);
    router.push("/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Create Home", href: "/home/new", icon: Plus },
    { label: "Preferences", href: "/preferences", icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-50 h-20 px-6 lg:px-12 backdrop-blur-xl bg-[#06090e]/90 border-b border-white/[0.08] flex items-center justify-between transition-all">
      {/* Brand Identity */}
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

      {/* Right Controls: Notifications, User Account & CTA */}
      <div className="flex items-center gap-3.5">
        <NotificationBell />

        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all cursor-pointer shadow-sm"
              title="User Account"
              aria-label="User Account Menu"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-[11px] shadow-sm">
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : user.email
                  ? user.email.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <span className="max-w-[120px] truncate font-medium">
                {user.name || (user.email ? user.email.split("@")[0] : "Creator")}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                {/* Solid, completely opaque, non-invisible container */}
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-[#0c1017] !bg-opacity-100 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs font-mono select-none">
                  {/* Account Header Matter */}
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shrink-0 shadow-md shadow-emerald-500/20">
                        <div className="w-full h-full bg-[#070b10] rounded-full flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                          {user.name
                            ? user.name.charAt(0).toUpperCase()
                            : user.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate leading-snug">
                          {user.name || (user.email ? user.email.split("@")[0] : "Creator")}
                        </p>
                        <p className="text-[11px] text-slate-300 truncate font-mono">
                          {user.email || "creator@homeverse.ai"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                        {user.plan || "Pro Designer"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                        Role: <span className="text-slate-200 capitalize">{user.role || "Owner"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Navigation Matter */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors font-mono text-xs"
                    >
                      <Home className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Studio Dashboard</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors font-mono text-xs"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                      <span>My Spaces & CAD</span>
                    </Link>
                    <Link
                      href="/preferences"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors font-mono text-xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Style Preferences</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors font-mono text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Studio Settings</span>
                    </Link>
                  </div>

                  {/* Danger Zone & Sign Out */}
                  <div className="pt-2 mt-1 border-t border-slate-800/80 space-y-0.5">
                    <Link
                      href="/dashboard/settings#danger-zone"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors font-mono text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer font-mono text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 transition-all cursor-pointer shadow-sm"
              title="Guest Account"
              aria-label="Guest Account Menu"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[11px]">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="font-medium">Account</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                {/* Solid, completely opaque, non-invisible container */}
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-[#0c1017] !bg-opacity-100 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs font-mono space-y-3 select-none">
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                    <p className="font-bold text-white text-sm">Guest Creator</p>
                    <p className="text-[11px] text-slate-400 font-sans font-light">
                      Sign in to save CAD floorplans and manage Indian budget tracking.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono transition-colors text-center shadow-lg shadow-emerald-500/20"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-mono transition-colors text-center border border-slate-700"
                    >
                      Create Free Account
                    </Link>
                  </div>
                </div>
              </>
            )}
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
