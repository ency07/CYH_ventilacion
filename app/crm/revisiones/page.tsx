import React from "react";
import { db } from "@/lib/db";
import { diagnosticReports, leads, crmCompanies, crmActivityLogs } from "@/lib/db/schema";
import { eq, desc, ne } from "drizzle-orm";
import { Wrench, CheckCircle2, XCircle, AlertTriangle, FileText, Search, Clock } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function RevisionesPage() {
  const allReports = await db.select({
    diagnostic: diagnosticReports,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
      riskLevel: leads.riskLevel
    },
    companyName: crmCompanies.name
  })
  .from(diagnosticReports)
  .leftJoin(leads, eq(diagnosticReports.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(diagnosticReports.createdAt));

  const pendientes = allReports.filter(r => r.diagnostic.status === 'pendiente');
  const revisados = allReports.filter(r => r.diagnostic.status !== 'pendiente');

  async function emitirVeredicto(formData: FormData) {
    "use server";
    const diagId = formData.get("diagId") as string;
    const leadId = formData.get("leadId") as string;
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string;

    await db.update(diagnosticReports)
      .set({ status, verdictNotes: notes })
      .where(eq(diagnosticReports.id, diagId));

    await db.insert(crmActivityLogs).values({
      leadId,
      activityType: "veredicto_tecnico",
      description: `El diagnóstico técnico fue marcado como: ${status.toUpperCase()}. Notas: ${notes}`,
    });

    if (status === "aprobado") {
      // Avanzar el lead a propuesta prep
      await db.update(leads).set({ status: 'propuesta_prep', updatedAt: new Date() }).where(eq(leads.id, leadId));
    } else if (status === "requiere_visita") {
      // Retroceder el lead a reunion/visita
      await db.update(leads).set({ status: 'reunion', updatedAt: new Date() }).where(eq(leads.id, leadId));
    }

    revalidatePath('/crm/revisiones');
    revalidatePath(`/crm/${leadId}`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <Wrench className="w-7 h-7 text-accent-cyan" /> 
            Revisiones Técnicas
          </h1>
          <p className="text-sm text-text-muted mt-1">Bandeja exclusiva para el Ingeniero Preventa. Validar diagnósticos antes de la propuesta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
        
        {/* Columna Pendientes */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3 flex items-center justify-between">
            <span>Pendientes de Revisión</span>
            <span className="bg-red-500 text-bg-primary px-2 py-0.5 rounded-full text-xs">{pendientes.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pendientes.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">No hay diagnósticos pendientes de revisión.</p>
            ) : (
              pendientes.map(({ diagnostic, lead, companyName }) => (
                <div key={diagnostic.id} className="p-4 bg-bg-secondary border border-accent-cyan/30 rounded-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-text-primary text-sm uppercase">{companyName || 'Sin Empresa'}</h3>
                      <p className="text-xs text-text-muted">{lead?.fullName}</p>
                    </div>
                    {lead?.riskLevel === "HOT" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> HOT LEAD
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-bg-primary p-2 border border-border-subtle rounded">
                      <span className="block text-text-muted mb-1 uppercase text-[9px] font-bold">Volumen Estimado</span>
                      <span className="font-mono text-text-primary">{diagnostic.airflow ? `${diagnostic.airflow} CFM` : 'N/A'}</span>
                    </div>
                    <div className="bg-bg-primary p-2 border border-border-subtle rounded">
                      <span className="block text-text-muted mb-1 uppercase text-[9px] font-bold">Documento Generado</span>
                      {diagnostic.generatedPdfUrl ? (
                        <a href={diagnostic.generatedPdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent-cyan hover:underline">
                          <FileText className="w-3 h-3" /> Ver PDF
                        </a>
                      ) : (
                        <span className="text-text-muted">Sin Archivo</span>
                      )}
                    </div>
                  </div>

                  <form action={emitirVeredicto} className="flex flex-col gap-3 pt-3 border-t border-border-subtle">
                    <input type="hidden" name="diagId" value={diagnostic.id} />
                    <input type="hidden" name="leadId" value={lead?.id} />
                    <textarea 
                      name="notes" 
                      required 
                      rows={2} 
                      placeholder="Observaciones técnicas, banderas rojas o recomendaciones para el comercial..."
                      className="p-2 text-xs bg-bg-primary border border-border-subtle rounded text-text-primary focus:outline-none focus:border-accent-cyan"
                    ></textarea>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button type="submit" name="status" value="aprobado" className="flex flex-col items-center justify-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors text-emerald-500 group">
                        <CheckCircle2 className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase text-center leading-tight">Aprobar Técnico</span>
                      </button>
                      <button type="submit" name="status" value="requiere_visita" className="flex flex-col items-center justify-center p-2 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-amber-500 group">
                        <AlertTriangle className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase text-center leading-tight">Exigir Visita</span>
                      </button>
                      <button type="submit" name="status" value="rechazado" className="flex flex-col items-center justify-center p-2 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors text-red-500 group">
                        <XCircle className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase text-center leading-tight">Rechazar / Riesgo</span>
                      </button>
                    </div>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Historial de Veredictos */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full opacity-80">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3">Historial de Veredictos</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {revisados.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">No hay revisiones completadas.</p>
            ) : (
              revisados.map(({ diagnostic, lead, companyName }) => (
                <div key={diagnostic.id} className="p-3 bg-bg-secondary border border-border-subtle rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-text-secondary text-sm uppercase">{companyName}</h3>
                      <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(diagnostic.updatedAt || diagnostic.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                      diagnostic.status === 'aprobado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      diagnostic.status === 'requiere_visita' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {diagnostic.status.replace("_", " ")}
                    </span>
                  </div>
                  {diagnostic.verdictNotes && (
                    <div className="mt-3 p-2 bg-bg-primary border border-border-subtle rounded text-xs text-text-secondary italic">
                      "{diagnostic.verdictNotes}"
                    </div>
                  )}
                  <Link href={`/crm/${lead?.id}`} className="text-[10px] font-bold text-accent-cyan hover:underline mt-2 inline-block">
                    Ir a la Ficha Comercial &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
