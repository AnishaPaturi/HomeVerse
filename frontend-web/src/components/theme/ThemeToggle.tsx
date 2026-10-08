"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 opacity-60 ${className}`}
        disabled
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 group cursor-pointer ${
        isDark
          ? "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500/30 shadow-sm"
          : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:border-emerald-500/40 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transform transition-transform duration-500 rotate-0 group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transform transition-transform duration-500 rotate-0 group-hover:-rotate-12 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(79,70,229,0.4)]" />
        )}
      </div>

      {showLabel && (
        <span className="font-medium tracking-wide select-none">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
};

export const FloatingThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed bottom-5 right-5 z-[999] pointer-events-auto">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95 group ${
          isDark
            ? "bg-[#0b1019]/90 hover:bg-[#121a28] text-amber-400 border border-white/15 hover:border-amber-400/40 shadow-black/40 backdrop-blur-xl"
            : "bg-white/95 hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-indigo-500/40 shadow-slate-900/10 backdrop-blur-xl"
        }`}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transform transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
        )}
      </button>
    </div>
  );
};
