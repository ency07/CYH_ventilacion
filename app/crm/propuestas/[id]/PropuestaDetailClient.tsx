"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  Target, 
  Wrench, 
  Percent, 
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  User,
  Printer,
  Share2,
  FileSignature,
  Download,
  Info,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { updateProposalStatusAction } from "@/lib/server-actions/crm";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PropuestaDetailClientProps {
  proposalDetail: any;
  allCrmUsers: any[];
  userRole: string;
  isAdmin: boolean;
}

export default function PropuestaDetailClient({
  proposalDetail,
  allCrmUsers,
  userRole,
  isAdmin
}: PropuestaDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { proposal, lead, companyName, opportunity, diagnosticReport } = proposalDetail;

  const [status, setStatus] = useState(proposal.status);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Budget calculations
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && opportunity) {
      const savedMat = localStorage.getItem(`opp_${opportunity.id}_matCost`);
      const savedLab = localStorage.getItem(`opp_${opportunity.id}_labCost`);
      
      if (savedMat) setMaterialsCost(Number(savedMat));
      else setMaterialsCost(Math.round(proposal.totalValue * 0.4)); // Default 40%

      if (savedLab) setLaborCost(Number(savedLab));
      else setLaborCost(Math.round(proposal.totalValue * 0.2)); // Default 20%
    }
  }, [opportunity, proposal.totalValue]);

  const totalCost = materialsCost + laborCost;
  const isBudgetIncomplete = proposal.totalValue <= 0 || totalCost <= 0;

  // Check critical dates
  const isExpired = proposal.status === "enviada" && proposal.validUntil && new Date(proposal.validUntil) < new Date();

  // Role permissions
  const canApprove = isAdmin || ["admin", "super_admin", "director_comercial", "director"].includes(userRole);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "aceptada" && !canApprove) {
      setError("No tiene autorización para aprobar esta propuesta. Solicite la firma del Director Comercial.");
      return;
    }
    
    setError("");
    setSaveSuccess(false);

    startTransition(async () => {
      try {
        const res = await updateProposalStatusAction(proposal.id, newStatus);
        if (res.success) {
          setStatus(newStatus);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          router.refresh();
        } else {
          setError(res.error);
        }
      } catch (err: any) {
        setError(err.message || "Error al actualizar el estado");
      }
    });
  };

  const handlePrint = () => {
    if (isBudgetIncomplete) return;
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (isBudgetIncomplete) return;
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/crm/propuestas/${proposal.id}`;
      const text = encodeURIComponent(
        `Estimado cliente,\nCYH Industrial ha generado su oferta de ingeniería formal para el proyecto "${proposal.title}".\n\nPuede revisar el desglose y especificaciones en línea en el siguiente enlace:\n${link}\n\nQuedamos atentos a sus comentarios.`
      );
      const url = `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href="/crm/propuestas"
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-655 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                COT-{proposal.id.slice(0, 6).toUpperCase()}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-250 text-slate-600 rounded font-mono">
                VERS. {proposal.version}.0
              </span>
              {isExpired && (
                <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Oferta Expirada
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
            <span className="text-xs text-red-650 bg-red-50 px-2.5 py-1.5 rounded border border-red-150 font-medium">
              {error}
            </span>
          )}
          {saveSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-150 font-bold">
              ✓ Cambios aplicados
            </span>
          )}
        </div>
      </div>

      {/* CORE LAYOUT */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (2/3): PRESUPUESTO Y ESPECIFICACIONES TÉCNICAS */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto h-full pr-1">
          
          {/* Failsafe warning banner */}
          {isBudgetIncomplete && (
            <div className="bg-red-50 border-l-4 border-l-red-650 p-4 rounded-r-lg shadow-sm border border-slate-200 flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-650 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Alerta: Costeo Base Incompleto</h3>
                <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                  Esta propuesta comercial se generó desde una oportunidad sin datos de costeo base. 
                  No es posible generar el PDF formal ni compartir el enlace por WhatsApp hasta que el tasador financiero esté completo en la ficha comercial de la oportunidad.
                </p>
                <Link 
                  href={`/crm/oportunidades/${opportunity?.id || ""}`}
                  className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-bold underline mt-2.5 uppercase tracking-wide"
                >
                  Ir al Tasador Comercial <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* PRESUPUESTO DE INGENIERÍA */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Presupuesto y Desglose Técnico</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                PROPOSAL VALUE
              </span>
            </div>

            <div className="space-y-4">
              {/* Itemized budget breakdown */}
              <div className="divide-y divide-slate-100">
                
                {/* Item 1: Motors/Fans */}
                <div className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-850">Suministro de Motores Industriales y Extractores Helicocentrífugos</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Equipos principales de extracción con acoplamiento directo y motor de alta eficiencia.
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {isBudgetIncomplete ? "$0" : formatCOP(Math.round(materialsCost * 0.4))}
                  </span>
                </div>

                {/* Item 2: Ducts */}
                <div className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-850">Ducterías, Acoples y Soportería Estructural</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Laminado en acero inoxidable AISI 316 o galvanizado calibre 18 según requerimiento corrosivo.
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {isBudgetIncomplete ? "$0" : formatCOP(Math.round(materialsCost * 0.6))}
                  </span>
                </div>

                {/* Item 3: Labor */}
                <div className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-850">Montaje Mecánico, Puesta en Marcha y Calibración</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Mano de obra certificada, instalación física en planta, pruebas de caudal y balanceo de hélices.
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {isBudgetIncomplete ? "$0" : formatCOP(laborCost)}
                  </span>
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 flex justify-between items-center mt-6">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Monto Consolidado de Oferta</span>
                  <span className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                    {formatCOP(proposal.totalValue)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Moneda de Licitación</span>
                  <span className="text-sm font-bold text-slate-700 block mt-0.5 uppercase">
                    {proposal.currency} (Peso Colombiano)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRÍA Y PREINGENIERÍA VINCULADA */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
              <Wrench className="w-5 h-5 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Variables de Preingeniería del Contrato</h2>
            </div>

            {diagnosticReport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Caudal CFM Requerido</span>
                    <span className="text-sm font-mono font-bold text-slate-800 block mt-0.5">
                      {diagnosticReport.airflow ? `${diagnosticReport.airflow.toLocaleString()} CFM` : "Sin telemetría"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dimensiones de Planta</span>
                    <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">
                      {diagnosticReport.dimensions 
                        ? `${diagnosticReport.dimensions.length}m (Largo) x ${diagnosticReport.dimensions.width}m (Ancho) x ${diagnosticReport.dimensions.height}m (Alto)`
                        : "No especificadas"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sugerencia de Materiales</span>
                    <span className="text-xs font-medium text-slate-650 block mt-0.5">
                      {diagnosticReport.materialSuggestions || "Sin especificar"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recomendaciones de Motor</span>
                    <span className="text-xs font-medium text-slate-650 block mt-0.5 truncate">
                      {diagnosticReport.recommendations || "Sin especificar"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 font-medium">
                No hay un diagnóstico técnico de preingeniería asociado a esta propuesta comercial.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (1/3): PANEL DE CONTROL & ACCIONES */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between h-fit lg:h-full min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Target className="w-5 h-5 text-slate-650" />
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Control de Propuesta</h2>
            </div>

            {/* Current status display */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Contractual Actual</span>
              <div className="mt-2">
                {status === "aceptada" ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-4 h-4" /> PROPUESTA APROBADA
                  </span>
                ) : status === "rechazada" ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-250 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                    <XCircle className="w-4 h-4" /> PROPUESTA RECHAZADA
                  </span>
                ) : status === "enviada" ? (
                  <span className="bg-blue-50 text-blue-700 border border-blue-250 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                    <Clock className="w-4 h-4" /> OPORTUNIDAD ENVIADA
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-700 border border-slate-250 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                    <HelpCircle className="w-4 h-4" /> BORRADOR LOCAL
                  </span>
                )}
              </div>
            </div>

            {/* Status Selectors */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cambiar Estado Contractual</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Borrador button */}
                <button 
                  disabled={isPending || status === "aceptada"}
                  onClick={() => handleStatusChange("borrador")}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-md border text-left flex items-center justify-between transition-colors ${
                    status === "borrador" 
                      ? "bg-slate-50 border-slate-400 text-slate-900" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>1. Borrador Local</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">Pre-emisión</span>
                </button>

                {/* Enviada button */}
                <button 
                  disabled={isPending || status === "aceptada"}
                  onClick={() => handleStatusChange("enviada")}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-md border text-left flex items-center justify-between transition-colors ${
                    status === "enviada" 
                      ? "bg-blue-50/35 border-blue-400 text-blue-800" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>2. Enviada al Cliente</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded uppercase">Vigente</span>
                </button>

                {/* Aprobada button (Aceptada) - Restricted to admin/director */}
                {canApprove ? (
                  <button 
                    disabled={isPending || status === "aceptada"}
                    onClick={() => handleStatusChange("aceptada")}
                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-md border text-left flex items-center justify-between transition-colors ${
                      status === "aceptada" 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
                    }`}
                  >
                    <span>3. Aprobar Propuesta (Firma)</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-750 text-white rounded uppercase">Aceptada</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[11px] text-slate-500 font-semibold flex items-start gap-1.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Aprobación restringida. Solo administradores o el Director Comercial pueden firmar y autorizar este contrato.
                    </span>
                  </div>
                )}

                {/* Rechazada button */}
                <button 
                  disabled={isPending || status === "aceptada"}
                  onClick={() => handleStatusChange("rechazada")}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-md border text-left flex items-center justify-between transition-colors ${
                    status === "rechazada" 
                      ? "bg-rose-50 border-rose-450 text-rose-800" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>4. Rechazada por Cliente</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-650 rounded uppercase">Cerrado</span>
                </button>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (GENERATE PDF & SHARE WHATSAPP) */}
          <div className="border-t border-slate-100 pt-5 mt-6 space-y-2.5">
            <button 
              disabled={isBudgetIncomplete || isPending}
              onClick={handlePrint}
              className={`w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                isBudgetIncomplete 
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                  : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <Printer className="w-4 h-4" /> 📄 Generar PDF Formal
            </button>

            <button 
              disabled={isBudgetIncomplete || isPending}
              onClick={handleShareWhatsApp}
              className={`w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                isBudgetIncomplete 
                  ? "bg-white text-slate-350 border-slate-200 cursor-not-allowed" 
                  : "bg-white text-slate-900 border-slate-900 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              <Share2 className="w-4 h-4" /> 📲 Compartir por WhatsApp
            </button>
          </div>

        </div>

      </div>

      {/* PRINT LAYOUT PAPERS (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      {!isBudgetIncomplete && (
        <div className="hidden print:block bg-white text-slate-900 p-12 w-full max-w-[800px] mx-auto aspect-[1/1.4] relative min-h-screen">
          <div className="flex justify-between items-start border-b border-slate-900 pb-6 mb-8">
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#0a1c30]">CYH INDUSTRIAL S.A.S.</h1>
              <p className="text-[9px] tracking-widest text-slate-550 uppercase">Sistemas Avanzados de Ventilación y Extracción</p>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>NIT: 900.123.456-7</p>
              <p>Barranquilla, Colombia</p>
            </div>
          </div>

          <div className="my-8">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Propuesta Comercial Formal</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1 uppercase">{proposal.title}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <p className="font-semibold">Cliente: {companyName || lead.companyName}</p>
                <p>Contacto: Eng. {lead.fullName}</p>
                <p>Ciudad: {lead.city}</p>
              </div>
              <div className="text-right">
                <p>Fecha de Emisión: {new Date(proposal.createdAt).toLocaleDateString()}</p>
                <p className="font-bold">Vigencia: {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : "30 días"}</p>
                <p>Asesor: {opportunity?.assignedTo || "Asesor Asignado"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border border-slate-300 rounded p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Resumen de Preingeniería Asociada</h3>
            <table className="w-full text-xs text-left border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-500">Caudal Volumétrico CFM Requerido:</td>
                  <td className="py-1 font-mono font-bold text-slate-950 text-right">{diagnosticReport?.airflow?.toLocaleString() || "N/A"} CFM</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-500">Dimensiones de la Nave Industrial:</td>
                  <td className="py-1 font-mono font-bold text-slate-950 text-right">
                    {diagnosticReport?.dimensions 
                      ? `${diagnosticReport.dimensions.length}m x ${diagnosticReport.dimensions.width}m x ${diagnosticReport.dimensions.height}m`
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-500">Especificaciones Sugeridas de Materiales:</td>
                  <td className="py-1 font-medium text-slate-950 text-right">{diagnosticReport?.materialSuggestions || "Estándar"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t border-slate-350 pt-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Presupuesto Detallado</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-400 font-bold text-[10px] text-slate-500 uppercase">
                  <th className="py-2">Descripción de Ítem / Servicio</th>
                  <th className="py-2 text-right">Monto Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3">
                    <p className="font-bold text-slate-950">Suministro de Motores y Caudales Helicocentrífugos</p>
                    <p className="text-[9px] text-slate-550">Equipos de extracción primaria con acoplamiento directo.</p>
                  </td>
                  <td className="py-3 text-right font-mono font-bold">{formatCOP(Math.round(materialsCost * 0.4))}</td>
                </tr>
                <tr>
                  <td className="py-3">
                    <p className="font-bold text-slate-950">Ductería y Soportería Estructural</p>
                    <p className="text-[9px] text-slate-550">Laminado de ductos de flujo volumétrico en acero inoxidable.</p>
                  </td>
                  <td className="py-3 text-right font-mono font-bold">{formatCOP(Math.round(materialsCost * 0.6))}</td>
                </tr>
                <tr>
                  <td className="py-3">
                    <p className="font-bold text-slate-950">Instalación Mecánica, Balanceo y Calibración</p>
                    <p className="text-[9px] text-slate-550">Montaje físico en planta y calibración técnica en frío.</p>
                  </td>
                  <td className="py-3 text-right font-mono font-bold">{formatCOP(laborCost)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-400 font-bold text-slate-900">
                  <td className="py-4 uppercase">Valor Total Propuesto (Neto):</td>
                  <td className="py-4 text-right font-mono text-sm">{formatCOP(proposal.totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-slate-200 pt-8 text-[10px]">
            <div>
              <div className="h-12 border-b border-slate-400 w-36 mb-2"></div>
              <p className="font-bold text-slate-700">Firma Autorizada CYH</p>
              <p className="text-slate-400">Director de Ingeniería</p>
            </div>
            <div className="text-right">
              <div className="h-12 border-b border-slate-400 w-36 mb-2 ml-auto"></div>
              <p className="font-bold text-slate-700">Aceptado por Cliente</p>
              <p className="text-slate-400">Representante Legal</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
