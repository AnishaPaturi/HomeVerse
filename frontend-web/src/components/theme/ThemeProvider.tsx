"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (targetTheme: "dark" | "light") => {
    setResolvedTheme(targetTheme);
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
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("homeverse-theme") as Theme | null;
      const initialTheme: Theme = stored || "dark";
      setThemeState(initialTheme);

      let target: "dark" | "light" = "dark";
      if (initialTheme === "system") {
        target = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        target = initialTheme;
      }
      applyTheme(target);
    } catch (_) {
      applyTheme("dark");
    }
    setMounted(true);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem("homeverse-theme") as Theme | null;
      if (currentStored === "system") {
        applyTheme(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handleSystemChange);
    return () => mql.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
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
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
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
