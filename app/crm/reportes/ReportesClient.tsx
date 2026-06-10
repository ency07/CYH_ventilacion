"use client";

import React from "react";
import { Calendar, Download, FileSpreadsheet, Clock, CircleDollarSign, Target, MoreVertical, ChevronRight, Lock } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function ReportesClient({ initialData, currentUser }: { initialData: any; currentUser: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPeriod = searchParams.get("periodo") || "90dias";

  const handlePeriodChange = (periodId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", periodId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isTechnicalUser = currentUser?.role === "tecnico" || currentUser?.role === "ingeniero";

  if (isTechnicalUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-8 bg-bg-secondary text-center font-sans">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 border border-red-200">
          <Lock className="w-8 h-8 text-red-700" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Acceso Restringido</h2>
        <p className="text-text-secondary max-w-md">
          El módulo de reportes financieros y de volumen sectorial está restringido para perfiles técnicos. Por favor, consulte con el Director de Operaciones o el Administrador.
        </p>
      </div>
    );
  }

  const metrics = initialData || {};

  const conversionRate = metrics.conversionRate !== undefined ? `${metrics.conversionRate}%` : "0.0%";
  const averageCloseDays = metrics.averageCloseDays !== undefined ? `${metrics.averageCloseDays}` : "0";
  
  // Format sales volume to flat $X COP
  const salesVolumeStr = metrics.salesVolume !== undefined && metrics.salesVolume !== null
    ? `$${Number(metrics.salesVolume).toLocaleString('es-CO')} COP`
    : "$0 COP";
  
  const winRate = metrics.winRate !== undefined ? `${metrics.winRate}%` : "0.0%";

  const tendenciaData = metrics.tendenciaData || [];

  const desgloseData = metrics.desgloseData || [
    { sector: "Fabricación Especial", value: 0, max: 100, color: "#0b1c30" },
    { sector: "Venta Directa", value: 0, max: 100, color: "#d3e4fe" },
    { sector: "Mantenimiento Preventivo", value: 0, max: 100, color: "#8a9eb8" },
    { sector: "Reparación / Overhaul", value: 0, max: 100, color: "#4f6580" },
  ];

  const ingenieroData = metrics.ingenieroData || [];

  return (
    <div className="flex flex-col md:h-[calc(100vh-4rem)] h-auto min-h-screen bg-bg-secondary font-sans p-8 md:overflow-y-auto overflow-visible">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Reportes y Analítica</h1>
          <p className="text-sm text-text-secondary mt-1">Rendimiento de embudo industrial y métricas de ingeniería (Real-Time)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-bg-primary rounded-md p-1 border border-border-subtle shadow-xs">
            {[
              { id: "30dias", label: "30D" },
              { id: "90dias", label: "90D" },
              { id: "180dias", label: "180D" },
              { id: "365dias", label: "365D" },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => handlePeriodChange(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  currentPeriod === tab.id 
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary border border-transparent rounded-md text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        
        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
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

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
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

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider leading-tight">VOLUMEN VENTAS<br/>REAL</h3>
            <div className="p-1.5 bg-bg-tertiary rounded">
              <CircleDollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold text-text-primary truncate block max-w-full" title={salesVolumeStr}>
                {salesVolumeStr}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">Monto total de oportunidades</p>
          </div>
        </div>

        <div className="bg-bg-primary p-5 rounded border border-border-subtle shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 shrink-0">
        
        {/* Gráfico de Barras - Tendencia de Volumen por Sector */}
        <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm lg:col-span-2 flex flex-col h-96">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Tendencia de Volumen por Sector</h2>
              <p className="text-xs text-text-secondary mt-1">Valor mensual real en etapa de licitación comercial frente a contratos ganados</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-text-secondary">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8a9eb8]"></div> Licitación</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0b1c30]"></div> Ganados</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full">
            {tendenciaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm border border-dashed border-border-subtle rounded">
                No hay datos de facturación disponibles en este período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendenciaData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={(val) => val === 0 ? '$0 COP' : `$${(val / 1000000).toLocaleString('es-CO')}M`} 
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString('es-CO')} COP`,
                      name === "abiertas" ? "Licitación" : "Ganados"
                    ]}
                    contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="abiertas" name="Licitación" fill="#8a9eb8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ganadas" name="Ganados" fill="#0b1c30" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Barras de Progreso (Desglose) */}
        <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-primary">Desglose Sectorial</h2>
            <MoreVertical className="w-4 h-4 text-text-muted" />
          </div>
          
          <div className="flex-1 flex flex-col gap-5 justify-center">
            {desgloseData.map((item: any, idx: number) => {
              const displayVal = item.value !== null && item.value !== undefined && item.value !== "" ? Number(item.value) : 0;
              const displayValStr = displayVal > 0 ? `$${displayVal.toLocaleString('es-CO')} COP` : "$0 COP";
              
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-text-primary">{item.sector}</span>
                    <span className="text-[10px] font-bold text-text-secondary truncate max-w-[120px]" title={displayValStr}>
                      {displayValStr}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(displayVal / (item.max || 1)) * 100}%`, backgroundColor: item.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="bg-bg-primary p-6 rounded border border-border-subtle shadow-sm flex flex-col lg:flex-row gap-8 shrink-0">
        <div className="lg:w-1/2 flex flex-col h-72">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Rendimiento por Ingeniero Principal</h2>
              <p className="text-xs text-text-secondary mt-1">Propuestas cerradas ganadas vs Diagnósticos emitidos</p>
            </div>
          </div>
          <div className="flex-1 min-h-[160px] w-full mt-2">
            {ingenieroData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm border border-dashed border-border-subtle rounded">
                No hay datos de ingenieros disponibles.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingenieroData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="iniciales" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, "Tasa de Conversión"]} contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="chartVal" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {ingenieroData.map((entry: any, index: number) => {
                      const colors = ["#0b1c30", "#8a9eb8", "#4f6580"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col h-72 overflow-y-auto">
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
                {ingenieroData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-text-muted">
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
