"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { LeadFormSchema } from "@/lib/validations/cotizacion.schema";
import { LeadInputs } from "@/types/wizard";
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2 
} from "lucide-react";

// Import real Supabase Server Actions & telemetry calculations
import { createLeadAction } from "@/lib/server-actions/leads";
import { createDiagnosticAction } from "@/lib/server-actions/diagnostics";
import { createPipelineEntryAction, createActivityLogAction } from "@/lib/server-actions/crm";
import { calculateDynamicPricing } from "@/lib/calculations/flow";

const USER_FRIENDLY_ERRORS: Record<string, string> = {
  INVALID_EMAIL: "El correo ingresado no parece válido. Verifica que esté escrito correctamente.",
  INVALID_PHONE: "El número ingresado no corresponde a una línea válida en Colombia.",
  TEMPORARY_EMAIL: "Por favor utiliza un correo empresarial o personal real para recibir el reporte PDF.",
  NETWORK: "No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.",
  SERVER: "No fue posible generar el reporte técnico. Intenta nuevamente en unos segundos.",
};

function mapErrorToFriendly(errMessage: string): string {
  const msg = errMessage.toLowerCase();
  if (msg.includes("email") || msg.includes("correo")) {
    return USER_FRIENDLY_ERRORS.INVALID_EMAIL;
  }
  if (msg.includes("phone") || msg.includes("teléfono") || msg.includes("telefono")) {
    return USER_FRIENDLY_ERRORS.INVALID_PHONE;
  }
  if (msg.includes("tempmail") || msg.includes("temporal") || msg.includes("desechable")) {
    return USER_FRIENDLY_ERRORS.TEMPORARY_EMAIL;
  }
  if (msg.includes("enotfound") || msg.includes("econnrefused") || msg.includes("timeout") || msg.includes("connection") || msg.includes("network") || msg.includes("failed to connect")) {
    return USER_FRIENDLY_ERRORS.NETWORK;
  }
  return USER_FRIENDLY_ERRORS.SERVER;
}

