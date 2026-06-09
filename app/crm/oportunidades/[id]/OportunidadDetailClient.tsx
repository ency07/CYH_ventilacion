"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  DollarSign, 
  Calendar, 
  Target, 
  Wrench, 
  FileText, 
  Percent, 
  Save, 
  Loader2, 
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sliders,
  User,
  Info
} from "lucide-react";
import { updateOpportunityAction } from "@/lib/server-actions/crm";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface OportunidadDetailClientProps {
  opportunityDetail: any;
  allCrmUsers: any[];
  userRole: string;
  isAdmin: boolean;
  isTecnico: boolean;
}

export default function OportunidadDetailClient({
  opportunityDetail,
  allCrmUsers,
  userRole,
  isAdmin,
  isTecnico
}: OportunidadDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { opportunity, lead, companyName, diagnosticReport } = opportunityDetail;

  // Local state for editable fields
  const [title, setTitle] = useState(opportunity.title);
  const [serviceType, setServiceType] = useState(opportunity.serviceType);
  const [stage, setStage] = useState(opportunity.stage);
  const [probability, setProbability] = useState(opportunity.probability);
  const [estimatedValue, setEstimatedValue] = useState(opportunity.estimatedValue);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    opportunity.expectedCloseDate 
      ? new Date(opportunity.expectedCloseDate).toISOString().slice(0, 10) 
      : ""
  );
  const [assignedTo, setAssignedTo] = useState(opportunity.assignedTo);
  
  // Tasador (Cost Calculator) local states - initialized with default or saved values
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load custom costs from localStorage if they exist
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMat = localStorage.getItem(`opp_${opportunity.id}_matCost`);
      const savedLab = localStorage.getItem(`opp_${opportunity.id}_labCost`);
      if (savedMat) setMaterialsCost(Number(savedMat));
      else setMaterialsCost(Math.round(opportunity.estimatedValue * 0.4)); // Default 40%

      if (savedLab) setLaborCost(Number(savedLab));
      else setLaborCost(Math.round(opportunity.estimatedValue * 0.2)); // Default 20%
    }
  }, [opportunity.id, opportunity.estimatedValue]);

  // Calculations
  const totalCost = materialsCost + laborCost;
  const netMargin = estimatedValue - totalCost;
  const marginPercent = estimatedValue > 0 ? Math.round((netMargin / estimatedValue) * 100) : 0;
  const weightedValue = Math.round((estimatedValue * probability) / 100);

  // Check critical dates
  const isExpired = opportunity.expectedCloseDate && new Date(opportunity.expectedCloseDate) < new Date();
  const isWithin48h = () => {
    if (!opportunity.expectedCloseDate) return false;
    const diff = new Date(opportunity.expectedCloseDate).getTime() - new Date().getTime();
    const diffHours = diff / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };
  const critical = isExpired || isWithin48h();

  // Save fields to database and localStorage
  const handleSave = async () => {
    setError("");
    setSaveSuccess(false);

    startTransition(async () => {
      try {
        const res = await updateOpportunityAction(opportunity.id, {
          title,
          serviceType,
          stage,
          probability,
          estimatedValue: Number(estimatedValue),
          expectedCloseDate: expectedCloseDate || null,
          assignedTo,
        });

        if (res.success) {
          // Persist materials and labor costs locally
          if (typeof window !== "undefined") {
            localStorage.setItem(`opp_${opportunity.id}_matCost`, String(materialsCost));
            localStorage.setItem(`opp_${opportunity.id}_labCost`, String(laborCost));
          }
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          router.refresh();
        } else {
          setError(res.error);
        }
      } catch (err: any) {
        setError(err.message || "Error al actualizar la oportunidad");
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* TOP HEADER / CONTEXT BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href="/crm/oportunidades"
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-650 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-450 uppercase">
                OP-{opportunity.id.slice(0, 6).toUpperCase()}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded uppercase tracking-wider">
                {opportunity.stage.replace(/_/g, " ")}
              </span>
              {critical && (
                <span className="bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Licitación Crítica
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-tight mt-0.5">
              {companyName || lead.companyName || "Desconocido"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-650 bg-red-50 px-2.5 py-1 rounded border border-red-100 font-medium">
              {error}
            </span>
          )}
          {saveSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold">
              ✓ Cambios guardados
            </span>
          )}
          {!isTecnico && (
            <button 
              disabled={isPending}
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* CORE THREE QUADRANTS (TRÍPTICO) */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CUADRANTE 1: COMERCIAL */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between h-fit lg:h-full overflow-y-auto min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Target className="w-5 h-5 text-slate-650" />
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Cuadrante Comercial</h2>
            </div>

            <div className="space-y-4">
              {/* Título de Proyecto */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título de la Oportunidad</label>
                <input 
                  type="text"
                  disabled={isTecnico}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-450 disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                />
              </div>

              {/* Tipo de Solución */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo de Solución B2B</label>
                <select
                  disabled={isTecnico}
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-450 disabled:bg-slate-100 disabled:text-slate-500 font-semibold uppercase"
                >
                  <option value="venta">Venta / Suministro</option>
                  <option value="fabricacion">Fabricación</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reparacion">Reparación</option>
                </select>
              </div>

              {/* Etapa Comercial */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Etapa de la Negociación</label>
                <select
                  disabled={isTecnico}
                  value={stage}
                  onChange={e => setStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-450 disabled:bg-slate-100 disabled:text-slate-500 font-semibold uppercase text-capitalize"
                >
                  <option value="analisis">Análisis Técnico</option>
                  <option value="propuesta">Propuesta Presentada</option>
                  <option value="negociacion">Negociación Comercial</option>
                  <option value="cerrado_ganado">✓ Cerrado Ganado</option>
                  <option value="cerrado_perdido">✗ Cerrado Perdido</option>
                </select>
              </div>

              {/* Probabilidad con ProgressBar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Probabilidad de Éxito</label>
                  <span className="text-xs font-bold text-slate-800">{probability}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={isTecnico}
                  value={probability}
                  onChange={e => setProbability(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed"
                />
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      probability >= 70 
                        ? "bg-emerald-500" 
                        : probability >= 30 
                        ? "bg-blue-500" 
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${probability}%` }}
                  ></div>
                </div>
              </div>

              {/* Fecha Límite */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha Límite de Licitación</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    disabled={isTecnico}
                    value={expectedCloseDate}
                    onChange={e => setExpectedCloseDate(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-1.5 bg-slate-55 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-450 disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                  />
                </div>
              </div>

              {/* Asesor Asignado */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asesor Comercial</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    disabled={isTecnico || !isAdmin}
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-450 disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                  >
                    {allCrmUsers.map(u => (
                      <option key={u.id} value={u.email}>{u.fullName || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4 mt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contacto Principal</span>
            <span className="text-xs font-bold text-slate-700 block mt-1 uppercase">{lead.fullName}</span>
            <span className="text-[11px] text-slate-500 block">{lead.email}</span>
            <span className="text-[11px] text-slate-500 block">{lead.phone}</span>
          </div>
        </div>

        {/* CUADRANTE 2: PREINGENIERÍA */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between h-fit lg:h-full overflow-y-auto min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Wrench className="w-5 h-5 text-slate-650" />
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Cuadrante de Preingeniería</h2>
            </div>

            {diagnosticReport ? (
              <div className="space-y-4">
                {/* CFM & Telemetría */}
                <div className="bg-slate-50 border border-slate-150 rounded p-3.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Caudal de Aire Requerido (CFM)</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-mono font-bold text-slate-900">
                      {diagnosticReport.airflow ? diagnosticReport.airflow.toLocaleString() : "Sin calcular"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">CFM</span>
                  </div>
                  
                  {/* Dimensiones de la nave */}
                  {diagnosticReport.dimensions && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Largo:</span>
                        <span className="font-bold text-slate-700">
                          {diagnosticReport.dimensions.length || 0} m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Ancho:</span>
                        <span className="font-bold text-slate-700">
                          {diagnosticReport.dimensions.width || 0} m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Alto:</span>
                        <span className="font-bold text-slate-700">
                          {diagnosticReport.dimensions.height || 0} m
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observaciones Técnicas */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observaciones Técnicas en Campo</span>
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 font-medium leading-relaxed max-h-24 overflow-y-auto">
                    {diagnosticReport.technicalObservations || "Sin observaciones registradas."}
                  </p>
                </div>

                {/* Recomendación de Equipos */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recomendación de Motores / Caudales</span>
                  <p className="text-xs text-slate-650 bg-slate-50 border border-slate-200 rounded p-2.5 font-medium leading-relaxed max-h-24 overflow-y-auto">
                    {diagnosticReport.recommendations || "Sin recomendaciones técnicas de motores."}
                  </p>
                </div>

                {/* Sugerencia de Materiales */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sugerencia de Materiales Estructurales</span>
                  <p className="text-xs text-slate-650 bg-slate-50 border border-slate-200 rounded p-2.5 font-medium leading-relaxed max-h-24 overflow-y-auto">
                    {diagnosticReport.materialSuggestions || "Sin sugerencias de materiales estructuradas."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-md border border-dashed border-slate-250 min-h-[200px]">
                <Info className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reporte Técnico Pendiente</span>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  No se ha cargado un diagnóstico en campo para este Lead comercial.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Estado Técnico:</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase ${
              diagnosticReport?.status === "aprobado" 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                : "bg-amber-50 text-amber-700 border border-amber-150"
            }`}>
              {diagnosticReport?.status || "Pendiente"}
            </span>
          </div>
        </div>

        {/* CUADRANTE 3: FINANCIERO (TASADOR DE COSTEO) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between h-fit lg:h-full overflow-y-auto min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Percent className="w-5 h-5 text-slate-650" />
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Cuadrante Financiero</h2>
            </div>

            {isTecnico ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-50/30 rounded-lg border border-red-150 min-h-[250px]">
                <ShieldAlert className="w-10 h-10 text-red-500 mb-2 animate-bounce" />
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Acceso Restringido</span>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[200px] font-semibold">
                  Su perfil de Técnico / Ingeniero no tiene permisos para ver o modificar los márgenes financieros y montos comerciales.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Resumen del Ponderado */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Forecast Ponderado</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{formatCOP(weightedValue)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor Bruto Licitado</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{formatCOP(estimatedValue)}</span>
                  </div>
                </div>

                {/* Tasador Live Input Slider */}
                <div className={`p-4 border rounded-md transition-colors ${
                  marginPercent < 30 ? "border-amber-300 bg-amber-50/20" : "border-slate-200 bg-slate-50/20"
                }`}>
                  <h3 className="text-xs font-bold text-slate-850 uppercase mb-3 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-slate-600" /> Tasador Técnico de Precios
                  </h3>

                  <div className="space-y-4">
                    {/* Input Valor Venta */}
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Precio Venta (COP):</span>
                        <span className="text-slate-800">{formatCOP(estimatedValue)}</span>
                      </div>
                      <input 
                        type="number"
                        disabled={!isAdmin && userRole !== "vendedor" && userRole !== "comercial"}
                        value={estimatedValue}
                        onChange={e => setEstimatedValue(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-semibold"
                      />
                    </div>

                    {/* Costo Materiales Slider/Input */}
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Costo Materiales (COP):</span>
                        <span className="text-slate-800">{formatCOP(materialsCost)}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={estimatedValue}
                        value={materialsCost}
                        onChange={e => setMaterialsCost(Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                      <input 
                        type="number"
                        value={materialsCost}
                        onChange={e => setMaterialsCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-mono font-semibold mt-1"
                      />
                    </div>

                    {/* Costo Mano de Obra Slider/Input */}
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Costo Mano de Obra (COP):</span>
                        <span className="text-slate-800">{formatCOP(laborCost)}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={estimatedValue}
                        value={laborCost}
                        onChange={e => setLaborCost(Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                      <input 
                        type="number"
                        value={laborCost}
                        onChange={e => setLaborCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-mono font-semibold mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Margin alert */}
                {marginPercent < 30 && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded p-2.5 text-[11px] font-medium flex items-start gap-1.5 leading-snug">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Alerta de Rentabilidad:</strong> El margen técnico está por debajo del 30%. Revise costos o solicite autorización comercial.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isTecnico && (
            <div className="border-t border-slate-100 pt-4 mt-6 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Costo Total Base:</span>
                <span className="font-mono font-bold text-slate-750">{formatCOP(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Margen Comercial Neto:</span>
                <span className={`font-mono font-bold ${netMargin >= 0 ? "text-emerald-600" : "text-red-650"}`}>
                  {formatCOP(netMargin)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-800">Porcentaje de Margen:</span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                  marginPercent >= 40 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : marginPercent >= 30 
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {marginPercent}%
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
