"use client";

import React from "react";
import { Calendar, Download, FileSpreadsheet, Clock, CircleDollarSign, Target, MoreVertical, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function ReportesClient({ initialData }: { initialData: any }) {
  const metrics = initialData || {};

  const conversionRate = metrics.conversionRate !== undefined ? `${metrics.conversionRate}%` : "68.4%";
  const averageCloseDays = metrics.averageCloseDays !== undefined ? `${metrics.averageCloseDays}` : "42";
  
  // Format sales volume
  let salesVolumeStr = "$4.2M";
  if (metrics.salesVolume !== undefined) {
    if (metrics.salesVolume >= 1000000) {
      salesVolumeStr = `$${(metrics.salesVolume / 1000000).toFixed(1)}M`;
    } else {
      salesVolumeStr = `$${(metrics.salesVolume / 1000).toFixed(0)}k`;
    }
  }
  
  const winRate = metrics.winRate !== undefined ? `${metrics.winRate}%` : "34.1%";

  const tendenciaData = metrics.tendenciaData || [
    { name: 'Abr', manufactura: 0.8, energia: 0.5 },
    { name: 'May', manufactura: 1.0, energia: 0.7 },
    { name: 'Jun', manufactura: 1.2, energia: 0.9 },
    { name: 'Jul', manufactura: 1.5, energia: 1.1 },
    { name: 'Ago', manufactura: 1.7, energia: 1.3 },
    { name: 'Sep', manufactura: 2.1, energia: 1.5 },
  ];

  const desgloseData = metrics.desgloseData || [
    { sector: "Manufactura Pesada", value: 1.8, max: 2.0, color: "#0b1c30" },
    { sector: "Energía y Petróleo", value: 1.2, max: 2.0, color: "#d3e4fe" },
    { sector: "Logística e Infra.", value: 0.85, max: 2.0, color: "#8a9eb8" },
    { sector: "Química y Farma", value: 0.35, max: 2.0, color: "#4f6580" },
  ];

  const ingenieroData = metrics.ingenieroData || [
    { name: "Javier Paz (Lead)", iniciales: "JP", diag: 42, cerrados: 39, tasa: "92.8%", chartVal: 80 },
    { name: "Ana Gómez", iniciales: "AG", diag: 35, cerrados: 28, tasa: "80.0%", chartVal: 60 },
    { name: "Carlos R.", iniciales: "CR", diag: 28, cerrados: 19, tasa: "67.8%", chartVal: 40 },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-secondary overflow-y-auto font-sans p-8">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Reportes y Analítica</h1>
          <p className="text-sm text-text-secondary mt-1">Rendimiento de embudo industrial y métricas de ingeniería (Real-Time)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors shadow-sm">
            <Calendar className="w-4 h-4" /> Últimos 90 Días
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary border border-transparent rounded-md text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider leading-tight w-2/3">CONV. DIAG. →<br/>PROPUESTA</h3>
            <div className="p-1.5 bg-bg-tertiary rounded">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-text-primary">{conversionRate}</span>
              <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">↗ Activo</span>
            </div>
            <p className="text-[11px] text-text-muted">Calculado sobre diagnósticos totales</p>
          </div>
        </div>

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider leading-tight">TIEMPO PROM.<br/>CIERRE</h3>
            <div className="p-1.5 bg-bg-tertiary rounded">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-text-primary">{averageCloseDays} <span className="text-lg font-medium text-text-muted">días</span></span>
              <span className="text-[10px] font-bold text-info bg-info/20 px-1.5 py-0.5 rounded">Promedio</span>
            </div>
            <p className="text-[11px] text-text-muted">Eficiencia operativa real</p>
          </div>
        </div>

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider leading-tight">VOLUMEN VENTAS<br/>REAL</h3>
            <div className="p-1.5 bg-bg-tertiary rounded">
              <CircleDollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-text-primary">{salesVolumeStr} <span className="text-lg font-medium text-text-muted">COP</span></span>
            </div>
            <p className="text-[11px] text-text-muted">Monto total de oportunidades</p>
          </div>
        </div>

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider leading-tight">WIN RATE GLOBAL<br/>&nbsp;</h3>
            <div className="p-1.5 bg-bg-tertiary rounded">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-text-primary">{winRate}</span>
              <span className="text-[10px] font-bold text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded">Tasa</span>
            </div>
            <p className="text-[11px] text-text-muted">Establecido según leads cerrados</p>
          </div>
        </div>

      </div>

      {/* MIDDLE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Gráfico Lineal */}
        <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Tendencia de Volumen por Sector</h2>
              <p className="text-xs text-text-secondary mt-1">Proyección mensual de cierres adjudicados</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-text-secondary">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-text-primary"></div> Manufactura</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-info/40"></div> Energía</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => val === 0 ? '0' : `$${val}M`} />
                <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="manufactura" stroke="#0b1c30" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: '#0b1c30' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="energia" stroke="#d3e4fe" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: '#d3e4fe' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras de Progreso (Desglose) */}
        <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-primary">Desglose Sectorial</h2>
            <MoreVertical className="w-4 h-4 text-text-muted" />
          </div>
          
          <div className="flex-1 flex flex-col gap-5 justify-center">
            {desgloseData.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{item.sector}</span>
                  </div>
                  <span className="text-[11px] font-bold text-text-secondary">${item.value >= 1 ? `${item.value}M` : `${item.value * 1000}k`}</span>
                </div>
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Rendimiento por Ingeniero Principal</h2>
              <p className="text-xs text-text-secondary mt-1">Evaluación de eficiencia: Propuestas cerradas vs Diagnósticos emitidos</p>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-around pb-4 h-32 relative">
             <div className="absolute bottom-4 left-0 right-0 border-b border-border-subtle"></div>
             {/* Barras simuladas como en la imagen */}
             <div className="w-8 h-20 bg-info/40 z-10 relative"></div>
             <div className="w-8 h-14 bg-text-secondary z-10 relative"></div>
             <div className="w-8 h-8 bg-border-medium z-10 relative"></div>
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col">
          <div className="flex justify-end mb-4">
             <button className="text-[11px] font-bold text-text-primary flex items-center gap-1 hover:underline">
               Ver Reporte Detallado <ChevronRight className="w-3 h-3" />
             </button>
          </div>
          
          <div className="flex-1 w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Ingeniero</th>
                  <th className="pb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Diagnósticos</th>
                  <th className="pb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Cerrados</th>
                  <th className="pb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Tasa Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ingenieroData.map((ing: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-bg-tertiary text-text-primary border-border-subtle flex items-center justify-center text-[10px] font-bold border">
                          {ing.iniciales}
                        </div>
                        <span className="text-xs font-bold text-text-primary">{ing.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-xs text-text-secondary">{ing.diag}</td>
                    <td className="py-3 text-right text-xs text-text-secondary">{ing.cerrados}</td>
                    <td className="py-3 text-right text-xs font-bold text-text-primary">{ing.tasa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
