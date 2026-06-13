"use client";

import React, { useState } from "react";
import { BookOpen, Search, TrendingUp, DollarSign } from "lucide-react";

interface LedgerEntry {
  id: string;
  date: Date;
  description: string;
  type: "debit" | "credit";
  amount: number;
  reference: string;
}

export default function LedgerClient({ initialData }: { initialData: LedgerEntry[] }) {
  const [search, setSearch] = useState("");

  const filteredData = initialData.filter(
    (item) =>
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.reference.toLowerCase().includes(search.toLowerCase())
  );

  // Compute stats
  const totalDebits = initialData.filter((i) => i.type === "debit").reduce((acc, curr) => acc + curr.amount, 0);
  const totalCredits = initialData.filter((i) => i.type === "credit").reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalDebits - totalCredits;
  const cashRatio = totalDebits > 0 ? Math.round((totalCredits / totalDebits) * 100) : 0;

  // Calculate running balances (from bottom to top, i.e. oldest to newest)
  const sortedOldestFirst = [...filteredData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let tempBalance = 0;
  const runningBalances = sortedOldestFirst.map((item) => {
    if (item.type === "debit") {
      tempBalance += item.amount;
    } else {
      tempBalance -= item.amount;
    }
    return { id: item.id, balance: tempBalance };
  });

  const getRunningBalance = (id: string) => {
    return runningBalances.find((rb) => rb.id === id)?.balance || 0;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Total Facturado</span>
            <span className="text-lg font-black text-text-primary">
              COP ${totalDebits.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Total Recaudado</span>
            <span className="text-lg font-black text-emerald-500">
              COP ${totalCredits.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Saldo Cartera (Neto)</span>
            <span className="text-lg font-black text-red-500">
              COP ${netBalance.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-accent-cyan/15 text-accent-cyan rounded-full">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Efectividad Recaudo</span>
            <span className="text-lg font-black text-text-primary">{cashRatio}%</span>
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
              placeholder="Buscar por concepto o referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 bg-bg-secondary border border-border-subtle rounded py-2 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">{filteredData.length} Asientos contables</span>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-subtle font-mono">
                <th className="py-2.5 px-4 font-semibold">Fecha</th>
                <th className="py-2.5 px-4 font-semibold">Concepto / Descripción</th>
                <th className="py-2.5 px-4 font-semibold">Referencia</th>
                <th className="py-2.5 px-4 font-semibold text-right">Débito (+)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Crédito (-)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Balance Cartera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-text-primary">
              {filteredData.map((item) => {
                const runningBal = getRunningBalance(item.id);
                return (
                  <tr key={item.id} className="hover:bg-bg-secondary/35 transition-colors font-mono">
                    <td className="py-3 px-4 text-text-secondary">
                      {new Date(item.date).toLocaleDateString("es-CO")}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-text-primary">{item.description}</td>
                    <td className="py-3 px-4 text-accent-cyan font-bold">{item.reference}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-500">
                      {item.type === "debit" ? `+$${item.amount.toLocaleString("es-CO")}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-500">
                      {item.type === "credit" ? `-$${item.amount.toLocaleString("es-CO")}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-text-primary">
                      COP ${runningBal.toLocaleString("es-CO")}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary font-sans">
                    No se encontraron registros en el Libro Mayor.
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
