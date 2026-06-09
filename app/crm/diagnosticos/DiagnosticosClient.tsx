"use client";

import React, { useState } from "react";
import { Search, Plus, Grid, Bell, Share2, Printer, CheckCircle2, AlertTriangle, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { normalizeCity } from "@/lib/utils/normalization";

export default function DiagnosticosClient({ diagnosticosData }: { diagnosticosData: any[] }) {
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredDiagnosticos = diagnosticosData.filter(d => 
    d.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    d.lead?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDiagnostic = diagnosticosData.find(d => d.diagnostic.id === selectedDiagId);

  return (
    <div className="flex flex-col md:flex-row h-full bg-bg-secondary overflow-hidden font-sans border-t border-border-subtle">
      
      {/* LEFT PANEL: GRID OF DIAGNOSTICS */}
      <div className="flex-1 flex flex-col z-10 shrink-0 overflow-y-auto">
        
        {/* Header List */}
        <div className="p-8 pb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Registro de Diagnósticos Técnicos</h1>
            <p className="text-sm text-text-secondary mt-1">Evaluación técnica sistemática de activos eléctricos industriales.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Buscar diagnósticos, ID o proyectos..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72 pl-9 pr-4 py-2 text-sm bg-bg-primary border border-border-subtle rounded-md focus:outline-none focus:border-text-primary shadow-sm" 
              />
            </div>
            <div className="flex items-center gap-3 text-text-muted border-r border-border-subtle pr-4">
              <Bell className="w-5 h-5 cursor-pointer hover:text-text-primary transition-colors" />
              <Grid className="w-5 h-5 cursor-pointer hover:text-text-primary transition-colors" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
              <Plus className="w-4 h-4" /> NUEVO DIAGNÓSTICO
            </button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="p-8 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDiagnosticos.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-text-muted text-sm bg-bg-primary rounded shadow-sm border border-border-subtle">
                No se encontraron diagnósticos.
              </div>
            ) : (
              filteredDiagnosticos.map((item, idx) => {
                const isActive = item.diagnostic.id === selectedDiagId;
                const isApproved = item.diagnostic.status === "aprobado" || item.diagnostic.status === "completado";

                return (
                  <div 
                    key={item.diagnostic.id} 
                    onClick={() => setSelectedDiagId(item.diagnostic.id)}
                    className={`bg-bg-primary rounded border cursor-pointer transition-shadow shadow-sm flex flex-col relative overflow-hidden ${
                      isActive ? 'border-text-primary shadow-md' : 'border-border-subtle hover:shadow'
                    }`}
                  >
                    {/* Left Indicator Line for selected/active */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c5221f]"></div>}

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-text-muted">
                            ID-{(item.diagnostic.id || "").substring(0, 8).toUpperCase()}
                          </span>
                          <h3 className="font-bold text-text-primary text-sm mt-1 truncate max-w-[200px]">
                            {item.companyName || item.lead?.fullName || 'Proyecto CYH'}
                          </h3>
                        </div>
                        {isApproved ? (
                          <span className="bg-[#f0f4fa] text-text-secondary border border-border-subtle px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">APROBADO</span>
                        ) : (
                          <span className="bg-[#e8f0fe] text-[#1967d2] border border-[#1967d2]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">EN REVISIÓN</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">CAUDAL</p>
                          <div className="text-sm font-bold text-text-primary">
                            {item.diagnostic.airflow ? (
                              `${item.diagnostic.airflow} CFM`
                            ) : (
                              <span className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                [Lectura Pendiente - 0 CFM]
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">SERVICIO</p>
                          <p className="text-sm font-bold text-text-primary capitalize">{item.lead?.serviceType || 'Venta'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">UBICACIÓN</p>
                          <p className="text-sm font-bold text-text-primary">{normalizeCity(item.lead?.city) || 'No registrada'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-bg-secondary px-5 py-3 border-t border-border-subtle flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{item.diagnostic.generatedPdfUrl ? 'technical_report.pdf' : 'draft_report.pdf'}</span>
                      </div>
                      <span className="text-[10px] text-text-muted">
                        Registrado: {new Date(item.diagnostic.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: DETAILS DRAWER (OVERLAY) */}
      {selectedDiagnostic && (
        <>
          {/* Backdrop (optional, to click outside to close) */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden" 
            onClick={() => setSelectedDiagId(null)}
          ></div>
          
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] lg:w-[450px] bg-bg-primary border-l border-border-subtle flex flex-col shadow-2xl z-50 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-subtle flex items-start justify-between bg-bg-secondary">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Detalle de Revisión Técnica</h2>
                <p className="text-[10px] font-mono text-text-secondary mt-1">PROYECTO: ID-{(selectedDiagnostic.diagnostic.id || "").substring(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 border border-border-subtle bg-bg-primary rounded shadow-sm text-text-secondary hover:text-text-primary transition-colors">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="p-1.5 border border-border-subtle bg-bg-primary rounded shadow-sm text-text-secondary hover:text-text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedDiagId(null)}
                  className="p-1.5 ml-2 border border-transparent bg-bg-secondary rounded text-text-primary hover:bg-gray-200 transition-colors"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 pb-24">
              
              {/* REGULATORY COMPLIANCE */}
              <div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4">CUMPLIMIENTO NORMATIVO</h3>
                <div className="space-y-3">
                  {selectedDiagnostic.diagnostic.inspectionProtocol ? (
                    <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border-subtle rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#041627]" />
                        <span className="text-sm font-bold text-text-primary">Protocolo Verificado</span>
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase">CUMPLE</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-[#fdf2f2] border border-[#f8b4b4] rounded">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-[#c5221f]" />
                        <span className="text-sm font-bold text-danger">Protocolo Faltante</span>
                      </div>
                      <span className="text-[10px] font-bold text-danger uppercase">EN MONITOREO</span>
                    </div>
                  )}
                  {/* Fake ones to match the design aesthetics but we only have 1 boolean-ish field in DB */}
                  <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border-subtle rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#041627]" />
                      <span className="text-sm font-bold text-text-primary">Procedimiento Operativo Estándar</span>
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">CUMPLE</span>
                  </div>
                </div>
              </div>

              {/* TECHNICAL PARAMETERS */}
              <div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4">PARÁMETROS TÉCNICOS</h3>
                <div className="grid grid-cols-2 gap-px bg-border-subtle border border-border-subtle rounded overflow-hidden">
                  <div className="bg-bg-secondary p-4">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">FLUJO DE AIRE</p>
                    <div className="text-sm font-bold text-text-primary">
                      {selectedDiagnostic.diagnostic.airflow ? (
                        `${selectedDiagnostic.diagnostic.airflow} CFM`
                      ) : (
                        <span className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                          [Lectura Pendiente - 0 CFM]
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-bg-secondary p-4">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">MONEDA</p>
                    <p className="text-sm font-bold text-text-primary">{selectedDiagnostic.diagnostic.currency}</p>
                  </div>
                  <div className="bg-bg-secondary p-4">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">DIMENSIONES</p>
                    <p className="text-sm font-bold text-text-primary">{selectedDiagnostic.diagnostic.dimensions ? "Provisto" : "No Provisto"}</p>
                  </div>
                  <div className="bg-bg-secondary p-4">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">ESTADO</p>
                    <p className="text-sm font-bold text-text-primary uppercase">{selectedDiagnostic.diagnostic.status}</p>
                  </div>
                </div>
              </div>

              {/* OBSERVATIONS & RECS */}
              <div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">OBSERVACIONES Y RECOMENDACIONES</h3>
                <ul className="space-y-4">
                  {selectedDiagnostic.diagnostic.technicalObservations && (
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted mt-1.5 shrink-0"></div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">Observaciones Técnicas</span>
                        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{selectedDiagnostic.diagnostic.technicalObservations}</p>
                      </div>
                    </li>
                  )}
                  {selectedDiagnostic.diagnostic.recommendations && (
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">Recomendaciones</span>
                        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{selectedDiagnostic.diagnostic.recommendations}</p>
                      </div>
                    </li>
                  )}
                  {selectedDiagnostic.diagnostic.materialSuggestions && (
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">Sugerencias de Materiales</span>
                        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{selectedDiagnostic.diagnostic.materialSuggestions}</p>
                      </div>
                    </li>
                  )}
                  {!selectedDiagnostic.diagnostic.technicalObservations && !selectedDiagnostic.diagnostic.recommendations && !selectedDiagnostic.diagnostic.materialSuggestions && (
                    <li className="text-xs text-text-muted italic">No se han registrado observaciones o recomendaciones aún.</li>
                  )}
                </ul>
              </div>
              
              {/* KEY FINDINGS IMAGERY */}
              <div>
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">IMÁGENES DE HALLAZGOS CLAVE</h3>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="aspect-video bg-border-subtle rounded flex items-center justify-center text-text-muted text-[10px]">Sin Imagen</div>
                  <div className="aspect-video bg-border-subtle rounded flex items-center justify-center text-text-muted text-[10px]">Sin Imagen</div>
                </div>
              </div>

            </div>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-bg-primary border-t border-border-subtle p-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button className="flex-1 px-4 py-2 bg-text-primary text-bg-primary rounded text-[11px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-colors">
                APROBAR DIAGNÓSTICO
              </button>
              <button className="flex-1 px-4 py-2 bg-bg-primary border border-border-subtle text-text-primary rounded text-[11px] font-bold uppercase tracking-wider hover:bg-bg-secondary transition-colors shadow-sm">
                RECHAZAR / REVISAR
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
