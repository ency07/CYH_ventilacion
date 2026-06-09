"use client";

import React, { useState, useTransition } from "react";
import { 
  Wrench, CheckCircle2, AlertTriangle, XCircle, FileText, Search, Clock, 
  ShieldAlert, Loader2, Award, Info, MapPin, Gauge, ShieldCheck, ChevronRight, AlertCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { emitirVeredictoAction } from "@/lib/server-actions/diagnostics";
import { normalizeCity } from "@/lib/utils/normalization";

interface RevisionesClientProps {
  reports: any[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function RevisionesClient({ reports, currentUser }: RevisionesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"pendientes" | "historial">("pendientes");
  const [search, setSearch] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [verdictNotes, setVerdictNotes] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const filteredReports = reports.filter(r => 
    r.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    r.lead?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const pendientes = filteredReports.filter(r => r.diagnostic.status === "pendiente");
  const historial = filteredReports.filter(r => r.diagnostic.status !== "pendiente");

  const currentList = activeTab === "pendientes" ? pendientes : historial;

  // Set default selected report if none is selected
  React.useEffect(() => {
    if (currentList.length > 0) {
      if (!selectedReportId || !currentList.some(r => r.diagnostic.id === selectedReportId)) {
        setSelectedReportId(currentList[0].diagnostic.id);
      }
    } else {
      setSelectedReportId(null);
    }
    setVerdictNotes("");
    setSignatureName("");
    setActionError("");
    setActionSuccess("");
  }, [activeTab, search]);

  const activeReport = reports.find(r => r.diagnostic.id === selectedReportId);

  // Calculate dynamic Recommended CFM based on Nave Dimensions if available
  let recommendedCFM: number | null = null;
  let computedVolumeStr = "N/A";
  if (activeReport?.diagnostic?.dimensions) {
    const { length, width, height } = activeReport.diagnostic.dimensions;
    if (length && width && height) {
      const volume = Number(length) * Number(width) * Number(height);
      computedVolumeStr = `${volume.toLocaleString()} m³`;
      // renewalCoef = 15 standard, CFM = (volume * 35.3147 * 15) / 60 = volume * 8.828675
      recommendedCFM = Math.round(volume * 8.828675);
    }
  }

  // Check if current user role is Técnico or Ingeniero (blocked from approving)
  const isTechnicalUser = currentUser.role === "tecnico" || currentUser.role === "ingeniero";
  const isComercialUser = currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial";
  const isSignatureAllowed = !isTechnicalUser && !isComercialUser; // only Admin/Director

  const handleEmitVerdict = async (status: "aprobado" | "requiere_visita" | "rechazado") => {
    if (!selectedReportId || !activeReport) return;

    if (!isSignatureAllowed) {
      setActionError("Acceso Denegado: Su rol no cuenta con permisos para firmar digitalmente y aprobar veredictos.");
      return;
    }

    if (status === "aprobado" && (!signatureName || signatureName.trim() === "")) {
      setActionError("Error: Se requiere el nombre de la firma digital autorizada para estampar la aprobación.");
      return;
    }

    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      try {
        const notes = verdictNotes.trim() || `Revisión técnica finalizada con veredicto: ${status.toUpperCase()}.`;
        const res = await emitirVeredictoAction(
          activeReport.diagnostic.id, 
          activeReport.lead.id, 
          status, 
          notes
        );

        if (res.success) {
          setActionSuccess(`Veredicto registrado exitosamente como ${status.toUpperCase()}.`);
          setVerdictNotes("");
          setSignatureName("");
          router.refresh();
        } else {
          setActionError(res.error || "Ocurrió un error al emitir el veredicto.");
        }
      } catch (err: any) {
        setActionError(err.message || "Error al procesar el veredicto en el servidor.");
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto min-h-screen lg:h-[calc(100vh-4rem)] bg-bg-secondary overflow-visible lg:overflow-hidden font-sans border-t border-border-subtle">
      
      {/* SECCIÓN IZQUIERDA: LISTADOS Y PESTAÑAS */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-visible lg:overflow-y-auto lg:border-r lg:border-border-subtle bg-bg-primary">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent-cyan" />
              Mesa de Auditoría Avanzada
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Control de calidad y verificación de caudales para aprobación de preingeniería.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, asesor..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 text-xs bg-bg-secondary border border-border-subtle rounded focus:outline-none focus:border-text-primary shadow-2xs" 
            />
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-border-subtle mb-4">
          <button
            onClick={() => setActiveTab("pendientes")}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
              activeTab === "pendientes" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Pendientes ({pendientes.length})
            {activeTab === "pendientes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />}
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
              activeTab === "historial" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Historial ({historial.length})
            {activeTab === "historial" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />}
          </button>
        </div>

        {/* Listado de Tarjetas */}
        <div className="space-y-3">
          {currentList.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs bg-bg-secondary/40 rounded border border-border-subtle">
              No hay reportes de diagnóstico en esta bandeja.
            </div>
          ) : (
            currentList.map((item) => {
              const isSelected = item.diagnostic.id === selectedReportId;
              const isApproved = item.diagnostic.status === "aprobado";
              
              return (
                <div
                  key={item.diagnostic.id}
                  onClick={() => {
                    setSelectedReportId(item.diagnostic.id);
                    setVerdictNotes("");
                    setSignatureName("");
                    setActionError("");
                    setActionSuccess("");
                  }}
                  className={`p-4 bg-bg-primary border rounded cursor-pointer transition-all flex flex-col gap-2 relative shadow-2xs ${
                    isSelected 
                      ? "border-text-primary ring-1 ring-inset ring-text-primary" 
                      : "border-border-subtle hover:border-border-medium"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent-cyan" />}

                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="font-mono text-[9px] text-text-muted block">
                        ID-{item.diagnostic.id.substring(0, 8).toUpperCase()}
                      </span>
                      <h3 className="font-bold text-text-primary text-xs uppercase mt-0.5">
                        {item.companyName}
                      </h3>
                      <p className="text-[10px] text-text-secondary font-medium">Asesor: {item.lead?.fullName}</p>
                    </div>

                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      item.diagnostic.status === "aprobado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      item.diagnostic.status === "requiere_visita" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      item.diagnostic.status === "rechazado" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {item.diagnostic.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-semibold text-text-secondary border-t border-border-subtle/30 pt-2.5">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">Caudal Medido</span>
                      <span className="text-text-primary font-mono font-bold">
                        {item.diagnostic.airflow ? `${item.diagnostic.airflow} CFM` : "[Pendiente]"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">Área Planta</span>
                      <span className="text-text-primary capitalize truncate block max-w-[90px]">{item.lead?.environmentType || "General"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">Ciudad</span>
                      <span className="text-text-primary">{normalizeCity(item.lead?.city) || "No registrada"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* SECCIÓN DERECHA: PANEL DE AUDITORÍA DETALLADA Y VEREDICTO */}
      <div className="w-full lg:w-[420px] xl:w-[480px] bg-bg-secondary p-4 md:p-6 overflow-visible lg:overflow-y-auto flex flex-col gap-6">
        <div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest border-b border-border-subtle pb-1 block">Auditoría en Detalle</span>
          <h2 className="text-base font-bold text-text-primary mt-2">
            Panel de Auditoría de Calidad
          </h2>
        </div>

        {!activeReport ? (
          <div className="border border-dashed border-border-subtle bg-bg-primary/50 p-8 text-center rounded">
            <Info className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-secondary font-medium">Seleccione un diagnóstico técnico para auditar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* COMPARADOR DE CAUDALES CFM (MEDIDO VS RECOMENDADO) */}
            <div className="bg-bg-primary border border-border-subtle rounded p-4 shadow-2xs space-y-3">
              <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle/50 pb-2">
                <Gauge className="w-4 h-4 text-accent-cyan" />
                Comparativa de Caudal
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-secondary p-3 rounded border border-border-subtle/60 text-center">
                  <span className="text-[9px] text-text-muted uppercase block font-bold mb-1">Caudal Medido (Sitio)</span>
                  <span className="text-lg font-black text-text-primary font-mono">
                    {activeReport.diagnostic.airflow ? `${activeReport.diagnostic.airflow.toLocaleString()} CFM` : "[Pendiente]"}
                  </span>
                </div>

                <div className="bg-bg-secondary p-3 rounded border border-border-subtle/60 text-center">
                  <span className="text-[9px] text-text-muted uppercase block font-bold mb-1">Recomendado (Wizard)</span>
                  <span className="text-lg font-black text-accent-cyan font-mono">
                    {recommendedCFM ? `${recommendedCFM.toLocaleString()} CFM` : "N/A"}
                  </span>
                </div>
              </div>

              {recommendedCFM && activeReport.diagnostic.airflow && (
                <div className="text-[10px] text-text-secondary font-semibold bg-bg-secondary/40 p-2.5 rounded border border-border-subtle/30 leading-relaxed">
                  {Math.abs(activeReport.diagnostic.airflow - recommendedCFM) / recommendedCFM > 0.25 ? (
                    <div className="flex gap-2 text-amber-700 bg-amber-50/50 p-2 rounded border border-amber-200/50">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Desviación del caudal de extracción superior al 25% frente al dimensionamiento de preingeniería. Audite las pérdidas de carga en ductería.</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 text-emerald-800 bg-emerald-50/30 p-2 rounded border border-emerald-200/30">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Caudal medido dentro de las tolerancias recomendadas para el volumen total de la nave ({computedVolumeStr}).</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DETALLES TÉCNICOS & ACTA DE CAMPO */}
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Bitácora y Diagnóstico Técnico</span>
              
              <div className="space-y-3 text-xs font-semibold text-text-secondary">
                {activeReport.diagnostic.technicalObservations && (
                  <div className="bg-bg-primary border border-border-subtle rounded p-3.5 space-y-1">
                    <span className="text-[9px] text-text-muted uppercase block">Observaciones Técnicas (Técnico)</span>
                    <p className="text-text-primary text-[11px] font-medium leading-relaxed mt-1">{activeReport.diagnostic.technicalObservations}</p>
                  </div>
                )}
                {activeReport.diagnostic.recommendations && (
                  <div className="bg-bg-primary border border-border-subtle rounded p-3.5 space-y-1">
                    <span className="text-[9px] text-text-muted uppercase block">Recomendaciones Propuestas</span>
                    <p className="text-text-primary text-[11px] font-medium leading-relaxed mt-1">{activeReport.diagnostic.recommendations}</p>
                  </div>
                )}
                {activeReport.diagnostic.materialSuggestions && (
                  <div className="bg-bg-primary border border-border-subtle rounded p-3.5 space-y-1">
                    <span className="text-[9px] text-text-muted uppercase block">Sugerencias de Materiales</span>
                    <p className="text-text-primary text-[11px] font-medium leading-relaxed mt-1">{activeReport.diagnostic.materialSuggestions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DE DECISIÓN Y FIRMA DIGITAL DEL DIRECTOR */}
            <div className="bg-bg-primary border border-border-subtle rounded p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent-cyan" />
                  Firma y Veredicto de Calidad
                </h3>

                {!isSignatureAllowed && (
                  <span className="text-[8px] bg-red-50 text-red-800 border border-red-200 font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 select-none">
                    <ShieldAlert className="w-3 h-3 text-red-600" />
                    Firma Bloqueada
                  </span>
                )}
              </div>

              {/* Warning/Info message based on role */}
              {isTechnicalUser && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-950 rounded text-xs font-bold leading-normal flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Veredicto Bloqueado: Su rol de preventa/técnico solo le permite ingresar datos de campo. La firma final está reservada al Director o Administrador.</span>
                </div>
              )}

              {isComercialUser && (
                <div className="p-3 bg-amber-50 border border-amber-250 text-amber-950 rounded text-xs font-semibold leading-normal flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Acceso de Lectura: El equipo comercial puede revisar el veredicto técnico pero no tiene autorización para realizar mutaciones de calidad.</span>
                </div>
              )}

              {/* Form elements */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Notas del Veredicto / Feedback comercial</label>
                  <textarea
                    value={verdictNotes}
                    disabled={!isSignatureAllowed || isPending}
                    onChange={(e) => setVerdictNotes(e.target.value)}
                    rows={3}
                    placeholder={
                      isSignatureAllowed 
                        ? "Escriba observaciones clave, banderas rojas o comentarios de control de calidad..." 
                        : "Solo lectura autorizada..."
                    }
                    className="w-full text-xs font-semibold p-3 border border-border-subtle bg-bg-secondary rounded focus:outline-none focus:border-text-primary disabled:opacity-75 disabled:cursor-not-allowed leading-relaxed"
                  />
                </div>

                {activeReport.diagnostic.status === "pendiente" && isSignatureAllowed && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Firma Digital del Director *</label>
                    <input
                      type="text"
                      value={signatureName}
                      disabled={isPending}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Escriba su nombre completo para firmar electrónicamente"
                      className="w-full text-xs font-semibold p-3 border border-border-subtle bg-bg-secondary rounded focus:outline-none focus:border-text-primary"
                    />
                    <span className="text-[8px] text-text-muted font-sans block mt-1">Al estampar su nombre, valida el cumplimiento de las normativas de preingeniería y avanza el lead al proceso de cotización formal.</span>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {actionSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {isSignatureAllowed && activeReport.diagnostic.status === "pendiente" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleEmitVerdict("aprobado")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1 transition-all shadow-xs"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleEmitVerdict("requiere_visita")}
                      className="bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1 transition-all shadow-xs"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      Exigir Visita
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleEmitVerdict("rechazado")}
                      className="bg-red-650 hover:bg-red-600 text-white py-2.5 rounded font-bold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1 transition-all shadow-xs"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Rechazar
                    </button>
                  </div>
                )}

                {activeReport.diagnostic.status !== "pendiente" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-text-secondary italic font-semibold">
                    Este diagnóstico ya ha sido auditado y cuenta con un veredicto firme de: <span className="text-text-primary uppercase font-bold">{activeReport.diagnostic.status}</span>.
                    {activeReport.diagnostic.verdictNotes && (
                      <p className="mt-2 text-text-muted font-medium font-sans">" {activeReport.diagnostic.verdictNotes} "</p>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
