import React, { Suspense } from "react";
import WizardForm from "@/components/wizard/WizardForm";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "COTIZADOR TÉCNICO V.04 | CYH VENTILACIÓN INDUSTRIAL",
  description: "Configure los parámetros técnicos tridimensionales para el cálculo estimado de caudal, recomendación de turbinas e índice de severidad de fallas.",
  robots: "noindex, nofollow", // Keep private wizard details away from crawlers
};

export default function CotizadorPage() {
  return (
    <section className="relative min-h-screen bg-bg-primary pt-24 pb-20 overflow-hidden flex flex-col justify-start">
      
      {/* Design System Grid Texture */}
      <div className="absolute inset-0 z-0 industrial-grid opacity-20 pointer-events-none" />

      {/* Modern gradient overlay for high contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-bg-primary via-bg-primary/95 to-bg-primary pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 space-y-12">
        
        {/* Centered Top Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="font-mono text-xs text-accent-cyan tracking-[0.25em] uppercase font-semibold">
            CONFIGURADOR TÉCNICO MULTI-VECTOR V.04
          </span>
          <h1 className="font-display text-4xl md:text-6xl tracking-wide text-text-primary uppercase leading-tight">
            ESTACIÓN DIGITAL DE PRE-INGENIERÍA
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Dimensione los requerimientos de flujo de aire o diagnostique síntomas operativos. Los resultados se procesan de forma inmediata utilizando estándares de renovación volumétrica.
          </p>
        </div>

        {/* Wizard Form Wrapper with Suspense Boundary for dynamic query support */}
        <Suspense fallback={
          <div className="w-full max-w-5xl mx-auto space-y-12">
            <div className="glass-panel p-8 md:p-12 rounded-sm border border-border-subtle bg-bg-secondary/40 min-h-[480px] flex items-center justify-center relative overflow-hidden">
              <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent-cyan animate-spin" />
            </div>
          </div>
        }>
          <WizardForm />
        </Suspense>

      </div>

    </section>
  );
}
