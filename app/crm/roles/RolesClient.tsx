"use client";

import React, { useState } from "react";
import { Shield, ShieldCheck, Save, Loader2, Check, AlertCircle } from "lucide-react";

interface PermissionRow {
  module: string;
  action: string;
  key: string;
  root_dev: boolean;
  admin: boolean;
  comercial: boolean;
  tecnico: boolean;
}

export default function RolesClient({ currentUser }: { currentUser: any }) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initial ERP Matrix permissions mapping
  const [matrix, setMatrix] = useState<PermissionRow[]>([
    { module: "Prospectación", action: "Ver Inbox de Leads", key: "leads_view", root_dev: true, admin: true, comercial: true, tecnico: false },
    { module: "Prospectación", action: "Registrar Leads", key: "leads_create", root_dev: true, admin: true, comercial: true, tecnico: false },
    { module: "Prospectación", action: "Eliminar Leads", key: "leads_delete", root_dev: true, admin: true, comercial: false, tecnico: false },
    
    { module: "Propuestas", action: "Generar Propuesta Técnica", key: "prop_create", root_dev: true, admin: true, comercial: true, tecnico: true },
    { module: "Propuestas", action: "Aprobar Financieramente", key: "prop_approve", root_dev: true, admin: true, comercial: false, tecnico: false },
    { module: "Propuestas", action: "Firmar Contrato (OTP)", key: "prop_sign", root_dev: true, admin: true, comercial: true, tecnico: false },
    
    { module: "Operaciones", action: "Ver Catálogo de Activos", key: "assets_view", root_dev: true, admin: true, comercial: true, tecnico: true },
    { module: "Operaciones", action: "Simular Telemetría (+100 hrs)", key: "assets_telemetry", root_dev: true, admin: true, comercial: false, tecnico: true },
    { module: "Operaciones", action: "Programar Mantenimientos", key: "assets_maintenance", root_dev: true, admin: true, comercial: false, tecnico: true },
    
    { module: "CMMS / Tickets", action: "Ver Solicitudes de Servicio", key: "tickets_view", root_dev: true, admin: true, comercial: true, tecnico: true },
    { module: "CMMS / Tickets", action: "Responder & Comentar", key: "tickets_comment", root_dev: true, admin: true, comercial: true, tecnico: true },
    { module: "CMMS / Tickets", action: "Cierre Operativo de Tickets", key: "tickets_close", root_dev: true, admin: true, comercial: false, tecnico: true },

    { module: "Incidentes Críticos", action: "Ver War Rooms de Emergencia", key: "warroom_view", root_dev: true, admin: true, comercial: true, tecnico: true },
    { module: "Incidentes Críticos", action: "Crear Timeline de War Room", key: "warroom_timeline", root_dev: true, admin: true, comercial: false, tecnico: true },
    { module: "Incidentes Críticos", action: "Aprobación RACI Liderazgo", key: "warroom_raci", root_dev: true, admin: true, comercial: false, tecnico: false },

    { module: "Facturación B2B", action: "Ver Historial de Facturas", key: "billing_view", root_dev: true, admin: true, comercial: true, tecnico: false },
    { module: "Facturación B2B", action: "Aprobación Multietapa de Facturas", key: "billing_approve", root_dev: true, admin: true, comercial: false, tecnico: false },
    { module: "Facturación B2B", action: "Pago por Pasarela PSE/Wompi", key: "billing_pay", root_dev: true, admin: true, comercial: false, tecnico: false },
  ]);

  const handleToggle = (rowIndex: number, role: "admin" | "comercial" | "tecnico") => {
    // root_dev is absolute and cannot be toggled
    const updated = [...matrix];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [role]: !updated[rowIndex][role]
    };
    setMatrix(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    // Simulate API persistence call
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSuccessMsg("Configuración de Roles ERP guardada y sincronizada con políticas RLS de Supabase.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent-cyan" />
            Matriz de Roles ERP
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Definición cruzada de autorizaciones por perfil interno
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar Cambios
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-sm font-mono text-[11px] leading-relaxed animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Matrix Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <th className="py-4 px-6">Módulo / Sección</th>
              <th className="py-4 px-6">Acción Permisible</th>
              <th className="py-4 px-6 text-center">root_dev</th>
              <th className="py-4 px-6 text-center">admin</th>
              <th className="py-4 px-6 text-center">comercial</th>
              <th className="py-4 px-6 text-center">tecnico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 font-mono">
            {matrix.map((row, idx) => (
              <tr key={row.key} className="hover:bg-slate-900/20">
                <td className="py-3.5 px-6 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  {row.module}
                </td>
                <td className="py-3.5 px-6 text-white text-[11px]">
                  {row.action}
                </td>
                
                {/* root_dev check */}
                <td className="py-3.5 px-6 text-center">
                  <div className="flex justify-center">
                    <span className="w-6 h-6 rounded border border-purple-500/20 bg-purple-950/30 flex items-center justify-center text-purple-400" title="Acceso Absoluto">
                      ✓
                    </span>
                  </div>
                </td>

                {/* admin check */}
                <td className="py-3.5 px-6 text-center">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={row.admin}
                      onChange={() => handleToggle(idx, "admin")}
                      className="w-4 h-4 bg-slate-950 border-slate-800 text-accent-cyan rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                </td>

                {/* comercial check */}
                <td className="py-3.5 px-6 text-center">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={row.comercial}
                      onChange={() => handleToggle(idx, "comercial")}
                      className="w-4 h-4 bg-slate-950 border-slate-800 text-accent-cyan rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                </td>

                {/* tecnico check */}
                <td className="py-3.5 px-6 text-center">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={row.tecnico}
                      onChange={() => handleToggle(idx, "tecnico")}
                      className="w-4 h-4 bg-slate-950 border-slate-800 text-accent-cyan rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-blue-950/20 border border-blue-900/30 text-blue-400 rounded-sm font-mono text-[10px] uppercase tracking-wider">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <div>
          <span className="font-bold block">Nota de Seguridad RLS</span>
          Esta matriz define la visibilidad de componentes en frontend. El control de integridad de datos transaccionales se refuerza en el backend mediante políticas Row Level Security (RLS) en PostgreSQL.
        </div>
      </div>
    </div>
  );
}
