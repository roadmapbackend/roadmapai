"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "@/components/ui/icons";

export function ThemeToggle({
  variant = "circle",
  className = "",
}: {
  variant?: "circle" | "pill";
  className?: string;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateFromDOM = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    updateFromDOM();
    window.addEventListener("theme-change", updateFromDOM);
    return () => window.removeEventListener("theme-change", updateFromDOM);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}

    window.dispatchEvent(new Event("theme-change"));
  };

  if (!mounted) {
    if (variant === "pill") {
      return (
        <div className="h-6 w-8 rounded-md bg-transparent animate-pulse" />
      );
    }
    return <div className="size-9 rounded-full border border-border bg-card/60" />;
  }

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={
          className ||
          "px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground hover:text-background transition-all flex items-center justify-center cursor-pointer"
        }
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="size-3.5 text-amber-400" />
        ) : (
          <Moon className="size-3.5 text-orange-600 dark:text-orange-400" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={
        className ||
        "size-9 rounded-full border border-border dark:border-white/15 bg-card/60 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
      }
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="size-4 text-amber-400 transition-transform rotate-0" />
      ) : (
        <Moon className="size-4 text-orange-600 transition-transform rotate-0" />
      )}
    </button>
  );
}
