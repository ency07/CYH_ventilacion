"use client";

import React, { useState } from "react";
import { Landmark, AlertTriangle, Clock, Search, Bell } from "lucide-react";

interface CxCItem {
  id: string;
  outstandingBalance: number;
  daysPastDue: number;
  collectionStatus: string;
  customerName: string;
  customerNit: string | null;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDueDate: Date;
}

export default function CxCClient({ initialData }: { initialData: CxCItem[] }) {
  const [search, setSearch] = useState("");
  const [dataList, setDataList] = useState<CxCItem[]>(initialData);

  // Filter
  const filteredData = dataList.filter(
    (item) =>
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (item.customerNit && item.customerNit.includes(search))
  );

  // KPIs
  const totalBalance = dataList.reduce((acc, curr) => acc + curr.outstandingBalance, 0);
  const totalMora = dataList.reduce((acc, curr) => acc + (curr.daysPastDue > 0 ? curr.outstandingBalance : 0), 0);
  const clientCount = new Set(dataList.map((item) => item.customerName)).size;
  const avgMoraDays =
    dataList.length > 0
      ? Math.round(dataList.reduce((acc, curr) => acc + curr.daysPastDue, 0) / dataList.length)
      : 0;

  const handleReminder = (invoiceNumber: string, customer: string) => {
    alert(`Recordatorio de pago enviado exitosamente a ${customer} para la Factura #${invoiceNumber}.`);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-accent-cyan/15 text-accent-cyan rounded-full">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Total Cartera</span>
            <span className="text-lg font-black text-text-primary">
              COP ${totalBalance.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Cartera en Mora</span>
            <span className="text-lg font-black text-red-500">
              COP ${totalMora.toLocaleString("es-CO")}
            </span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Días Mora Promedio</span>
            <span className="text-lg font-black text-emerald-500">{avgMoraDays} Días</span>
          </div>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-4 rounded flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">Clientes Activos</span>
            <span className="text-lg font-black text-text-primary">{clientCount} Empresas</span>
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
              placeholder="Buscar por cliente, NIT, número de factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 bg-bg-secondary border border-border-subtle rounded py-2 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">{filteredData.length} Facturas encontradas</span>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-subtle font-mono">
                <th className="py-2.5 px-4 font-semibold">Cliente</th>
                <th className="py-2.5 px-4 font-semibold">Factura</th>
                <th className="py-2.5 px-4 font-semibold text-right">Monto Total</th>
                <th className="py-2.5 px-4 font-semibold text-right">Saldo Pendiente</th>
                <th className="py-2.5 px-4 font-semibold text-center">Días en Mora</th>
                <th className="py-2.5 px-4 font-semibold">Vencimiento</th>
                <th className="py-2.5 px-4 font-semibold">Estado</th>
                <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-text-primary">
              {filteredData.map((item) => {
                const isOverdue = item.daysPastDue > 0;
                return (
                  <tr key={item.id} className="hover:bg-bg-secondary/35 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">{item.customerName}</div>
                      <div className="text-[10px] text-text-secondary font-mono">NIT: {item.customerNit || "N/A"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-accent-cyan">{item.invoiceNumber}</td>
                    <td className="py-3 px-4 text-right font-semibold">COP ${item.invoiceAmount.toLocaleString("es-CO")}</td>
                    <td className="py-3 px-4 text-right font-bold text-text-primary">COP ${item.outstandingBalance.toLocaleString("es-CO")}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm font-mono font-bold text-[10px] ${
                          isOverdue
                            ? "bg-red-500/10 text-red-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {item.daysPastDue} Días
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {new Date(item.invoiceDueDate).toLocaleDateString("es-CO")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm border ${
                          item.collectionStatus === "normal"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : item.collectionStatus === "advertencia"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            : "bg-red-500/10 border-red-500/20 text-red-500"
                        }`}
                      >
                        {item.collectionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleReminder(item.invoiceNumber, item.customerName)}
                        className="p-1 text-text-secondary hover:text-accent-cyan bg-bg-secondary border border-border-subtle rounded transition-colors"
                        title="Enviar Recordatorio"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-secondary">
                    No se encontraron facturas en mora ni pendientes de cobro.
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
