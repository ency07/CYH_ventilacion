import React, { Suspense } from "react";
import WizardForm from "@/components/wizard/WizardForm";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "COTIZADOR TÉCNICO V.04 | VENTITECH",
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
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-8">
          <span className="font-sans text-xs text-text-secondary tracking-widest uppercase font-semibold">
            Configurador Técnico Multi-Vector
          </span>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide text-text-primary leading-tight">
            Plataforma de Diagnóstico y Preingeniería Industrial
          </h1>
          <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-2xl mx-auto font-normal">
            Sistema experto de preingeniería y diagnóstico técnico para movimiento de aire y ventilación industrial.
          </p>
        </div>

        {/* Wizard Form Wrapper with Suspense Boundary for dynamic query support */}
        <Suspense fallback={
          <div className="w-full max-w-5xl mx-auto space-y-12">
            <div className="glass-panel p-10 md:p-16 rounded-sm bg-bg-secondary min-h-[480px] flex items-center justify-center relative overflow-hidden">
              <div className="w-6 h-6 rounded-full border-2 border-border-subtle border-t-text-secondary animate-spin" />
            </div>
          </div>
        }>
          <WizardForm />
        </Suspense>

      </div>

    </section>
  );
}
