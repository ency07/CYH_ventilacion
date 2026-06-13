"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function WebThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  if (!mounted) {
    // Failsafe empty/skeleton button to prevent hydration mismatch
    return (
      <div className="w-9 h-9 bg-bg-tertiary rounded-md border border-border-subtle opacity-50 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border-subtle transition-all flex items-center justify-center focus:outline-none"
        aria-label="Selector de Tema"
      >
        {isDark ? <Moon className="h-5 w-5 text-accent-cyan" /> : <Sun className="h-5 w-5 text-amber-500" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl focus:outline-none z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => {
              setTheme("light");
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              theme === "light"
                ? "bg-slate-100 dark:bg-slate-800 text-accent-cyan"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Sun className="h-4 w-4 text-amber-500" />
            Modo Claro
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              theme === "dark"
                ? "bg-slate-100 dark:bg-slate-800 text-accent-cyan"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Moon className="h-4 w-4 text-accent-cyan" />
            Modo Oscuro
          </button>
        </div>
      )}
    </div>
  );
}
