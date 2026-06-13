"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Sliders, Check } from "lucide-react";
import { updateThemePreferenceAction } from "@/lib/server-actions/profile";

const lightThemes = [
  { value: "light1", name: "Clásico VentiTech" },
  { value: "light2", name: "Platino Industrial" },
  { value: "light3", name: "Ejecutivo Marfil" },
];

const darkThemes = [
  { value: "dark1", name: "Espacio Profundo" },
  { value: "dark2", name: "Carbón Sigilo" },
  { value: "dark3", name: "Zafiro Técnico" },
];

export default function AppThemeDropdown() {
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
    return (
      <div className="w-9 h-9 bg-bg-tertiary rounded-md border border-border-subtle opacity-50 animate-pulse" />
    );
  }

  const handleThemeChange = async (value: string) => {
    setTheme(value);
    setIsOpen(false);
    try {
      await updateThemePreferenceAction(value);
    } catch (err) {
      console.error("Failed to persist theme preference:", err);
    }
  };

  const isDark = theme?.startsWith("dark");
  const activeThemeName = 
    [...lightThemes, ...darkThemes].find(t => t.value === theme)?.name || "Temas";

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-md bg-bg-primary hover:bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary transition-all flex items-center gap-2 focus:outline-none text-xs font-semibold"
        aria-label="Selector de Temas"
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-accent-cyan" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
        <span className="hidden sm:inline">{activeThemeName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-bg-primary border border-border-subtle shadow-2xl focus:outline-none z-[100] py-2 animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* Light Themes Segment */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Temas Claros
          </div>
          <div className="space-y-0.5 mb-2">
            {lightThemes.map((item) => {
              const isActive = theme === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleThemeChange(item.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-bg-tertiary text-accent-cyan"
                      : "text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    {item.name}
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 text-accent-cyan" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border-subtle my-1"></div>

          {/* Dark Themes Segment */}
          <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Temas Oscuros
          </div>
          <div className="space-y-0.5">
            {darkThemes.map((item) => {
              const isActive = theme === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleThemeChange(item.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-bg-tertiary text-accent-cyan"
                      : "text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-accent-cyan" />
                    {item.name}
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 text-accent-cyan" />}
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
