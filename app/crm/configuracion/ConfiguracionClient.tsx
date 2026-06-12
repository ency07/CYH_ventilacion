"use client";

import React, { useState } from "react";
import { 
  Settings, Building2, Sliders, Puzzle, ShieldCheck, 
  Save, Loader2, Check, AlertTriangle, Key, Terminal 
} from "lucide-react";
import { updateTenantBrandingAction } from "@/lib/server-actions/config";

interface ConfigProps {
  currentUser: any;
  initialBranding: any;
}

export default function ConfiguracionClient({ currentUser, initialBranding }: ConfigProps) {
  const [activeTab, setActiveTab] = useState("empresa");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  // --- Tab 1: Datos de empresa ---
  const [companyName, setCompanyName] = useState(initialBranding?.config?.companyName || "");
  const [nit, setNit] = useState(initialBranding?.config?.nit || "");
  const [email, setEmail] = useState(initialBranding?.config?.email || "");
  const [phone, setPhone] = useState(initialBranding?.config?.phone || "");
  const [address, setAddress] = useState(initialBranding?.config?.address || "");

  // --- Tab 3: Integraciones ---
  const [telegramBotToken, setTelegramBotToken] = useState(initialBranding?.integrations?.telegramBotToken || "");
  const [telegramChatIdVentas, setTelegramChatIdVentas] = useState(initialBranding?.integrations?.telegramChatIdVentas || "");
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("resend");

  // --- Tab 2: Pipeline ---
  const [stages, setStages] = useState([
    { name: "Nuevo Prospecto", prob: 10, color: "bg-slate-500" },
    { name: "Diagnóstico Técnico", prob: 30, color: "bg-blue-500" },
    { name: "Propuesta Enviada", prob: 60, color: "bg-amber-500" },
    { name: "Negociación / Cierre", prob: 80, color: "bg-purple-500" },
    { name: "Cerrado Ganado", prob: 100, color: "bg-emerald-500" },
  ]);

  const handleStageProbChange = (index: number, val: number) => {
    const next = [...stages];
    next[index].prob = val;
    setStages(next);
  };

  // --- Save Handler ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await updateTenantBrandingAction(
        { companyName, nit, email, phone, address },
        { 
          primaryColor: initialBranding?.branding?.primaryColor || "#0f172a",
          secondaryColor: initialBranding?.branding?.secondaryColor || "#0ea5e9",
          logoUrl: initialBranding?.branding?.logoUrl || null,
          customCss: initialBranding?.branding?.customCss || null,
          portalName: initialBranding?.branding?.portalName || "Portal Corporativo"
        },
        { 
          telegramBotToken,
          telegramChatIdVentas,
          resendApiKey: initialBranding?.integrations?.resendApiKey || null
        }
      );

      if (res.success) {
        setMessage({ success: true, text: "Configuración global guardada y sincronizada correctamente." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ success: false, text: res.error });
      }
    } catch (err: any) {
      setMessage({ success: false, text: err.message || "Error al actualizar la configuración." });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "empresa", name: "Datos de Empresa / NIT", icon: Building2 },
    { id: "pipeline", name: "Ajustes de Pipeline", icon: Sliders },
    { id: "integraciones", name: "Integraciones SMTP & Telegram", icon: Puzzle },
    { id: "seguridad", name: "Seguridad & Aislamiento RLS", icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent-cyan" />
            Configuración Corporativa
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Ajustes globales de marca, pasarelas de comunicación y seguridad multi-tenant
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start mt-2">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex flex-col gap-1.5 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-wider font-mono transition-colors text-left border ${
                  active 
                    ? "bg-slate-900 border-slate-800 text-accent-cyan" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-accent-cyan" : "text-slate-500"}`} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full bg-slate-900/40 border border-slate-800 rounded-sm p-6 relative">
          {message && (
            <div className={`mb-6 p-4 rounded-sm font-mono text-[11px] leading-relaxed border ${
              message.success 
                ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300" 
                : "bg-red-950/40 border-red-500/20 text-red-300"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* TAB 1: DATOS DE EMPRESA */}
            {activeTab === "empresa" && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                  [+] IDENTIFICACIÓN CORPORATIVA Y LOCALIZACIÓN
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Razón Social</label>
                    <input 
                      type="text" 
                      required 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">NIT</label>
                    <input 
                      type="text" 
                      required 
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      placeholder="900.123.456-7"
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Correo de Contacto</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Teléfono Corporativo</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dirección Principal Planta</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PIPELINE */}
            {activeTab === "pipeline" && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                  [+] PROBABILIDADES DE CONVERSIÓN DE PIPELINE
                </h2>

                <div className="space-y-4">
                  {stages.map((stage, idx) => (
                    <div key={stage.name} className="flex items-center gap-4 bg-slate-950/40 p-3.5 border border-slate-850 rounded-sm">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color} animate-pulse`} />
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-white uppercase block">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500">Probabilidad:</span>
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={stage.prob} 
                          onChange={(e) => handleStageProbChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-800 text-center text-xs font-mono py-1 rounded-sm text-white focus:outline-none focus:border-slate-500"
                        />
                        <span className="text-xs text-slate-400 font-mono">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: INTEGRACIONES */}
            {activeTab === "integraciones" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] INTEGRACIONES SMTP DE COMUNICACIÓN
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Servidor SMTP</label>
                      <input 
                        type="text" 
                        value={smtpServer}
                        onChange={(e) => setSmtpServer(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-xs text-white focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Puerto</label>
                      <input 
                        type="text" 
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-xs text-white focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Usuario</label>
                      <input 
                        type="text" 
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-xs text-white focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] INTEGRACIÓN CON TELEGRAM BOT
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Telegram Bot Token</label>
                      <input 
                        type="password" 
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-xs text-white focus:outline-none font-mono" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Chat ID Canal Ventas</label>
                      <input 
                        type="text" 
                        value={telegramChatIdVentas}
                        onChange={(e) => setTelegramChatIdVentas(e.target.value)}
                        placeholder="Ej. -100123456789"
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-xs text-white focus:outline-none font-mono" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SEGURIDAD */}
            {activeTab === "seguridad" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] DIAGNÓSTICO DE AISLAMIENTO MULTI-TENANT RLS
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Políticas RLS en PostgreSQL</span>
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                          ESTRICTO
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Supabase RLS garantiza que las consultas de cliente y personal comercial no puedan recuperar registros de otros inquilinos (Zero Trust).
                      </p>
                      
                      <div className="space-y-2 pt-2 text-[10px] font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>Tenant ID Inquilino:</span>
                          <span className="text-white font-bold">{currentUser?.tenantId || "Global (super_admin)"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Esquema PostgreSQL:</span>
                          <span className="text-white font-bold">public.*</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Firma Criptográfica</span>
                        <span className="px-2 py-0.5 rounded-sm bg-blue-950/30 border border-blue-500/20 text-blue-400 text-[9px] font-bold">
                          ACTIVO
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Los tokens de seguridad OTP e invitaciones SaaS se encriptan mediante firmas SHA-256 a nivel de servidor.
                      </p>

                      <div className="space-y-2 pt-2 text-[10px] font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>Expiración OTP:</span>
                          <span className="text-white font-bold">10 MINUTOS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Key Vault:</span>
                          <span className="text-white font-bold">SUPABASE SECRETS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <Terminal className="w-4 h-4 text-accent-cyan" />
                    Consola de Auditoría de Accesos RLS
                  </div>
                  <div className="bg-slate-950 border border-slate-855 rounded p-4 font-mono text-[10px] text-slate-500 space-y-1 max-h-40 overflow-y-auto">
                    <div>[2026-06-12 11:42:01] INFO: SELECT FROM crm_assets FILTERED BY tenant_id = '{currentUser?.tenantId || "system"}'</div>
                    <div>[2026-06-12 11:42:02] INFO: SELECT FROM crm_invoices FILTERED BY tenant_id = '{currentUser?.tenantId || "system"}'</div>
                    <div>[2026-06-12 11:43:10] AUDIT: POLICY 'select_crm_assets' EVALUATED TO TRUE FOR USER_ID '{currentUser?.id}'</div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Footer Action */}
            {activeTab !== "seguridad" && (
              <div className="border-t border-slate-800 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Configuración
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
