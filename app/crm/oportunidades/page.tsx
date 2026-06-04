import React from "react";
import { db } from "@/lib/db";
import { crmOpportunities, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DollarSign, TrendingUp, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Formateador de Moneda Colombiana (COP)
const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default async function OportunidadesPage() {
  const allOpps = await db.select({
    opportunity: crmOpportunities,
    lead: { id: leads.id },
    companyName: crmCompanies.name,
  })
  .from(crmOpportunities)
  .leftJoin(leads, eq(crmOpportunities.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmOpportunities.expectedCloseDate));

  const totalEstimated = allOpps.reduce((acc, curr) => acc + curr.opportunity.estimatedValue, 0);
  const totalWeighted = allOpps.reduce((acc, curr) => acc + curr.opportunity.weightedValue, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-500" /> 
            Forecast Financiero
          </h1>
          <p className="text-sm text-text-muted mt-1">Control de oportunidades avanzadas y proyecciones de cierre ponderadas.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-bold text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-md text-sm font-bold hover:bg-text-secondary transition-colors shadow-md">
            <Plus className="w-4 h-4" /> Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Pipeline Abierto</span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-display font-bold text-blue-500 truncate">{formatCOP(totalEstimated)}</div>
        </div>
        
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Forecast Ponderado (ROI)</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-display font-bold text-text-primary truncate">{formatCOP(totalWeighted)}</div>
        </div>
      </div>

      <div className="flex-1 bg-bg-primary border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-secondary sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Cliente / Título</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Etapa</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-right">Valor Estimado</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-center">Probabilidad</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-right">Valor Ponderado</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Fecha Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {allOpps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-text-muted">No hay oportunidades financieras registradas en el periodo.</td>
                </tr>
              ) : (
                allOpps.map(({ opportunity, lead, companyName }) => (
                  <tr key={opportunity.id} className="hover:bg-bg-secondary/50 transition-colors group">
                    <td className="p-4">
                      <Link href={`/crm/${lead?.id}`} className="font-bold text-text-primary text-sm uppercase hover:text-accent-cyan block">
                        {companyName || 'Desconocido'}
                      </Link>
                      <span className="text-[11px] text-text-secondary">{opportunity.title}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 bg-bg-secondary border border-border-subtle rounded-sm font-semibold uppercase text-text-secondary">
                        {opportunity.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-text-primary">
                      {formatCOP(opportunity.estimatedValue)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${opportunity.probability}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 w-8">{opportunity.probability}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/30">
                      {formatCOP(opportunity.weightedValue)}
                    </td>
                    <td className="p-4 text-xs font-medium text-text-secondary">
                      {opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString() : 'Por definir'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
