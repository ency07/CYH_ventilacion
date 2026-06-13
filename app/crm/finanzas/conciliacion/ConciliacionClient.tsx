"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Search, HelpCircle, ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  gatewayTxId: string;
  invoiceNumber: string;
  amount: number;
  gatewayStatus: string;
  bankStatus: "matched" | "unmatched" | "discrepancy";
  date: Date;
}

interface ReconciliationData {
  reconciledCount: number;
  pendingCount: number;
  discrepancyCount: number;
  transactions: Transaction[];
}

export default function ConciliacionClient({ initialData }: { initialData: ReconciliationData }) {
  const [data, setData] = useState<ReconciliationData>(initialData);
  const [search, setSearch] = useState("");

  const filteredTransactions = data.transactions.filter(
    (tx) =>
      tx.gatewayTxId.toLowerCase().includes(search.toLowerCase()) ||
      tx.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleConcile = (id: string) => {
    // Reconcile transaction in memory
    const updatedTransactions = data.transactions.map((t) => {
      if (t.id === id) {
        return { ...t, bankStatus: "matched" as const };
      }
      return t;
    });

    const reconciledCount = updatedTransactions.filter((t) => t.bankStatus === "matched").length;
    const pendingCount = updatedTransactions.filter((t) => t.bankStatus === "unmatched").length;

    setData({
      ...data,
      reconciledCount,
      pendingCount,
      transactions: updatedTransactions,
    });

    alert("La transacción ha sido conciliada con el extracto bancario de forma exitosa.");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Conciliadas</span>
            <span className="text-lg font-black text-emerald-500">{data.reconciledCount} Transacciones</span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Pendiente Banco</span>
            <span className="text-lg font-black text-amber-500">{data.pendingCount} Transacciones</span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Discrepancias</span>
            <span className="text-lg font-black text-red-500">{data.discrepancyCount} Errores</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-bg-primary border border-border-subtle rounded">
        {/* Header controls */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por ID de transacción o factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 bg-bg-secondary border border-border-subtle rounded py-2 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">{filteredTransactions.length} Transacciones en lista</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-subtle font-mono">
                <th className="py-2.5 px-4 font-semibold">Pasarela ID (TX)</th>
                <th className="py-2.5 px-4 font-semibold">Factura Asignada</th>
                <th className="py-2.5 px-4 font-semibold text-right">Monto</th>
                <th className="py-2.5 px-4 font-semibold text-center">Estado Pasarela</th>
                <th className="py-2.5 px-4 font-semibold">Fecha</th>
                <th className="py-2.5 px-4 font-semibold text-center">Estado Banco</th>
                <th className="py-2.5 px-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-text-primary">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-bg-secondary/35 transition-colors font-mono">
                  <td className="py-3 px-4 font-bold select-all text-text-primary">{tx.gatewayTxId}</td>
                  <td className="py-3 px-4 font-bold text-accent-cyan">{tx.invoiceNumber}</td>
                  <td className="py-3 px-4 text-right font-bold">COP ${tx.amount.toLocaleString("es-CO")}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 font-bold text-[9px] uppercase border border-emerald-500/20">
                      {tx.gatewayStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {new Date(tx.date).toLocaleDateString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase border ${
                        tx.bankStatus === "matched"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      }`}
                    >
                      {tx.bankStatus === "matched" ? "Conciliado" : "Pendiente Match"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {tx.bankStatus === "unmatched" ? (
                      <button
                        onClick={() => handleConcile(tx.id)}
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-accent-cyan hover:bg-accent-cyan/85 rounded-sm flex items-center gap-1 mx-auto transition-colors"
                      >
                        Conciliar <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-text-secondary text-[10px] font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-secondary font-sans">
                    No hay transacciones registradas para conciliar.
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
