"use client";

import React, { useEffect, useState } from "react";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { Cpu, Terminal, ShieldAlert } from "lucide-react";

const TELEMETRY_LINES = [
  "INICIANDO MÓDULO DE CÁLCULO TERMODINÁMICO DE CYH OS...",
  "MAPEANDO PARÁMETROS OPERATIVOS E ESTRUCTURALES...",
  "COMPUTANDO VOLUMEN TOTAL Y CAUDALES DE TRABAJO...",
  "SELECCIONANDO DIRECTIVAS DE DISEÑO BAJO PROTOCOLOS AMCA / ASHRAE...",
  "EVALUANDO CAÍDAS DE PRESIÓN ESTÁTICA Y PÉRDIDAS EN DUCTOS...",
  "CORRIENDO MATRIZ DE CRITICIDAD Y SEVERIDAD OPERATIVA...",
  "GENERANDO PROPUESTA TÉCNICA DE MATERIALES Y RECOMENDACIONES OEM...",
  "ANÁLISIS DE PREINGENIERÍA COMPLETADO CON ÉXITO."
];

export default function StepTeaser() {
  const { setStep } = useWizardStore();
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation of the SCADA computation process
  useEffect(() => {
    const totalDuration = 2800; // Total loading time (ms)
    const intervalTime = 40; // High speed refresh
    const steps = totalDuration / intervalTime;
    const progressStep = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressStep;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Simulating terminal log outputs matching the progress
  useEffect(() => {
    if (logIndex < TELEMETRY_LINES.length) {
      const delay = 320; // Time per log line
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${TELEMETRY_LINES[logIndex]}`]);
        setLogIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [logIndex]);

  // Auto-advance when computation finishes
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setStep("lead");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, setStep]);

  return (
    <div className="space-y-8 flex flex-col justify-center min-h-[420px]">
      
      {/* Title Header */}
      <div className="space-y-2 text-center">
        <span className="font-mono text-xs text-accent-cyan tracking-[0.2em] uppercase font-semibold">
          MOTOR DE PREINGENIERÍA CYH OS • PROCESANDO
        </span>
        <h2 className="font-display text-3xl md:text-4xl tracking-wide text-text-primary uppercase">
          Análisis Técnico en Ejecución
        </h2>
        <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
          El configurador está resolviendo las ecuaciones aerodinámicas y termodinámicas de su planta para estructurar el informe técnico.
        </p>
      </div>

      {/* Cybernetic Progress Dashboard */}
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Core SCADA Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center font-mono text-[10px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-accent-cyan animate-pulse" />
              SISTEMA DE PRE-CÁLCULO ACTIVO
            </span>
            <span className="font-bold text-accent-cyan">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 w-full bg-bg-tertiary border border-border-subtle rounded-sm overflow-hidden p-0.5">
            <div 
              className="h-full bg-accent-cyan transition-all duration-75 ease-out shadow-[0_0_8px_rgba(0,212,255,0.8)] rounded-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Telemetry Process Console Terminal */}
        <div className="glass-panel p-4 rounded-sm border border-border-subtle bg-bg-tertiary/70 h-48 flex flex-col justify-between overflow-hidden relative font-mono text-[9px] text-text-secondary leading-normal">
          <div className="absolute top-0 right-0 p-2 opacity-15 pointer-events-none">
            <Terminal className="h-16 w-16 text-text-primary" />
          </div>

          <div className="overflow-y-auto space-y-2 scrollbar-thin pr-2">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`transition-opacity duration-300 ${
                  i === logs.length - 1 ? "text-accent-cyan font-bold" : "text-text-secondary"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          <div className="border-t border-border-subtle/30 pt-2 flex items-center justify-between text-text-muted mt-2">
            <span>UNIDAD DE CÁLCULO: CORE-B2B-V4</span>
            <span className="animate-pulse">● OPERANDO H24</span>
          </div>
        </div>

        {/* Fast Action Skip */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setStep("lead")}
            className="px-4 py-2 border border-border-medium hover:border-accent-cyan hover:text-accent-cyan text-text-muted font-mono text-[9px] tracking-widest uppercase rounded-sm transition-all"
          >
            FORZAR SALTO AL DIAGNÓSTICO
          </button>
        </div>

      </div>

    </div>
  );
}
