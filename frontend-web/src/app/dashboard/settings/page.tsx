"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import {
  SlidersHorizontal,
  ShieldCheck,
  Bell,
  Ruler,
  Check,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Lock,
  User,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { getStoredUser, deleteUserAccount } from "@/lib/auth";
import { User as UserType } from "@/types/user";

export default function SettingsDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [unit, setUnit] = useState<"imperial" | "metric">("metric");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [saved, setSaved] = useState(false);

  // Danger Zone / Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setCurrentUser(u);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isConfirmationMatching =
    confirmText.trim().toUpperCase() === "DELETE" ||
    (currentUser?.email &&
      confirmText.trim().toLowerCase() === currentUser.email.toLowerCase());

  const handleDeleteAccount = async () => {
    if (!isConfirmationMatching) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const targetEmail = currentUser?.email || getStoredUser()?.email;
      const res = await deleteUserAccount(targetEmail);
      if (res && res.success) {
        // Full clean redirect to login page with deletion notification
        window.location.href = "/login?deleted=true";
      } else {
        setDeleteError("Unable to delete account at this time. Please try again.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      setDeleteError(err?.message || "An unexpected error occurred during account deletion.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 relative overflow-hidden flex flex-col justify-between">
      {/* Background Architectural Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-105 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/75 to-[#06090e]/90" />
      </div>

      <div className="relative z-30">
        <Navbar />
      </div>

      <main className="max-w-4xl mx-auto w-full px-6 lg:px-12 py-10 space-y-8 relative z-10">
        {/* Page Title & Breadcrumb */}
        <div className="pb-4 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>PLATFORM CONFIGURATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-editorial">
            Account & Studio Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
            Manage your spatial architecture profile, Indian budget formats, and account credentials.
          </p>
        </div>

        {/* User Identity Profile Card */}
        <div className="glass-morphism-card rounded-3xl p-7 border border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#070b10] rounded-[14px] flex items-center justify-center font-mono font-bold text-xl text-emerald-400">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-editorial">
                  {currentUser?.name || "Architectural Designer"}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                  {currentUser?.plan || "Pro Designer"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser?.email || "designer@homeverse.ai"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400">
              Role: <span className="text-slate-200 capitalize">{currentUser?.role || "Owner"}</span>
            </span>
          </div>
        </div>

        {/* Studio Configurations Card */}
        <div className="glass-morphism-card rounded-3xl p-7 border border-white/12 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white font-editorial flex items-center gap-2">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Architectural Measurement Units</span>
            </label>
            <p className="text-xs text-slate-400 font-light">
              Choose the primary unit of measurement for 3D floor plan coordinates and dimensions.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  unit === "metric"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                Meters / Centimeters (Metric)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  unit === "imperial"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                Feet / Inches (Imperial)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            <label className="text-sm font-bold text-white font-editorial">
              Default Budget Currency
            </label>
            <p className="text-xs text-slate-400 font-light">
              Format for material cost estimation, Indian procurement envelopes, and contractor labor rates.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                ₹ Indian Rupee (INR - Lakhs & Crores)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                $ US Dollar (USD)
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">
              Settings synchronized across your spatial studio profile.
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div
          id="danger-zone"
          className="rounded-3xl p-7 border border-rose-500/30 bg-[#090b10]/90 backdrop-blur-xl relative overflow-hidden space-y-5 shadow-2xl shadow-rose-950/20"
        >
          {/* Subtle Ambient red glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>DANGER ZONE</span>
              </div>
              <h3 className="text-xl font-bold text-white font-editorial flex items-center gap-2">
                Permanently Delete Studio Account
              </h3>
              <p className="text-xs text-slate-300 font-light max-w-xl leading-relaxed">
                Permanently erase your HomeVerse user account, all active residential CAD models,
                room floorplans, Indian budget allocations, material selections, and BIM rules.
                <span className="text-rose-400 font-semibold block mt-1">
                  This action is permanent and cannot be undone.
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmText("");
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </main>

      {/* Safety Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#090e15] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top red accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-editorial">
                    Delete Your Account?
                  </h3>
                  <p className="text-xs text-rose-400/90 font-mono">
                    IRREVERSIBLE ACTION
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="p-4 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-rose-300">
                You are about to delete account:{" "}
                <span className="font-mono text-white underline">
                  {currentUser?.email || "designer@homeverse.ai"}
                </span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 font-light">
                <li>All active 3D residential spaces and floorplans will be erased.</li>
                <li>Indian room-by-room budget tracking & procurement data will be wiped.</li>
                <li>Saved spatial styling preferences and BIM blueprints will be cleared.</li>
                <li>You will be signed out and unable to recover this studio account.</li>
              </ul>
            </div>

            {/* Safety Verification Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">
                To confirm deletion, please type{" "}
                <span className="font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded">
                  DELETE
                </span>{" "}
                in the field below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-rose-500/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white font-mono text-sm placeholder:text-slate-600 outline-none transition-all"
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {deleteError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl font-mono text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!isConfirmationMatching || isDeleting}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  isConfirmationMatching && !isDeleting
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50"
                    : "bg-rose-500/20 text-rose-400/40 border border-rose-500/20 cursor-not-allowed"
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10 mt-12">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}
