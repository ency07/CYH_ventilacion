import React from "react";
import { db } from "@/lib/db";
import { leads, crmOpportunities } from "@/lib/db/schema";
import { BarChart3, TrendingUp, Users, Target, Clock, Zap } from "lucide-react";
import { ConversionChart, SourcePieChart } from "./Charts";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const allLeads = await db.select().from(leads);
  const allOpps = await db.select().from(crmOpportunities);

  const totalLeads = allLeads.length;
  const wonLeads = allLeads.filter(l => l.status === 'ganado').length;
  const lostLeads = allLeads.filter(l => l.status === 'perdido').length;
  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  // Agrupar por etapa para el embudo
  const byStage = {
    nuevo: allLeads.filter(l => l.status === 'nuevo').length,
    contacto: allLeads.filter(l => l.status === 'contacto').length,
    diagnostico: allLeads.filter(l => l.status === 'diagnostico').length,
    reunion: allLeads.filter(l => l.status === 'reunion').length,
    propuesta: allLeads.filter(l => l.status === 'propuesta_entregada').length,
    negociacion: allLeads.filter(l => l.status === 'negociacion').length,
    ganado: wonLeads,
  };

  const chartData = [
    { name: 'Nuevos', cantidad: byStage.nuevo },
    { name: 'Contacto', cantidad: byStage.contacto },
    { name: 'Diagnóstico', cantidad: byStage.diagnostico },
    { name: 'Reunión', cantidad: byStage.reunion },
    { name: 'Propuesta', cantidad: byStage.propuesta },
    { name: 'Negociación', cantidad: byStage.negociacion },
    { name: 'Ganados', cantidad: byStage.ganado },
  ];

  // Agrupar por Origen (Source)
  const sourceCount: Record<string, number> = {};
  allLeads.forEach(l => {
    const s = l.source || 'Desconocido';
    sourceCount[s] = (sourceCount[s] || 0) + 1;
  });
  const sourceData = Object.keys(sourceCount).map(key => ({ name: key, value: sourceCount[key] }));

  // ROI Proyectado
  const projectedROI = allOpps.reduce((acc, curr) => acc + curr.weightedValue, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-accent-cyan" /> 
          Inteligencia de Negocios
        </h1>
        <p className="text-sm text-text-muted mt-1">Métricas de rendimiento, embudos de conversión y análisis global del equipo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-full"><Users className="w-5 h-5 text-blue-500" /></div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Leads</h3>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">{totalLeads}</p>
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-full"><Target className="w-5 h-5 text-emerald-500" /></div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Win Rate</h3>
          </div>
          <p className="text-3xl font-display font-bold text-emerald-500 mt-2">{winRate}%</p>
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent-cyan/10 rounded-full"><TrendingUp className="w-5 h-5 text-accent-cyan" /></div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">ROI Forecast</h3>
          </div>
          <p className="text-2xl font-display font-bold text-text-primary mt-2 truncate">
            ${(projectedROI / 1000000).toFixed(1)}M
          </p>
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-full"><Zap className="w-5 h-5 text-amber-500" /></div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Ciclo Promedio</h3>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary mt-2">14 <span className="text-sm font-normal text-text-muted">días</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-6">Embudo de Ventas Activo</h2>
          <ConversionChart data={chartData} />
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-6">Distribución por Origen</h2>
          <div className="flex-1 flex items-center justify-center">
            {sourceData.length > 0 ? (
              <SourcePieChart data={sourceData} />
            ) : (
              <p className="text-text-muted text-sm">No hay suficientes datos.</p>
            )}
          </div>
          {sourceData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sourceData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}></div>
                  <span className="capitalize">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
