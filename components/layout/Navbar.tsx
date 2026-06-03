"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Catalogo", path: "/catalogo" },
    { name: "Servicios", path: "/servicios" },
    { name: "Proyectos", path: "/proyectos" },
    { name: "Empresa", path: "/empresa" },
    { name: "Contacto", path: "/contacto" },
    { name: "CRM", path: "/crm", icon: <BriefcaseBusiness className="w-5 h-5" />, iconOnly: true },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-2xl border-b border-border-subtle h-16 transition-colors duration-300">
      <div className="flex justify-between items-center w-full px-6 md:px-12 h-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-sans text-2xl font-bold tracking-tight text-text-primary group-hover:text-accent-cyan transition-colors">
            CYH <span className="text-sm font-semibold text-text-secondary ml-1">Ingenieria</span>
          </span>
        </Link>

        <nav className="hidden md:flex gap-7 items-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-base font-medium transition-colors relative py-1 flex items-center ${
                  isActive ? "text-accent-cyan font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.icon}
                {!link.iconOnly && link.name}
                {isActive && (
                  <motion.span
                    layoutId="activeNavBorder"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-cyan opacity-80"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/cotizador"
            className="px-6 py-2.5 bg-accent-cyan hover:bg-accent-cyan/90 text-white dark:text-background font-semibold text-sm rounded-md transition-all flex items-center gap-2"
          >
            Diagnostico
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-text-secondary hover:text-text-primary p-2 focus:outline-none"
            aria-label="Abrir menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 w-full bg-background/96 backdrop-blur-2xl border-b border-border-subtle md:hidden flex flex-col p-6 gap-6 z-40"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium py-2 border-b border-border-subtle/60 flex items-center ${
                    pathname === link.path ? "text-accent-cyan" : "text-text-secondary"
                  }`}
                >
                  {link.icon}
                  {!link.iconOnly && link.name}
                </Link>
              ))}
            </div>

            <Link
              href="/cotizador"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-3 bg-accent-cyan text-white dark:text-background font-semibold text-base rounded-md transition-all flex items-center justify-center gap-2"
            >
              Diagnostico
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
