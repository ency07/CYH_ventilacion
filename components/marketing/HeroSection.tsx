"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Settings, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-bg-primary pt-16">
      
      {/* Structural SCADA grid background */}
      <div className="absolute inset-0 z-0 industrial-grid opacity-30" />
      
      {/* High-quality industrial overlay background (turbine / mechanical engineering theme) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat grayscale brightness-[0.22] opacity-80"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1920&auto=format&fit=crop')` 
        }} 
      />

      {/* Modern gradient overlay for high legibility */}
      <div className="absolute inset-0 z-0 industrial-gradient-overlay" />

      {/* Main Core Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-20 flex flex-col justify-center">
        
        <div className="max-w-4xl space-y-8">
          
          {/* System status statement - Enterprise B2B approach */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 w-fit border border-accent-cyan/20 bg-accent-cyan-soft px-4 py-2 rounded-sm"
          >
            <CheckCircle2 className="h-4 w-4 text-accent-cyan" />
            <span className="font-mono text-xs text-accent-cyan tracking-wider uppercase font-semibold">
              INGENIERÍA REGISTRADA • AMCA & ASHRAE COMPLIANT
            </span>
          </motion.div>

          {/* Primary Enterprise Title using Bebas Neue display */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-6xl md:text-7xl tracking-wide text-text-primary leading-none uppercase"
          >
            Ingeniería de Ventilación Industrial <br />
            <span className="text-accent-cyan">para Operaciones Críticas</span>
          </motion.h1>

          {/* Corporate statement describing actual values */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed"
          >
            Diseñamos, fabricamos e implementamos soluciones de ventilación industrial bajo criterios de desempeño, seguridad y cumplimiento normativo.
          </motion.p>

          {/* Actions & Navigation Links */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link
              href="/cotizador"
              className="px-8 py-4 bg-accent-cyan hover:bg-accent-cyan/90 text-white dark:text-background font-semibold text-sm tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-3 group"
            >
              Solicitar Diagnóstico
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <a
              href="#proyectos"
              className="px-8 py-4 border border-border-medium hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-semibold text-sm tracking-wider uppercase rounded-sm transition-all bg-bg-secondary/20 hover:bg-bg-secondary/40 flex items-center justify-center gap-3"
            >
              Ver Casos de Aplicación
              <Settings className="h-4 w-4" />
            </a>
          </motion.div>

        </div>

      </div>

      {/* Floating Side Info Panel (Autodesk/Linear style) */}
      <div className="absolute right-12 bottom-12 hidden lg:block z-20">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="glass-panel p-6 rounded-sm w-72 border border-border-subtle"
        >
          <div className="text-[10px] font-mono text-text-secondary tracking-widest uppercase mb-3 border-b border-border-subtle pb-2">
            ESPECIFICACIONES DE NORMA
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-muted">DISEÑO DE ASPAS</span>
              <span className="font-mono text-[10px] font-semibold text-text-primary">ISO 1940 (G2.5)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-muted">CUMPLIMIENTO</span>
              <span className="font-mono text-[10px] font-semibold text-text-primary">RETIE / NTC 2050</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-muted">SEGURIDAD</span>
              <span className="font-mono text-[10px] font-semibold text-text-primary">ATEX CLASE I DIV II</span>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
