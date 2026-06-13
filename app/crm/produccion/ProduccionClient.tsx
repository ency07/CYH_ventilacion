"use client";

import React, { useState } from "react";
import { Factory, ShieldCheck, ArrowRight, Loader2, Info, AlertTriangle } from "lucide-react";
import { advanceProductionStatusAction, STATUS_LABELS } from "@/lib/server-actions/crm-production";

interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  details: string | null;
  createdAt: Date;
  customerName: string;
  customerNit: string | null;
  invoiceNumber: string | null;
  invoiceAmount: number | null;
}

const FLOW_COLUMNS = [
  { key: "pago_confirmado", label: "Pago Confirmado", color: "bg-emerald-500" },
  { key: "listo_produccion", label: "Listo para Producción", color: "bg-blue-500" },
  { key: "generar_of", label: "Generar OF", color: "bg-amber-500" },
  { key: "produccion", label: "En Producción", color: "bg-indigo-500" },
  { key: "despacho", label: "Despacho", color: "bg-slate-500" },
];

export default function ProduccionClient({ initialOrders }: { initialOrders: ProductionOrder[] }) {
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdvance = async (orderId: string, currentStatus: string) => {
    setLoadingId(orderId);
    setError(null);

    try {
      const res = await advanceProductionStatusAction(orderId, currentStatus);
      if (res.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              return { ...o, status: res.data.nextStatus };
            }
            return o;
          })
        );
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Fallo inesperado al avanzar el estado.");
    } finally {
      setLoadingId(null);
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case "pago_confirmado":
        return "Liberar a Producción";
      case "listo_produccion":
        return "Generar OF";
      case "generar_of":
        return "Iniciar Manufactura";
      case "produccion":
        return "Aprobar Despacho";
      default:
        return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-bg-primary border-b border-border-subtle px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary tracking-tight font-display flex items-center gap-2">
          <Factory className="w-5 h-5 text-accent-cyan" />
          Control de Órdenes de Fabricación (OF)
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Seguimiento y aprobación manual del ciclo de vida industrial de pedidos de ventilación mecánica.
        </p>
      </div>

      {/* Main Board */}
      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs flex items-center gap-2 max-w-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Kanban Board Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {FLOW_COLUMNS.map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="bg-bg-primary border border-border-subtle rounded flex flex-col h-[600px]">
                {/* Column Title */}
                <div className="p-3 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/25">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnOrders.map((order) => {
                    const nextAction = getActionLabel(order.status);
                    const isLoading = loadingId === order.id;

                    return (
                      <div
                        key={order.id}
                        className="bg-bg-secondary/45 border border-border-subtle rounded p-3 space-y-2 hover:border-accent-cyan/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-black text-accent-cyan">{order.orderNumber}</span>
                          <span className="text-[9px] text-text-secondary font-mono">
                            {new Date(order.createdAt).toLocaleDateString("es-CO")}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-text-primary truncate" title={order.customerName}>
                            {order.customerName}
                          </div>
                          <div className="text-[10px] text-text-secondary font-mono">NIT: {order.customerNit || "N/A"}</div>
                        </div>

                        {order.invoiceNumber && (
                          <div className="text-[10px] bg-bg-primary border border-border-subtle p-1.5 rounded space-y-0.5 font-mono">
                            <div className="text-text-secondary flex justify-between">
                              <span>Factura:</span>
                              <span className="font-bold text-text-primary">{order.invoiceNumber}</span>
                            </div>
                            {order.invoiceAmount && (
                              <div className="text-text-secondary flex justify-between">
                                <span>Monto:</span>
                                <span className="font-bold text-text-primary">
                                  ${order.invoiceAmount.toLocaleString("es-CO")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {order.details && (
                          <p className="text-[10px] text-text-secondary leading-tight italic bg-bg-primary/30 p-1.5 rounded">
                            {order.details}
                          </p>
                        )}

                        {/* Workflow Action Button */}
                        {nextAction && (
                          <button
                            onClick={() => handleAdvance(order.id, order.status)}
                            disabled={isLoading}
                            className="w-full mt-2 py-1.5 bg-bg-primary hover:bg-accent-cyan hover:text-white border border-border-subtle hover:border-accent-cyan text-text-primary text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {nextAction} <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}

                        {order.status === "despacho" && (
                          <div className="mt-2 py-1 text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-wider rounded flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Despachado
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {columnOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-secondary border border-dashed border-border-subtle/50 rounded">
                      <Info className="w-5 h-5 opacity-40 mb-1" />
                      <span className="text-[10px] tracking-wide uppercase">Vacío</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
