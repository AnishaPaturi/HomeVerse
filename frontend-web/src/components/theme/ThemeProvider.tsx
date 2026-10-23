"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((targetTheme: "dark" | "light") => {
    setResolvedTheme(targetTheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (targetTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }
  }, []);

  useEffect(() => {
    let initialTheme: Theme = "dark";
    try {
      const stored = localStorage.getItem("homeverse-theme") as Theme | null;
      if (stored === "dark" || stored === "light" || stored === "system") {
        initialTheme = stored;
      }
    } catch (_) {}

    setThemeState(initialTheme);

    let target: "dark" | "light" = "dark";
    if (initialTheme === "system") {
      target = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      target = initialTheme;
    }
    applyTheme(target);
    setMounted(true);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        const currentStored = localStorage.getItem("homeverse-theme") as Theme | null;
        if (currentStored === "system") {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch (_) {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "homeverse-theme" && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        const newTarget = newTheme === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : (newTheme === "light" ? "light" : "dark");
        applyTheme(newTarget);
      }
    };

    mql.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      mql.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("homeverse-theme", newTheme);
    } catch (_) {}

    let target: "dark" | "light" = "dark";
    if (newTheme === "system") {
      target = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      target = newTheme;
    }
    applyTheme(target);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, mounted, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
