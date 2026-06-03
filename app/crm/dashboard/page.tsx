import React from "react";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { DollarSign, LineChart, Target, AlertTriangle, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import { eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardGerencialPage() {
  const allLeads = await db.select().from(leads);

  // KPIs Básicos
  const totalLeads = allLeads.length;
  const ganados = allLeads.filter(l => l.status === 'ganado').length;
  const perdidos = allLeads.filter(l => l.status === 'perdido').length;
  const abiertos = totalLeads - ganados - perdidos;
  
  const winRate = totalLeads > 0 ? ((ganados / totalLeads) * 100).toFixed(1) : "0.0";

  // Forecast Comercial (Pipeline Total vs Probable)
  // Utilizando probabilidades fijas como definimos en el Kanban
  const getProbability = (stage: string) => {
    switch (stage) {
      case 'nuevo': return 0.10;
      case 'contacto': return 0.20;
      case 'diagnostico': return 0.40;
      case 'reunion': return 0.50;
      case 'propuesta_entregada': return 0.70;
      case 'negociacion': return 0.80;
      case 'ganado': return 1.0;
      case 'perdido': return 0.0;
      default: return 0.0;
    }
  };

  let pipelineTotal = 0;
  let pipelineProbable = 0;

  allLeads.forEach(lead => {
    if (lead.status !== 'perdido') {
      const valor = lead.estimatedBudgetMax || 0;
      pipelineTotal += valor;
      pipelineProbable += valor * getProbability(lead.status);
    }
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">Dashboard Gerencial</h1>
        <p className="text-sm text-text-muted mt-1">Métricas en tiempo real del pipeline comercial.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Leads Totales</span>
            <Users className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="text-3xl font-display font-bold text-text-primary">{totalLeads}</div>
          <span className="text-xs text-text-secondary mt-2">Registros históricos</span>
        </div>
        
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Win Rate</span>
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-display font-bold text-emerald-500">{winRate}%</div>
          <span className="text-xs text-text-secondary mt-2">{ganados} ganados / {totalLeads} totales</span>
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Pipeline Total</span>
            <LineChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-display font-bold text-blue-500">${(pipelineTotal / 1000000).toFixed(1)}M</div>
          <span className="text-xs text-text-secondary mt-2">Valor bruto abierto</span>
        </div>

        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform border-l-4 border-l-accent-cyan">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Forecast Probable</span>
            <DollarSign className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="text-3xl font-display font-bold text-text-primary">${(pipelineProbable / 1000000).toFixed(1)}M</div>
          <span className="text-xs text-text-secondary mt-2">Ponderado por probabilidad</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Conversión (Simulado visualmente) */}
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-text-muted" /> Embudo de Conversión (Etapas)
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary w-32">1. Nuevos</span>
              <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden mx-4">
                <div className="h-full bg-border-medium w-full"></div>
              </div>
              <span className="text-xs font-bold text-text-primary w-12 text-right">100%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary w-32">2. Contacto</span>
              <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden mx-4">
                <div className="h-full bg-blue-400 w-[72%]"></div>
              </div>
              <span className="text-xs font-bold text-text-primary w-12 text-right">72%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary w-32">3. Reunión</span>
              <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden mx-4">
                <div className="h-full bg-blue-500 w-[48%]"></div>
              </div>
              <span className="text-xs font-bold text-text-primary w-12 text-right">48%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary w-32">4. Propuesta</span>
              <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden mx-4">
                <div className="h-full bg-accent-cyan w-[34%]"></div>
              </div>
              <span className="text-xs font-bold text-text-primary w-12 text-right">34%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary w-32">5. Ganados</span>
              <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden mx-4">
                <div className="h-full bg-emerald-500 w-[18%]"></div>
              </div>
              <span className="text-xs font-bold text-emerald-500 w-12 text-right">18%</span>
            </div>
          </div>
        </div>

        {/* Breakdown de Leads */}
        <div className="bg-bg-primary p-6 rounded-md border border-border-subtle shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-text-muted" /> Estado General
          </h2>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-4 border border-border-subtle rounded-md bg-bg-secondary flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">Abiertos (Trabajando)</span>
              <span className="text-4xl font-display font-bold text-blue-500">{abiertos}</span>
            </div>
            <div className="p-4 border border-border-subtle rounded-md bg-emerald-50 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-2">Proyectos Ganados</span>
              <span className="text-4xl font-display font-bold text-emerald-600">{ganados}</span>
            </div>
            <div className="col-span-2 p-4 border border-border-subtle rounded-md bg-red-50 flex flex-col justify-center">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">Negocios Perdidos</span>
                <span className="text-xl font-display font-bold text-red-600">{perdidos}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
