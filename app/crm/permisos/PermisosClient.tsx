"use client";

import React, { useState } from "react";
import { Lock, Save, Loader2, Check, HelpCircle, ShieldAlert } from "lucide-react";

interface PermissionDetail {
  id: string;
  category: string;
  name: string;
  description: string;
  scope: "tenant" | "global";
  tables: string;
  active: boolean;
}

export default function PermisosClient({ currentUser }: { currentUser: any }) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // List of fine-grained permissions mapping to the database schema
  const [permissions, setPermissions] = useState<PermissionDetail[]>(
    [
      { id: "perm_1", category: "Leads / Prospectos", name: "Aislamiento Multitenant RLS", description: "Filtra leads basándose estrictamente en el tenant_id del usuario comercial actual.", scope: "tenant", tables: "leads, crm_pipeline", active: true },
      { id: "perm_2", category: "Leads / Prospectos", name: "Captura Externa Libre", description: "Permite a usuarios visitantes anónimos registrar leads mediante la API pública de contacto.", scope: "global", tables: "leads, crm_audit_logs", active: true },
      
      { id: "perm_3", category: "Propuestas", name: "Auto-Aprovisionamiento", description: "Crea automáticamente contratos, plantas y activos cuando una propuesta se marca como GANADA.", scope: "tenant", tables: "crm_proposals, crm_contracts, crm_assets", active: true },
      { id: "perm_4", category: "Propuestas", name: "Firma Electrónica OTP", description: "Requiere verificación por código OTP de 6 dígitos antes de firmar digitalmente cualquier contrato.", scope: "tenant", tables: "lead_verifications, crm_electronic_signatures", active: true },

      { id: "perm_5", category: "Activos / CMMS", name: "Telemetría Libre", description: "Permite a los usuarios finales del portal cliente simular y reportar horas de operación de activos.", scope: "tenant", tables: "crm_assets, crm_audit_logs", active: true },
      { id: "perm_6", category: "Activos / CMMS", name: "Órdenes de Trabajo Preventivas", description: "Genera órdenes de trabajo automáticamente al cruzar límites de planes de mantenimiento.", scope: "tenant", tables: "crm_work_orders, crm_maintenance_plans", active: true },

      { id: "perm_7", category: "Finanzas B2B", name: "Aprobación de Ingeniería", description: "Valida la conformidad de ingeniería mecánica previa a la liberación de cobros.", scope: "tenant", tables: "crm_invoices", active: true },
      { id: "perm_8", category: "Finanzas B2B", name: "Integración Pasarela Wompi/PSE", description: "Habilita la simulación transaccional con la pasarela de recaudo para facturas vencidas.", scope: "tenant", tables: "crm_invoices, crm_payments", active: true },

      { id: "perm_9", category: "Incidentes", name: "War Room Automático", description: "Dispara salas de control RACI instantáneas cuando se registra un ticket de urgencia crítica.", scope: "tenant", tables: "crm_emergency_war_rooms, crm_war_room_timeline", active: true },
    ]
  );

  const handleToggle = (id: string) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSuccessMsg("Políticas de autorización atómica actualizadas y compiladas con éxito.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-accent-cyan" />
            Configuración de Permisos Atómicos
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Control de interruptores de funcionalidad e integración de bases de datos
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
              <Save className="w-4 h-4" /> Compilar Permisos
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

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {permissions.map((perm) => (
          <div 
            key={perm.id} 
            className="bg-slate-900/40 border border-slate-800 rounded-sm p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-sm">
                  {perm.category}
                </span>
                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm border ${
                  perm.scope === "global" 
                    ? "bg-purple-950/20 border-purple-500/20 text-purple-400" 
                    : "bg-blue-950/20 border-blue-500/20 text-blue-400"
                }`}>
                  Scope: {perm.scope}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white font-mono">{perm.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{perm.description}</p>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Tablas Relacionales: <span className="text-slate-400 font-bold block mt-0.5">{perm.tables}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-mono font-bold ${perm.active ? "text-accent-cyan" : "text-slate-500"}`}>
                  {perm.active ? "EJECUTANDO" : "SUSPENDIDO"}
                </span>
                
                <button
                  onClick={() => handleToggle(perm.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    perm.active ? "bg-accent-cyan" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                      perm.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-red-950/20 border border-red-900/30 text-rose-400 rounded-sm font-mono text-[10px] uppercase tracking-wider">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Consola de Control Crítica</span>
          Desactivar o suspender permisos atómicos puede inhabilitar transacciones en tiempo real de clientes B2B. Realice modificaciones únicamente bajo protocolos de auditoría técnica autorizados.
        </div>
      </div>
    </div>
  );
}
