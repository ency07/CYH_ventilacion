"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { exportFinancialsAction } from "@/lib/server-actions/crm-financials";

export default function ExportacionesClient() {
  const [reportType, setReportType] = useState("cxc");
  const [dateRange, setDateRange] = useState("30");
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fileUrl: string; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await exportFinancialsAction(format, { reportType, dateRange });
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Fallo al generar la exportación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-bg-primary border border-border-subtle p-6 rounded shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2 border-b border-border-subtle pb-3">
          <Download className="w-4 h-4 text-accent-cyan" />
          Exportar Datos Financieros
        </h2>

        <form onSubmit={handleExport} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-bg-secondary border border-border-subtle rounded p-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="cxc">Cuentas por Cobrar (CxC)</option>
              <option value="recaudos">Historial de Recaudos</option>
              <option value="ledger">Libro Diario Ledger</option>
              <option value="conciliacion">Conciliación Bancaria</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Rango de Datos</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-bg-secondary border border-border-subtle rounded p-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Este año contable</option>
              <option value="all">Todo el histórico</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Formato de Archivo</label>
            <div className="grid grid-cols-3 gap-3">
              {(["csv", "excel", "pdf"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-3 border rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    format === fmt
                      ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan"
                      : "border-border-subtle bg-bg-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent-cyan hover:bg-accent-cyan/90 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generando Archivo...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" /> Generar Descarga
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded flex flex-col items-center gap-3 text-center">
            <div className="text-xs font-bold uppercase tracking-wide">
              ¡Reporte Generado con éxito!
            </div>
            <div className="text-xs font-mono text-text-secondary truncate max-w-full">
              {result.fileName}
            </div>
            <a
              href={`data:text/csv;charset=utf-8,Fecha,Concepto,Referencia,Monto%0A2026-06-12,Venta%20de%20Extractores,INV-2026-001,45000000`}
              download={result.fileName}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Descargar Reporte
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
