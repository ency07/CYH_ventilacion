"use client";

import React, { useState } from "react";
import { DollarSign, Landmark, Search, ShieldCheck } from "lucide-react";

interface RecaudoItem {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  createdAt: Date;
  invoiceNumber: string;
  customerName: string;
}

export default function RecaudosClient({ initialData }: { initialData: RecaudoItem[] }) {
  const [search, setSearch] = useState("");

  const filteredData = initialData.filter(
    (item) =>
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (item.transactionId && item.transactionId.toLowerCase().includes(search.toLowerCase()))
  );

  // KPIs
  const totalAmount = initialData.reduce((acc, curr) => acc + curr.amount, 0);
  const transactionCount = initialData.length;
  const pseCount = initialData.filter((item) => item.paymentMethod.toUpperCase() === "PSE").length;
  const otherCount = transactionCount - pseCount;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Total Recaudado</span>
            <span className="text-lg font-black text-text-primary">
              COP ${totalAmount.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-accent-cyan/15 text-accent-cyan rounded-full">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Transacciones</span>
            <span className="text-lg font-black text-text-primary">{transactionCount} Aprobadas</span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Pagos PSE</span>
            <span className="text-lg font-black text-text-primary">{pseCount} Operaciones</span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-slate-500/10 text-text-secondary rounded-full">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Otros Métodos</span>
            <span className="text-lg font-black text-text-primary">{otherCount} Registros</span>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-bg-primary border border-border-subtle rounded">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por cliente, factura o ID de transacción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 bg-bg-secondary border border-border-subtle rounded py-2 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">{filteredData.length} Recaudos filtrados</span>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-subtle font-mono">
                <th className="py-2.5 px-4 font-semibold">Cliente</th>
                <th className="py-2.5 px-4 font-semibold">Factura</th>
                <th className="py-2.5 px-4 font-semibold text-right">Valor Recaudado</th>
                <th className="py-2.5 px-4 font-semibold text-center">Medio de Pago</th>
                <th className="py-2.5 px-4 font-semibold">Código Transacción</th>
                <th className="py-2.5 px-4 font-semibold">Fecha Recaudo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-text-primary">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/35 transition-colors">
                  <td className="py-3 px-4 font-bold text-text-primary">{item.customerName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-accent-cyan">{item.invoiceNumber}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-500">
                    COP ${item.amount.toLocaleString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-sm font-mono font-bold text-[10px] bg-blue-500/10 text-blue-500 uppercase">
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-text-secondary select-all">
                    {item.transactionId || "N/A"}
                  </td>
                  <td className="py-3 px-4 font-mono text-text-secondary">
                    {new Date(item.createdAt).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">
                    No se han registrado transacciones de recaudo para este criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
