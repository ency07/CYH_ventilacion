"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileSpreadsheet, ShieldAlert, Award } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 bg-bg-primary relative z-10 border-t border-border-subtle overflow-hidden">
      
      {/* HUD-like grid texture inside CTA */}
      <div className="absolute inset-0 z-0 industrial-grid opacity-10" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="glass-panel p-12 md:p-16 rounded-sm border border-border-subtle bg-bg-secondary/40 text-center space-y-8 relative overflow-hidden">
          
          {/* Subtle linear decorative bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent-cyan/10 via-accent-cyan to-accent-cyan/10" />
          
          <div className="space-y-4">
            <span className="font-mono text-xs text-accent-cyan tracking-[0.2em] uppercase font-semibold">
              DIAGNÓSTICO COMPUTACIONAL DE FLUJO
            </span>
            <h2 className="font-display text-4xl md:text-6xl tracking-wide text-text-primary uppercase leading-tight max-w-3xl mx-auto">
              Optimice la Eficiencia Operativa de su Planta
            </h2>
            <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Evalúe la renovación de aire, caída de presión y consumo energético estimado de sus instalaciones. Obtenga una propuesta preliminar con cumplimiento normativo.
            </p>
          </div>

          {/* Technical Specs List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto py-4">
            <div className="flex flex-col items-center gap-2 p-4 border border-border-subtle/50 bg-bg-primary/50 rounded-sm">
              <FileSpreadsheet className="h-5 w-5 text-accent-cyan" />
              <span className="font-sans text-xs font-semibold text-text-primary">Reporte Técnico Preliminar</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border border-border-subtle/50 bg-bg-primary/50 rounded-sm">
              <ShieldAlert className="h-5 w-5 text-accent-cyan" />
              <span className="font-sans text-xs font-semibold text-text-primary">Cálculo de Carga Térmica</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border border-border-subtle/50 bg-bg-primary/50 rounded-sm">
              <Award className="h-5 w-5 text-accent-cyan" />
              <span className="font-sans text-xs font-semibold text-text-primary">Validación de Normas ISO</span>
            </div>
          </div>

          {/* CTA Primary Action */}
          <div className="pt-4">
            <Link
              href="/cotizador"
              className="px-10 py-4 bg-accent-cyan hover:bg-accent-cyan/90 text-white dark:text-background font-semibold text-sm tracking-wider uppercase rounded-sm transition-all inline-flex items-center gap-3 group"
            >
              SOLICITAR DIAGNÓSTICO
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="font-mono text-[9px] text-text-muted tracking-widest uppercase pt-2">
            CONFORMIDAD CON DISEÑOS ESTÁNDAR DE INGENIERÍA LATAM
          </div>

        </div>
      </div>
    </section>
  );
}
