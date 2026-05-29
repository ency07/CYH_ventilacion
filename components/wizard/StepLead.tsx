"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { LeadFormSchema } from "@/lib/validations/cotizacion.schema";
import { LeadInputs } from "@/types/wizard";
import { ShieldCheck, ArrowRight, ArrowLeft, Lock, BadgeAlert, AlertCircle } from "lucide-react";

export default function StepLead() {
  const { service, flowResult, symptomsResult, leadData, setLeadData, setStep } = useWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LeadInputs>({
    resolver: zodResolver(LeadFormSchema),
    mode: "onChange",
    defaultValues: leadData || {
      nombre: "",
      empresa: "",
      cargo: "",
      telefono: "",
      email: "",
      ciudad: "",
      urgencia: "baja",
    },
  });

  const onSubmit = (data: LeadInputs) => {
    setLeadData(data);
    setStep("summary");
  };

  const handleBack = () => {
    if (service === "fabricacion" || service === "venta") {
      setStep("calculator");
    } else {
      setStep("symptoms");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Step Header */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
          PASO 03 • PROTOCOLO DE VALIDACIÓN Y ABORT COMPLIANCE
        </span>
        <h2 className="font-display text-3xl tracking-wide text-text-primary uppercase">
          Desbloqueo de Diagnóstico Técnico
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          Complete sus datos profesionales para formalizar la estimación preliminar y descargar la ficha técnica completa generada por CYH OS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* B2B Lead Form Capture */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="lg:col-span-3 space-y-5"
        >
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Nombre del Solicitante
              </label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="nombre"
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.nombre && (
                <span className="text-[10px] font-mono text-danger block">{errors.nombre.message}</span>
              )}
            </div>

            {/* Empresa */}
            <div className="space-y-1.5">
              <label htmlFor="empresa" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Razón Social / Empresa
              </label>
              <Controller
                name="empresa"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="empresa"
                    placeholder="Ej. Minera del Sur S.A."
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.empresa && (
                <span className="text-[10px] font-mono text-danger block">{errors.empresa.message}</span>
              )}
            </div>

            {/* Cargo Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="cargo" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Cargo / Rol Profesional
              </label>
              <Controller
                name="cargo"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="cargo"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all"
                  >
                    <option value="">Seleccione su cargo...</option>
                    <option value="Director de Planta">Director / Gerente de Planta</option>
                    <option value="Gerente de Mantenimiento">Gerente / Jefe de Mantenimiento</option>
                    <option value="Supervisor de HVAC / Operaciones">Supervisor de HVAC / Ventilación</option>
                    <option value="Ingeniero de Proyectos">Ingeniero de Proyectos / Procesos</option>
                    <option value="Compras / Abastecimiento">Analista de Compras / Abastecimiento</option>
                    <option value="Otro">Otro cargo técnico</option>
                  </select>
                )}
              />
              {errors.cargo && (
                <span className="text-[10px] font-mono text-danger block">{errors.cargo.message}</span>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label htmlFor="telefono" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Teléfono Corporativo / Directo
              </label>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="telefono"
                    placeholder="Ej. +56 9 1234 5678"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.telefono && (
                <span className="text-[10px] font-mono text-danger block">{errors.telefono.message}</span>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="email" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Correo Electrónico (Requerido)
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Ej. c.mendoza@empresa.com o mi-correo@gmail.com"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              <span className="text-[9px] text-text-muted font-sans block mt-1">
                Utilice un correo electrónico válido para recibir el diagnóstico técnico y seguimiento de ingeniería.
              </span>
              {errors.email && (
                <span className="text-[10px] font-mono text-danger block mt-1">{errors.email.message}</span>
              )}
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5">
              <label htmlFor="ciudad" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Ciudad / Región de la Planta
              </label>
              <Controller
                name="ciudad"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="ciudad"
                    placeholder="Ej. Antofagasta, Chile"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.ciudad && (
                <span className="text-[10px] font-mono text-danger block">{errors.ciudad.message}</span>
              )}
            </div>

            {/* Urgencia Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="urgencia" className="block font-mono text-[9px] text-text-secondary tracking-wider uppercase font-semibold">
                Urgencia Operativa del Requerimiento
              </label>
              <Controller
                name="urgencia"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="urgencia"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all"
                  >
                    <option value="baja">Planificación Futura (Baja)</option>
                    <option value="media">Mantenimiento Trimestral Programado (Media)</option>
                    <option value="alta">Emergencia Operativa en Sitio (Alta - 24hs)</option>
                  </select>
                )}
              />
              {errors.urgencia && (
                <span className="text-[10px] font-mono text-danger block">{errors.urgencia.message}</span>
              )}
            </div>

          </div>

          {/* Copy informando seriedad y B2B */}
          <div className="flex items-start gap-2.5 p-3.5 bg-bg-tertiary/50 border border-border-subtle/70 rounded-sm">
            <Lock className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-text-secondary leading-normal">
              <strong>Cumplimiento de Privacidad</strong>: Sus datos se procesarán de forma estrictamente privada y confidencial con fines exclusivos de comisionamiento de ingeniería B2B según normativas industriales internacionales.
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-border-subtle flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              REGRESAR
            </button>
            
            <button
              type="submit"
              disabled={!isValid}
              className={`px-8 py-3 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center gap-2 ${
                isValid
                  ? "bg-accent-cyan hover:bg-accent-cyan/95 text-background shadow-[0_4px_12px_rgba(0,212,255,0.15)]"
                  : "bg-bg-tertiary text-text-muted border border-border-subtle cursor-not-allowed"
              }`}
            >
              DESBLOQUEAR DIAGNÓSTICO COMPLETO
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </form>

        {/* Technical Preview Value Box (Lock Sidebar) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-6 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-cyan/20" />

            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-accent-cyan" />
              <span className="font-mono text-[9px] text-accent-cyan tracking-widest uppercase font-semibold">
                VALOR TÉCNICO COMPUTADO
              </span>
            </div>

            <div className="space-y-4">
              
              {/* Conditionally display calculated metrics */}
              {(service === "fabricacion" || service === "venta") && flowResult ? (
                <div className="space-y-3.5">
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm space-y-1">
                    <span className="font-mono text-[9px] text-text-secondary uppercase">Caudal de Extracción Recomendado</span>
                    <span className="font-mono text-xl font-bold text-accent-cyan block">
                      {flowResult.estimatedFlow.toLocaleString()} m³/h
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-[9px]">
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-secondary">VOLUMEN CALCULADO:</span>
                      <span className="text-text-primary font-bold">{flowResult.volume.toLocaleString()} m³</span>
                    </div>
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-secondary">CATEGORÍA DE FLUIDO:</span>
                      <span className="text-accent-cyan font-bold">{flowResult.category}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {(service === "mantenimiento" || service === "reparacion") && symptomsResult ? (
                <div className="space-y-3.5">
                  <div className="bg-bg-primary/60 p-4 border border-border-subtle/80 rounded-sm space-y-1">
                    <span className="font-mono text-[9px] text-text-secondary uppercase">Complejidad del Diagnóstico</span>
                    <span className="font-mono text-xl font-bold text-accent-cyan block">
                      {symptomsResult.complexityScore}%
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-[9px]">
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-secondary">NIVEL DE GRAVEDAD:</span>
                      <span className={`font-bold uppercase ${
                        symptomsResult.severity === "high" 
                          ? "text-danger" 
                          : symptomsResult.severity === "medium" 
                            ? "text-warning" 
                            : "text-success"
                      }`}>{symptomsResult.severity}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-secondary">MONITOREO SCADA:</span>
                      <span className="text-text-primary font-bold">Vectores procesados</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Locked Report Teaser visual */}
              <div className="border border-border-subtle/80 bg-bg-tertiary/40 rounded-sm p-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center mx-auto text-accent-cyan">
                  <Lock className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-accent-cyan tracking-widest block uppercase font-bold">REPORTE COMPLETO BLOQUEADO</span>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    La ficha de preingeniería contiene aleaciones sugeridas, diámetros de ductos comerciales y protocolos AMCA específicos.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
