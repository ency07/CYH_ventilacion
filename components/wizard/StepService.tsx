"use client";

import React from "react";
import { motion } from "framer-motion";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { SERVICE_CARDS } from "@/lib/constants/wizard";
import { ServiceType } from "@/types/wizard";
import { Factory, ShoppingCart, Activity, ShieldAlert, ArrowRight } from "lucide-react";

export default function StepService() {
  const { service, setService, setStep } = useWizardStore();

  const getIcon = (id: ServiceType) => {
    switch (id) {
      case "fabricacion":
        return <Factory className="h-6 w-6 text-accent-cyan" />;
      case "venta":
        return <ShoppingCart className="h-6 w-6 text-accent-cyan" />;
      case "mantenimiento":
        return <Activity className="h-6 w-6 text-accent-cyan" />;
      case "reparacion":
        return <ShieldAlert className="h-6 w-6 text-accent-cyan" />;
    }
  };

  const handleSelect = (id: ServiceType) => {
    setService(id);
    
    // Update the URL search parameters to keep it in sync!
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("servicio", id);
      window.history.replaceState({}, "", url.toString());
    }
    
    // Auto-advance to appropriate step depending on selected path
    setTimeout(() => {
      if (id === "fabricacion" || id === "venta") {
        setStep("calculator");
      } else {
        setStep("symptoms");
      }
    }, 250);
  };

  return (
    <div className="space-y-8">
      
      {/* Title block */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
          PASO 01 • SELECCIÓN DE REQUERIMIENTO CORE
        </span>
        <h2 className="font-display text-3xl tracking-wide text-text-primary uppercase">
          Especifique la Directiva Operativa
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          Seleccione el área de intervención técnica requerida para iniciar los algoritmos de estimación de flujo o diagnóstico de fallas activas.
        </p>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICE_CARDS.map((card) => {
          const isSelected = service === card.id;
          return (
            <div
              key={card.id}
              onClick={() => handleSelect(card.id)}
              className={`glass-panel p-6 rounded-sm cursor-pointer relative overflow-hidden transition-all duration-300 ${
                isSelected 
                  ? "border-accent-cyan bg-bg-secondary/40 shadow-[0_0_15px_rgba(0,212,255,0.12)]" 
                  : "hover:border-accent-cyan/20 bg-bg-secondary/20"
              }`}
            >
              
              {/* Technical Indicator Accent */}
              {isSelected && (
                <div className="absolute top-0 left-0 w-[4px] h-full bg-accent-cyan shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
              )}

              <div className="flex justify-between items-start gap-4">
                
                {/* Visual Label */}
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bg-primary border border-border-subtle rounded-sm">
                      {getIcon(card.id)}
                    </div>
                    <span className="font-mono text-[9px] text-accent-cyan tracking-widest border border-accent-cyan/20 px-2 py-0.5 rounded-sm bg-accent-cyan-soft">
                      {card.badge}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">
                      {card.subtitle}
                    </span>
                    <h3 className="font-display text-xl tracking-wide text-text-primary uppercase">
                      {card.title}
                    </h3>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Radio selection circle */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? "border-accent-cyan" : "border-border-medium"
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan shadow-[0_0_4px_rgba(0,212,255,0.8)]" />
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
