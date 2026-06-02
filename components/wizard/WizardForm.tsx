"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { useSearchParams } from "next/navigation";
import { ServiceType } from "@/types/wizard";
import StepService from "./StepService";
import StepFlowCalculator from "./StepFlowCalculator";
import StepSymptoms from "./StepSymptoms";
import StepTeaser from "./StepTeaser";
import StepLead from "./StepLead";
import StepSummary from "./StepSummary";

// Hexagon SVG helper component to satisfy custom SCADA progress bars directive
const HexagonPip = ({ 
  stepNum, 
  label, 
  active, 
  completed 
}: { 
  stepNum: string; 
  label: string; 
  active: boolean; 
  completed: boolean; 
}) => {
  return (
    <div className={`flex flex-col items-center gap-3 relative z-10 transition-opacity duration-300 ${
      active || completed ? "opacity-100" : "opacity-40"
    }`}>
      
      {/* Hexagonal container */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        
        <svg 
          className={`absolute inset-0 w-full h-full transition-colors duration-300 ${
            active 
              ? "text-slate-800" 
              : completed 
                ? "text-slate-500" 
                : "text-border-subtle hover:text-border-medium"
          }`} 
          viewBox="0 0 100 100" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="6"
        >
          <polygon points="50,5 93.3,30 93.3,80 50,95 6.7,80 6.7,30" fill="rgba(245, 247, 250, 0.9)" />
        </svg>

        <span className={`font-mono text-xs font-semibold relative z-10 ${
          active ? "text-text-primary" : "text-text-secondary"
        }`}>
          {stepNum}
        </span>

      </div>

      <span className={`font-mono text-[9px] tracking-widest font-semibold uppercase ${
        active ? "text-slate-800" : "text-text-secondary"
      }`}>
        {label}
      </span>

    </div>
  );
};

export default function WizardForm() {
  const { step, service, setService, setStep } = useWizardStore();
  const [mounted, setMounted] = React.useState(false);
  const searchParams = useSearchParams();
  const servicioParam = searchParams.get("servicio");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-select service based on URL search query parameters (B2B deep-linking)
  React.useEffect(() => {
    if (mounted && servicioParam) {
      const validServices = ["fabricacion", "venta", "mantenimiento", "reparacion"];
      if (validServices.includes(servicioParam)) {
        const targetService = servicioParam as ServiceType;
        if (service !== targetService) {
          setService(targetService);
          if (targetService === "fabricacion" || targetService === "venta") {
            setStep("calculator");
          } else {
            setStep("symptoms");
          }
        }
      }
    }
  }, [mounted, servicioParam, service, setService, setStep]);

  if (!mounted) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <div className="glass-panel p-8 md:p-12 rounded-sm border border-border-subtle bg-bg-secondary/40 min-h-[480px] flex items-center justify-center relative overflow-hidden">
          <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent-cyan animate-spin" />
        </div>
      </div>
    );
  }

  const getStepNumber = () => {
    switch (step) {
      case "service":
        return 1;
      case "calculator":
      case "symptoms":
        return 2;
      case "teaser":
      case "lead":
        return 3;
      case "summary":
        return 4;
      default:
        return 1;
    }
  };

  const currentStepNum = getStepNumber();

  // Stepper descriptions based on chosen path
  const secondStepLabel = "ANÁLISIS TÉCNICO";

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-fadeIn">
      
      {/* Hexagonal Connection Stepper Dashboard (4 Nodes) */}
      <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
        
        {/* Horizontal Connector Line */}
        <div className="absolute top-6 left-8 right-8 h-[2px] bg-border-subtle z-0" />
        
        {/* Dynamic active connector line */}
        <div 
          className="absolute top-6 left-8 h-[2px] bg-slate-800 z-0 transition-all duration-500" 
          style={{ 
            width: currentStepNum === 1 
              ? "0%" 
              : currentStepNum === 2 
                ? "33%" 
                : currentStepNum === 3
                  ? "66%"
                  : "100%" 
          }}
        />

        {/* Step 1 */}
        <HexagonPip 
          stepNum="01" 
          label="SERVICIO" 
          active={currentStepNum === 1} 
          completed={currentStepNum > 1} 
        />

        {/* Step 2 */}
        <HexagonPip 
          stepNum="02" 
          label={secondStepLabel} 
          active={currentStepNum === 2} 
          completed={currentStepNum > 2} 
        />

        {/* Step 3 */}
        <HexagonPip 
          stepNum="03" 
          label="VIABILIDAD" 
          active={currentStepNum === 3} 
          completed={currentStepNum > 3} 
        />

        {/* Step 4 */}
        <HexagonPip 
          stepNum="04" 
          label="REPORTE DE INGENIERÍA" 
          active={currentStepNum === 4} 
          completed={false} 
        />

      </div>

      {/* Dynamic Step Content Wrapper with clean page transitions */}
      <div className="glass-panel p-8 md:p-12 rounded-sm border border-border-medium bg-bg-secondary/20 min-h-[480px] flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle background without heavy grid */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-bg-primary/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === "service" && <StepService />}
              {step === "calculator" && <StepFlowCalculator />}
              {step === "symptoms" && <StepSymptoms />}
              {step === "teaser" && <StepTeaser />}
              {step === "lead" && <StepLead />}
              {step === "summary" && <StepSummary />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic bottom status bar */}
        <div className="relative z-10 mt-12 pt-6 border-t border-border-subtle/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-text-muted"></span>
            <span className="font-sans text-[10px] text-text-secondary font-medium tracking-wide uppercase">
              {step === "summary" ? "Diagnóstico Preliminar Completado" : "Evaluación Técnica en Curso"}
            </span>
          </div>
          <div className="font-sans text-[10px] text-text-muted font-medium tracking-wide uppercase">
            ESTUDIO DE VIABILIDAD INDUSTRIAL
          </div>
        </div>

      </div>

    </div>
  );
}
