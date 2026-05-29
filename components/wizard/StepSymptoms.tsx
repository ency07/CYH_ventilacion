"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { SymptomsSchema } from "@/lib/validations/cotizacion.schema";
import { MAINTENANCE_SYMPTOMS, REPAIR_SYMPTOMS } from "@/lib/constants/wizard";
import { SymptomInputs } from "@/types/wizard";
import { ArrowLeft, ShieldAlert, CheckSquare, Square, AlertTriangle, Cpu } from "lucide-react";

export default function StepSymptoms() {
  const { service, symptoms, symptomsResult, setSymptoms, setStep } = useWizardStore();

  // Select symptoms list based on service
  const currentSymptomsList = service === "mantenimiento" ? MAINTENANCE_SYMPTOMS : REPAIR_SYMPTOMS;

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<SymptomInputs>({
    resolver: zodResolver(SymptomsSchema),
    defaultValues: symptoms,
  });

  const watchedValues = watch();

  // Dynamic engineering diagnostic feedback on selection change
  useEffect(() => {
    const keys = Object.keys(watchedValues) as Array<keyof SymptomInputs>;
    const hasChanged = keys.some((key) => watchedValues[key] !== symptoms[key]);
    if (hasChanged) {
      setSymptoms(watchedValues);
    }
  }, [watchedValues, symptoms, setSymptoms]);

  const onSubmit = (data: SymptomInputs) => {
    setSymptoms(data);
    setStep("teaser");
  };

  const getSeverityStyles = (severity: "low" | "medium" | "high" | undefined) => {
    switch (severity) {
      case "high":
        return {
          border: "border-danger/40 bg-danger/5",
          text: "text-danger",
          glow: "shadow-[0_0_12px_rgba(239,68,68,0.1)]",
          badge: "bg-danger/20 text-danger border-danger/30"
        };
      case "medium":
        return {
          border: "border-warning/40 bg-warning/5",
          text: "text-warning",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.1)]",
          badge: "bg-warning/20 text-warning border-warning/30"
        };
      default:
        return {
          border: "border-success/40 bg-success/5",
          text: "text-success",
          glow: "shadow-[0_0_12px_rgba(34,197,94,0.06)]",
          badge: "bg-success/20 text-success border-success/30"
        };
    }
  };

  const styles = getSeverityStyles(symptomsResult?.severity);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Title Block */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
          PASO 02B • PROTOCOLO DE EVALUACIÓN DE VECTORES TÉCNICOS
        </span>
        <h2 className="font-display text-3xl tracking-wide text-text-primary uppercase">
          {service === "mantenimiento" ? "Parámetros de Desgaste y Eficiencia" : "Registro de Fallas y Anomalías"}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          {service === "mantenimiento" 
            ? "Seleccione los indicadores de fricción, vibración o consumo energético detectados para evaluar la confiabilidad de sus equipos." 
            : "Seleccione las anomalías críticas, ruidos mecánicos severos o fallas eléctricas activas que reporta su extractor."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Checkboxes Form Panel */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="lg:col-span-3 space-y-6"
        >
          
          <div className="space-y-4">
            <span className="block font-mono text-[10px] text-text-secondary tracking-wider uppercase font-semibold">
              INDICADORES DE DIAGNÓSTICO INDUSTRIAL ACTIVO
            </span>

            {/* Custom styled industrial checkboxes grid */}
            <div className="space-y-3">
              {currentSymptomsList.map((symptom) => (
                <Controller
                  key={symptom.id}
                  name={symptom.id as keyof SymptomInputs}
                  control={control}
                  render={({ field }) => {
                    const isChecked = !!field.value;
                    return (
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                          isChecked 
                            ? "border-accent-cyan/40 bg-bg-secondary/30" 
                            : "border-border-subtle bg-bg-secondary/10 hover:border-border-medium"
                        }`}
                      >
                        <div className="mt-0.5 transition-colors">
                          {isChecked ? (
                            <CheckSquare className="h-5 w-5 text-accent-cyan" />
                          ) : (
                            <Square className="h-5 w-5 text-text-muted hover:text-text-secondary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-mono text-xs font-semibold text-text-primary leading-none">
                            {symptom.label}
                          </h4>
                          <p className="text-[10px] text-text-secondary leading-normal">
                            {symptom.description}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
              ))}
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-border-subtle flex justify-between">
            <button
              type="button"
              onClick={() => setStep("service")}
              className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              REGRESAR
            </button>
            
            <button
              type="submit"
              className="px-8 py-3 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-semibold text-xs tracking-wider uppercase rounded-sm transition-all shadow-[0_4px_12px_rgba(0,212,255,0.15)] flex items-center gap-2"
            >
              GENERAR PRE-DIAGNÓSTICO
            </button>
          </div>

        </form>

        {/* Real-time SCADA severity box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-6 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-cyan/20" />

            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-accent-cyan" />
              <span className="font-mono text-[9px] text-accent-cyan tracking-widest uppercase font-semibold">
                ANÁLISIS DE SEVERIDAD ACTIVA
              </span>
            </div>

            {symptomsResult && Object.values(watchedValues).some(Boolean) ? (
              <div className="space-y-6">
                
                {/* Dynamic alert box based on active hazards severity */}
                <div className={`border p-4 rounded-sm transition-all ${styles.border} ${styles.glow} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">
                      ÍNDICE DE GRAVEDAD
                    </span>
                    <span className={`font-mono text-[9px] tracking-widest uppercase border px-2 py-0.5 rounded-sm font-semibold ${styles.badge}`}>
                      {symptomsResult.severity}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${styles.text}`} />
                    <p className={`text-xs leading-normal font-semibold ${styles.text}`}>
                      {symptomsResult.alertMessage}
                    </p>
                  </div>
                </div>

                {/* Complexity rating and recommendations details */}
                <div className="space-y-4 pt-2">
                  
                  <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                    <span className="font-mono text-[9px] text-text-secondary uppercase">COMPLEJIDAD DE LA REPARACIÓN</span>
                    <span className="font-mono text-xs font-semibold text-accent-cyan">
                      {symptomsResult.complexityScore}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-text-secondary uppercase block">DIRECTIVA OPERATIVA SUGERIDA</span>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {symptomsResult.recommendedAction}
                    </p>
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4 space-y-3">
                <Cpu className="h-8 w-8 text-text-muted animate-pulse" />
                <p className="text-[11px] text-text-secondary leading-relaxed max-w-[200px]">
                  Marque uno o más indicadores en el formulario de la izquierda para evaluar la gravedad operativa.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
