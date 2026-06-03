"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, PhoneCall, ShieldCheck } from "lucide-react";

export default function CTASection() {
  const items = [
    {
      icon: <ClipboardCheck className="h-6 w-6 text-accent-cyan" />,
      label: "Revision inicial de necesidad",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-accent-cyan" />,
      label: "Criterios tecnicos y de seguridad",
    },
    {
      icon: <PhoneCall className="h-6 w-6 text-accent-cyan" />,
      label: "Contacto directo con el equipo",
    },
  ];

  return (
    <section className="py-24 bg-bg-primary relative z-10 border-t border-border-subtle overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-md border border-border-subtle bg-bg-secondary p-8 md:p-14 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="space-y-6">
              <span className="text-base text-accent-cyan font-semibold">
                Diagnostico industrial
              </span>
              <h2 className="font-sans text-4xl md:text-5xl font-bold text-text-primary leading-tight">
                Cuente que necesita su planta y le ayudamos a encontrar el camino tecnico.
              </h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                Puede iniciar con el cotizador o escribirnos directamente. Revisamos
                el tipo de ambiente, urgencia, sintomas y objetivo operativo para
                orientar una propuesta seria.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/cotizador"
                  className="px-8 py-4 bg-accent-cyan hover:bg-accent-cyan/90 text-white dark:text-background font-semibold text-base rounded-md transition-all inline-flex items-center justify-center gap-3 group"
                >
                  Iniciar diagnostico
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contacto"
                  className="px-8 py-4 bg-bg-primary border border-border-medium hover:border-accent-cyan text-text-primary font-semibold text-base rounded-md transition-all inline-flex items-center justify-center gap-3"
                >
                  Contactar ahora
                  <PhoneCall className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-md border border-border-subtle bg-bg-primary p-5"
                >
                  <div className="p-3 rounded-md bg-bg-secondary border border-border-subtle">
                    {item.icon}
                  </div>
                  <p className="text-lg font-semibold text-text-primary">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
