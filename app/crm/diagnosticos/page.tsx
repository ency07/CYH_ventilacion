import React from "react";
import { db } from "@/lib/db";
import { diagnosticReports, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ClipboardList, FileText, Search, Filter, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DiagnosticosPage() {
  const allDiagnosticos = await db.select({
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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-accent-cyan" /> 
            Bandeja de Diagnósticos Técnicos
          </h1>
          <p className="text-sm text-text-muted mt-1">Pre-ingeniería y resultados del cotizador recibidos de clientes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar reporte..." 
              className="pl-9 pr-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan shadow-sm w-full md:w-64"
            />
          </div>
          <button className="p-2 border border-border-subtle bg-bg-primary rounded-md text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-bg-primary border border-border-subtle rounded-md shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg-tertiary sticky top-0 z-10 border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Prospecto / Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Volumen (CFM)</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Riesgo / Prioridad</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Generado</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {allDiagnosticos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay diagnósticos técnicos generados recientemente.</p>
                </td>
              </tr>
            ) : (
              allDiagnosticos.map(({ diagnostic, lead, companyName }) => (
                <tr key={diagnostic.id} className="hover:bg-bg-secondary/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/crm/${lead?.id}`} className="font-bold text-text-primary uppercase hover:text-accent-cyan transition-colors">
                      {companyName || lead?.fullName || 'Desconocido'}
                    </Link>
                    <p className="text-xs text-text-muted">{lead?.fullName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-primary font-mono bg-bg-tertiary px-2 py-1 rounded border border-border-subtle">
                      {diagnostic.airflow ? `${diagnostic.airflow} CFM` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {lead?.riskLevel === "HOT" ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> URGENTE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded w-fit border border-blue-500/20">
                        ESTÁNDAR
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatDistanceToNow(new Date(diagnostic.createdAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {diagnostic.generatedPdfUrl ? (
                      <a 
                        href={diagnostic.generatedPdfUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 rounded hover:bg-accent-cyan hover:text-bg-primary transition-colors"
                      >
                        <FileText className="w-4 h-4" /> Ver PDF
                      </a>
                    ) : (
                      <span className="text-xs text-text-muted flex items-center justify-end gap-1"><Eye className="w-3 h-3" /> Sin Archivo</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