export default function StepLead() {
  const { service, flowInputs, flowResult, symptomsResult, leadData, setLeadData, setStep } = useWizardStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

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

  const onSubmit = async (data: LeadInputs) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);
    
    try {
      // Estado 1: Analizando variables y especificaciones técnicas
      setLoadingStep("Analizando variables y especificaciones técnicas...");
 
      const prices = calculateDynamicPricing(service, flowResult, symptomsResult, data.urgencia);
      const complexity = symptomsResult?.complexityScore || (flowResult?.estimatedFlow ? Math.min(100, Math.round(flowResult.estimatedFlow / 4200 * 100)) : 15);
      const severity = symptomsResult?.severity === "high" ? 85 : symptomsResult?.severity === "medium" ? 50 : 20;
 
      // Estado 2: Procesando viabilidad técnica e impacto normativo
      setLoadingStep("Procesando viabilidad técnica e impacto normativo...");
 
      // Create lead directly as verified (isVerified: true) since OTP is removed!
      const leadResult = await createLeadAction({
        fullName: data.nombre,
        companyName: data.empresa,
        email: data.email,
        phone: data.telefono,
        position: data.cargo || "Otro",
        city: data.ciudad,
        serviceType: service || "fabricacion",
        environmentType: flowInputs.environment || "warehouse",
        urgencyLevel: data.urgencia === "alta" ? "alta" : data.urgencia === "media" ? "media" : "baja",
        status: "nuevo",
        source: "wizard",
        estimatedBudgetMin: prices.minCOP,
        estimatedBudgetMax: prices.maxCOP,
        complexityScore: complexity,
        severityScore: severity,
        notes: `Intervención técnica en ${flowInputs.environment || "entorno no especificado"}. Requerimiento clasificado con urgencia ${data.urgencia.toUpperCase()}.`,
        isVerified: true, // Auto-verified commercial lead
      });
 
      if (!leadResult.success) {
        throw new Error(leadResult.error || "Fallo al registrar la oportunidad comercial.");
      }
 
      const dbLead = leadResult.data;
      if (!dbLead) {
        throw new Error("Fallo al registrar la oportunidad comercial.");
      }
      const leadId = dbLead.id;
      setCreatedLeadId(leadId);
 
      // Estado 3: Estructurando reporte de preingeniería PDF
      setLoadingStep("Estructurando reporte de preingeniería PDF...");
 
      await createDiagnosticAction({
        leadId,
        airflow: flowResult?.estimatedFlow || null,
        dimensions: {
          length: flowInputs.length,
          width: flowInputs.width,
          height: flowInputs.height,
        },
        technicalObservations: flowResult?.technicalObservations || symptomsResult?.technicalObservations || "Diagnóstico de preingeniería procesado.",
        materialSuggestions: flowResult?.materialSuggestions || symptomsResult?.materialSuggestions || "Aleaciones y recubrimientos estándar.",
        inspectionProtocol: flowResult?.inspectionRecommendations || symptomsResult?.inspectionRecommendations || "Protocolo de inspección preventiva.",
        recommendations: flowResult?.recommendation || symptomsResult?.recommendedAction || "Recomendación técnica preliminar.",
        currency: "COP",
        generatedPdfUrl: null,
      });
 
      await createPipelineEntryAction({
        leadId,
        stage: "nuevo",
        priority: data.urgencia === "alta" ? "alta" : "media",
      });
 
      await createActivityLogAction({
        leadId,
        activityType: "lead_created",
        description: `Lead comercial registrado y auto-verificado con éxito.`,
      });
 
      // Estado 4: Enrutando copia de respaldo al correo
      setLoadingStep("Enrutando copia de respaldo al correo...");
 
      // Estado 5: Preingeniería Procesada
      setLoadingStep("Preingeniería Procesada");
      setIsSuccess(true);
 
      // Set store data and advance directly to Summary step!
      setLeadData(data);
      useWizardStore.getState().setLeadId(leadId);
      setStep("summary");
    } catch (err: any) {
      console.error("Submission error:", err);
      const friendlyErr = mapErrorToFriendly(err.message || "");
      setSubmitError(friendlyErr);
      setIsSubmitting(false);
    }
  };
 
  const handleBack = () => {
    if (service === "fabricacion" || service === "venta") {
      setStep("calculator");
    } else {
      setStep("symptoms");
    }
  };
 
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-fadeIn text-center min-h-[400px]">
        {/* Corporate Loader / Success State */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {isSuccess ? (
            <ShieldCheck className="h-12 w-12 text-success animate-bounce" />
          ) : (
            <>
              <div className="absolute inset-0 rounded-full border border-border-subtle" />
              <div className="absolute inset-0 rounded-full border-t border-text-secondary animate-spin" />
              <Lock className="h-6 w-6 text-text-secondary animate-pulse" />
            </>
          )}
        </div>
 
        <div className="space-y-3 max-w-md">
          <div className="font-sans text-xs text-text-muted font-semibold">
            AUDITORÍA PRELIMINAR
          </div>
          <h3 className={`font-display text-2xl tracking-wide uppercase transition-colors duration-300 ${
            isSuccess ? "text-success" : "text-text-primary"
          }`}>
            {isSuccess ? "Preingeniería Generada" : "Procesando Preingeniería"}
          </h3>
          <p className="font-mono text-[10px] text-slate-800 tracking-wider bg-slate-100 border border-slate-300 px-4 py-2 rounded-sm inline-block">
            {loadingStep}
          </p>
        </div>
 
        {/* HUD grid block log */}
        <div className="w-full max-w-lg border border-border-medium bg-bg-secondary/40 p-5 rounded-sm font-sans text-xs text-text-secondary text-left space-y-3 shadow-md">
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span className="text-text-muted font-semibold uppercase text-[10px]">Log de Proceso:</span>
            <span className="text-text-primary text-[10px] font-semibold">ACTIVO</span>
          </div>
          <div className="space-y-1 font-semibold text-xs leading-normal">
            <div className="flex items-center gap-2">
              <span className="text-success">[✓]</span>
              <span>Análisis de parámetros terminado.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={loadingStep.includes("Analizando") ? "text-slate-800 animate-pulse" : "text-success"}>
                {loadingStep.includes("Analizando") ? "[▶]" : "[✓]"}
              </span>
              <span className={loadingStep.includes("Analizando") ? "text-text-primary" : "text-text-secondary"}>
                Analizando variables y especificaciones técnicas...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={loadingStep.includes("Procesando") ? "text-slate-800 animate-pulse" : (loadingStep.includes("Analizando") ? "text-text-muted" : "text-success")}>
                {loadingStep.includes("Procesando") ? "[▶]" : (loadingStep.includes("Analizando") ? "[ ]" : "[✓]")}
              </span>
              <span className={loadingStep.includes("Procesando") ? "text-text-primary" : "text-text-secondary"}>
                Procesando viabilidad técnica e impacto normativo...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={loadingStep.includes("Estructurando") ? "text-slate-800 animate-pulse" : (loadingStep.includes("Analizando") || loadingStep.includes("Procesando") ? "text-text-muted" : "text-success")}>
                {loadingStep.includes("Estructurando") ? "[▶]" : (loadingStep.includes("Analizando") || loadingStep.includes("Procesando") ? "[ ]" : "[✓]")}
              </span>
              <span className={loadingStep.includes("Estructurando") ? "text-text-primary" : "text-text-secondary"}>
                Estructurando reporte de preingeniería PDF...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={loadingStep.includes("Enrutando") ? "text-slate-800 animate-pulse" : isSuccess ? "text-success" : "text-text-muted"}>
                {loadingStep.includes("Enrutando") ? "[▶]" : isSuccess ? "[✓]" : "[ ]"}
              </span>
              <span className={loadingStep.includes("Enrutando") ? "text-text-primary" : "text-text-secondary"}>
                Enrutando copia de respaldo al correo...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Step Header */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
          PASO 03 • ESTUDIO DE VIABILIDAD INDUSTRIAL
        </span>
        <h2 className="font-display text-3xl tracking-wide text-text-primary uppercase">
          Estudio de Viabilidad
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          Registre la información técnica y de contacto de su planta para procesar el análisis de viabilidad y recibir el diagnóstico de preingeniería en formato PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Form Container */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="lg:col-span-3 space-y-5 text-left"
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
                    disabled={isSubmitting}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={isSubmitting}
                    placeholder="Ej. Minera del Sur S.A."
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={isSubmitting}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={isSubmitting}
                    placeholder="Ej. +57 300 123 4567"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                Correo Electrónico Corporativo
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="email"
                    type="email"
                    disabled={isSubmitting}
                    placeholder="Ej. c.mendoza@empresa.com"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              />
              <span className="text-[9px] text-text-muted font-sans block mt-1">
                El Documento de Preingeniería Técnica en formato PDF será enviado de forma automática a este correo.
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
                    disabled={isSubmitting}
                    placeholder="Ej. Barranquilla, Atlántico"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={isSubmitting}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-xs text-text-primary focus:border-accent-cyan focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Privacidad industrial */}
          <div className="flex items-start gap-2.5 p-3.5 bg-bg-tertiary/50 border border-border-subtle/70 rounded-sm">
            <Lock className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-text-secondary leading-normal">
              <strong>Garantía de Confidencialidad</strong>: Su información técnica es procesada bajo estrictos prtocolos de seguridad B2B de CYH Ingeniería para levantamiento preliminar de proyectos.
            </p>
          </div>

          {/* Error Message if submit fails */}
          {submitError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/30 rounded-sm text-danger animate-fadeIn">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-mono leading-normal">{submitError}</p>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-6 border-t border-border-subtle flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              REGRESAR
            </button>
            
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`px-8 py-3 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center gap-2 ${
                isValid && !isSubmitting
                  ? "bg-accent-cyan hover:bg-accent-cyan/95 text-background shadow-[0_4px_12px_rgba(0,212,255,0.15)]"
                  : "bg-bg-tertiary text-text-muted border border-border-subtle cursor-not-allowed"
              }`}
            >
              PROCESAR PREINGENIERÍA
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </form>

        {/* Technical Preview Value Box (Lock Sidebar) */}
        <div className="lg:col-span-2 space-y-6 text-left">
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
                  <span className="font-sans text-[11px] text-text-primary block uppercase font-bold">Documento Técnico Restringido</span>
                  <p className="text-xs text-text-muted leading-normal">
                    La preingeniería final y estimación comercial se generarán una vez completada la solicitud corporativa.
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
