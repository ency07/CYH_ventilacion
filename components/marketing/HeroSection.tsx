"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PhoneCall, ShieldCheck } from "lucide-react";

export default function HeroSection() {
  const strengths = [
    "Fabricacion a medida",
    "Mantenimiento en planta",
    "Reparacion y soporte",
  ];

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden bg-bg-primary pt-16">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat brightness-[0.72]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1920&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/92 to-white/40 dark:from-slate-950 dark:via-slate-950/86 dark:to-slate-950/35" />
      <div className="absolute inset-x-0 bottom-0 z-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-20">
        <div className="max-w-3xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 w-fit border border-border-medium bg-bg-primary/80 px-4 py-2 rounded-md shadow-sm"
          >
            <ShieldCheck className="h-5 w-5 text-accent-cyan" />
            <span className="text-sm md:text-base text-text-secondary font-semibold">
              Ingenieria industrial para plantas que no pueden detenerse
            </span>
          </motion.div>

          {/* Primary Enterprise Title using Bebas Neue display */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-6xl md:text-8xl tracking-wide text-text-primary leading-tight "
          >
            Especialistas en <br />
            <span className="text-accent-cyan">Ventilación Industrial</span>
          </motion.h1>

          {/* Corporate statement describing actual values */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-text-secondary max-w-3xl leading-relaxed font-medium"
          >
            Fabricación, mantenimiento y reparación de extractores para plantas y operaciones críticas. Respaldamos su continuidad operativa con ingeniería en campo.
          </motion.p>

          {/* Actions & Navigation Links */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-8"
          >
            <Link
              href="/cotizador"
              className="px-8 py-3.5 bg-accent-cyan hover:bg-accent-cyan/90 text-white dark:text-background font-bold text-base tracking-wider uppercase rounded-md transition-all flex items-center justify-center gap-3 group"
            >
              Solicitar Diagnóstico
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="/contacto"
              className="px-8 py-3.5 border-2 border-border-medium hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-bold text-base tracking-wider uppercase rounded-md transition-all bg-bg-secondary/20 hover:bg-bg-secondary/80 flex items-center justify-center gap-3"
            >
              Hablar con Ingeniería
              <PhoneCall className="h-5 w-5" />
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 max-w-3xl"
          >
            {strengths.map((item) => (
              <div
                key={item}
                className="border-l-4 border-accent-cyan bg-bg-primary/80 px-5 py-4 shadow-sm"
              >
                <p className="text-base md:text-lg font-semibold text-text-primary">
                  {item}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
