"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Activity } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/catalogo" },
    { name: "Servicios", path: "/servicios" },
    { name: "Proyectos", path: "/proyectos" },
    { name: "Empresa", path: "/empresa" },
    { name: "Contacto", path: "/contacto" },
    { name: "CRM", path: "/crm" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#050709]/80 backdrop-blur-xl border-b border-border-subtle h-16">
      <div className="flex justify-between items-center w-full px-6 md:px-12 h-full max-w-7xl mx-auto">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-2xl tracking-wider text-text-primary group-hover:text-accent-cyan transition-colors">
            CYH <span className="font-sans text-xs tracking-[0.25em] font-semibold text-text-secondary ml-1">INGENIERÍA</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                  isActive ? "text-accent-cyan font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.name}
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

        {/* Desktop Utility / Call to Action */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/cotizador"
            className="px-5 py-2.5 bg-bg-secondary hover:bg-bg-tertiary border border-border-medium hover:border-accent-cyan/50 text-text-primary font-semibold text-xs tracking-wide uppercase rounded-sm transition-all flex items-center gap-2"
          >
            COTIZADOR TÉCNICO
            <ArrowRight className="h-4 w-4 text-accent-cyan" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-text-secondary hover:text-text-primary p-2 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

      </div>

      {/* Mobile Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 w-full bg-[#050709]/95 backdrop-blur-2xl border-b border-border-subtle md:hidden flex flex-col p-6 gap-6 z-40"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium py-2 border-b border-border-subtle/30 ${
                    pathname === link.path ? "text-accent-cyan" : "text-text-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <Link
                href="/cotizador"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-3 bg-bg-secondary border border-border-medium hover:border-accent-cyan/50 text-text-primary font-semibold text-xs tracking-wide uppercase rounded-sm transition-all flex items-center justify-center gap-2"
              >
                COTIZADOR TÉCNICO
                <ArrowRight className="h-4 w-4 text-accent-cyan" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
