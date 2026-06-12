"use client";

import React, { useState, useTransition } from "react";
import { 
  Building, 
  Palette, 
  Key, 
  Upload, 
  Loader2, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { updateTenantBrandingAction, uploadMediaAction } from "@/lib/server-actions/config";
import { crmTenantConfig, crmTenantBranding, crmTenantIntegrations, crmMediaLibrary } from "@/lib/db/schema";

interface ConfigFormProps {
  initialConfig: typeof crmTenantConfig.$inferSelect;
  initialBranding: typeof crmTenantBranding.$inferSelect;
  initialIntegrations: typeof crmTenantIntegrations.$inferSelect | null;
  mediaLibrary: (typeof crmMediaLibrary.$inferSelect)[];
}

type TabType = "empresa" | "branding" | "integraciones";

export default function ConfigForm({ 
  initialConfig, 
  initialBranding, 
  initialIntegrations,
  mediaLibrary 
}: ConfigFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("empresa");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Local states for form values
  const [config, setConfig] = useState({
    companyName: initialConfig.companyName,
    nit: initialConfig.nit,
    email: initialConfig.email,
    phone: initialConfig.phone || "",
    address: initialConfig.address || "",
  });

  const [branding, setBranding] = useState({
    logoUrl: initialBranding.logoUrl || "",
    primaryColor: initialBranding.primaryColor,
    secondaryColor: initialBranding.secondaryColor,
    customCss: initialBranding.customCss || "",
    portalName: initialBranding.portalName,
  });

  const [integrations, setIntegrations] = useState({
    telegramBotToken: initialIntegrations?.telegramBotToken || "",
    telegramChatIdVentas: initialIntegrations?.telegramChatIdVentas || "",
    telegramChatIdServicio: initialIntegrations?.telegramChatIdServicio || "",
    telegramChatIdIngenieria: initialIntegrations?.telegramChatIdIngenieria || "",
    telegramChatIdDireccion: initialIntegrations?.telegramChatIdDireccion || "",
    telegramChatIdPostventa: initialIntegrations?.telegramChatIdPostventa || "",
    resendApiKey: initialIntegrations?.resendApiKey || "",
    twilioAccountSid: initialIntegrations?.twilioAccountSid || "",
    twilioAuthToken: initialIntegrations?.twilioAuthToken || "",
    twilioWhatsappFrom: initialIntegrations?.twilioWhatsappFrom || "",
  });

  const [localMediaList, setLocalMediaList] = useState(mediaLibrary);

  // File Upload Handler calling our Server Action
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadMediaAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Error al subir el archivo.");
      }

      const fileUrl = res.data;
      setBranding(prev => ({ ...prev, logoUrl: fileUrl }));
      
      // Update local media library preview list
      const newMediaItem = {
        id: Math.random().toString(), // dummy client ID
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: null,
        createdAt: new Date(),
      };
      setLocalMediaList(prev => [newMediaItem, ...prev]);
      
      setFeedback({ type: "success", message: "Logotipo cargado y registrado correctamente en la galería." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al subir el archivo de marca." });
    } finally {
      setIsUploading(false);
    }
  }

  // Form Submission Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await updateTenantBrandingAction(
          config,
          branding,
          initialIntegrations ? integrations : undefined // Only pass if user is authorized to edit integrations
        );

        if (!res.success) {
          throw new Error(res.error || "Error al actualizar la configuración.");
        }

        setFeedback({ type: "success", message: "Configuración guardada correctamente en el sistema." });
        
        // Dynamic color styles updates for immediate visual feedback on operations dashboard
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--primary-color", branding.primaryColor);
          document.documentElement.style.setProperty("--secondary-color", branding.secondaryColor);
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Error al guardar los cambios." });
      }
    });
  }

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded shadow-lg overflow-hidden">
      
      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-900 bg-slate-900/30">
        <button
          type="button"
          onClick={() => { setActiveTab("empresa"); setFeedback(null); }}
          className={`flex-1 py-4 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 flex items-center justify-center space-x-2 transition-all ${
            activeTab === "empresa"
              ? "border-cyan-500 text-cyan-400 bg-slate-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/10"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>1. Empresa / Tenant</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("branding"); setFeedback(null); }}
          className={`flex-1 py-4 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 flex items-center justify-center space-x-2 transition-all ${
            activeTab === "branding"
              ? "border-cyan-500 text-cyan-400 bg-slate-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/10"
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>2. Branding & Marca</span>
        </button>
        <button
          type="button"
          disabled={!initialIntegrations}
          onClick={() => { setActiveTab("integraciones"); setFeedback(null); }}
          className={`flex-1 py-4 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 flex items-center justify-center space-x-2 transition-all ${
            !initialIntegrations ? "opacity-40 cursor-not-allowed" : ""
          } ${
            activeTab === "integraciones"
              ? "border-cyan-500 text-cyan-400 bg-slate-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/10"
          }`}
          title={!initialIntegrations ? "Requiere permisos de administrador" : ""}
        >
          <Key className="h-4 w-4" />
          <span>3. Integraciones Vault</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Feedback Messages */}
        {feedback && (
          <div className={`p-4 border rounded text-sm flex items-start space-x-3 ${
            feedback.type === "success" 
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/20 border-rose-500/30 text-rose-300"
          }`}>
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* Tab 1: Tenant Configuration */}
        {activeTab === "empresa" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2">
              Datos Corporativos del Tenant
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Nombre Comercial</label>
                <input 
                  type="text"
                  required
                  value={config.companyName}
                  onChange={e => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-sans"
                  placeholder="Ej. CYH Ventilación"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">NIT / Identificación Fiscal</label>
                <input 
                  type="text"
                  required
                  value={config.nit}
                  onChange={e => setConfig(prev => ({ ...prev, nit: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-mono"
                  placeholder="Ej. 900.000.000-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Email de Contacto</label>
                <input 
                  type="email"
                  required
                  value={config.email}
                  onChange={e => setConfig(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-sans"
                  placeholder="Ej. contacto@empresa.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Teléfono</label>
                <input 
                  type="text"
                  value={config.phone}
                  onChange={e => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-sans"
                  placeholder="Ej. +57 300 000 0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">Dirección Física</label>
              <textarea 
                rows={2}
                value={config.address}
                onChange={e => setConfig(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-sans resize-none"
                placeholder="Ej. Calle Industrial # 45-21, Barranquilla"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Branding Settings */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2">
              Parámetros de Personalización de Marca
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Nombre del Portal de Clientes</label>
                <input 
                  type="text"
                  required
                  value={branding.portalName}
                  onChange={e => setBranding(prev => ({ ...prev, portalName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0"
                  placeholder="Ej. Portal Clientes CYH"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">URL del Logotipo (Directa)</label>
                <input 
                  type="text"
                  value={branding.logoUrl}
                  onChange={e => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-mono"
                  placeholder="Escribe la URL del logo o usa el selector inferior"
                />
              </div>
            </div>

            {/* Logo Uploader / Media Gallery Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40 p-4 border border-slate-900 rounded">
              
              {/* Uploader Box */}
              <div className="space-y-2 md:col-span-1 border-r border-slate-900 pr-4 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase block">Subir Nuevo Logo</span>
                
                <div className="relative border border-dashed border-slate-800 rounded hover:border-slate-600 transition-all p-4 text-center cursor-pointer flex flex-col items-center justify-center">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-slate-400" />
                  )}
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Suelte o elija archivo</span>
                </div>
              </div>

              {/* Gallery List Selector */}
              <div className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center space-x-1">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Galería de Imágenes Recientes</span>
                </span>
                
                <div className="grid grid-cols-4 gap-2 max-h-[100px] overflow-y-auto pr-1">
                  {localMediaList.length === 0 ? (
                    <span className="text-[10px] text-slate-500 font-mono col-span-4 py-2">No hay archivos en la biblioteca.</span>
                  ) : (
                    localMediaList.map(media => (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: media.fileUrl }))}
                        className={`h-10 border rounded bg-slate-950/60 overflow-hidden flex items-center justify-center p-1 transition-all ${
                          branding.logoUrl === media.fileUrl 
                            ? "border-cyan-500 ring-1 ring-cyan-500/20" 
                            : "border-slate-800 hover:border-slate-600"
                        }`}
                        title={media.fileName}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={media.fileUrl} 
                          alt={media.fileName} 
                          className="h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Colors Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-950/30 p-3 border border-slate-900 rounded">
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Color de Marca Primario</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color"
                    value={branding.primaryColor}
                    onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text"
                    required
                    value={branding.primaryColor}
                    onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="#0f172a"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-slate-950/30 p-3 border border-slate-900 rounded">
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Color de Marca Secundario</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color"
                    value={branding.secondaryColor}
                    onChange={e => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text"
                    required
                    value={branding.secondaryColor}
                    onChange={e => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
            </div>

            {/* Custom CSS block injection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">Código CSS Personalizado</label>
              <textarea 
                rows={3}
                value={branding.customCss}
                onChange={e => setBranding(prev => ({ ...prev, customCss: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-xs focus:border-cyan-500 focus:ring-0 font-mono resize-none"
                placeholder="/* Agregue sus variables o estilos aquí */"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Integrations Vault */}
        {activeTab === "integraciones" && initialIntegrations && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2">
              Credenciales e Integraciones de Comunicación
            </h3>

            {/* Telegram Bot */}
            <div className="space-y-3 p-4 bg-slate-950/30 border border-slate-900 rounded">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono block">Canales Telegram Bot API</span>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Telegram Bot Token</label>
                <input 
                  type="text"
                  value={integrations.telegramBotToken}
                  onChange={e => setIntegrations(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-3 text-white text-xs font-mono focus:border-cyan-500 focus:ring-0"
                  placeholder="bot123456789:AAH-..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Chat ID Ventas</label>
                  <input 
                    type="text"
                    value={integrations.telegramChatIdVentas}
                    onChange={e => setIntegrations(prev => ({ ...prev, telegramChatIdVentas: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="-100..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Chat ID Servicio</label>
                  <input 
                    type="text"
                    value={integrations.telegramChatIdServicio}
                    onChange={e => setIntegrations(prev => ({ ...prev, telegramChatIdServicio: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="-100..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Chat ID Ingeniería</label>
                  <input 
                    type="text"
                    value={integrations.telegramChatIdIngenieria}
                    onChange={e => setIntegrations(prev => ({ ...prev, telegramChatIdIngenieria: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="-100..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Chat ID Dirección</label>
                  <input 
                    type="text"
                    value={integrations.telegramChatIdDireccion}
                    onChange={e => setIntegrations(prev => ({ ...prev, telegramChatIdDireccion: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="-100..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Chat ID Postventa</label>
                  <input 
                    type="text"
                    value={integrations.telegramChatIdPostventa}
                    onChange={e => setIntegrations(prev => ({ ...prev, telegramChatIdPostventa: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-3 text-white text-xs font-mono"
                    placeholder="-100..."
                  />
                </div>
              </div>
            </div>

            {/* Email dispatch (Resend) */}
            <div className="space-y-3 p-4 bg-slate-950/30 border border-slate-900 rounded">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono block">Notificación por Email (Resend)</span>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Resend API Key</label>
                <input 
                  type="password"
                  value={integrations.resendApiKey}
                  onChange={e => setIntegrations(prev => ({ ...prev, resendApiKey: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-3 text-white text-xs font-mono focus:border-cyan-500 focus:ring-0"
                  placeholder="re_..."
                />
              </div>
            </div>

            {/* Twilio SMS/WhatsApp */}
            <div className="space-y-3 p-4 bg-slate-950/30 border border-slate-900 rounded">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono block">Mensajería Crítica (Twilio WhatsApp API)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Account SID</label>
                  <input 
                    type="text"
                    value={integrations.twilioAccountSid}
                    onChange={e => setIntegrations(prev => ({ ...prev, twilioAccountSid: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-3 text-white text-xs font-mono focus:border-cyan-500 focus:ring-0"
                    placeholder="AC..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Auth Token</label>
                  <input 
                    type="password"
                    value={integrations.twilioAuthToken}
                    onChange={e => setIntegrations(prev => ({ ...prev, twilioAuthToken: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-3 text-white text-xs font-mono focus:border-cyan-500 focus:ring-0"
                    placeholder="Escribe tu Twilio Auth Token"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">WhatsApp Remitente Autorizado (From Number)</label>
                <input 
                  type="text"
                  value={integrations.twilioWhatsappFrom}
                  onChange={e => setIntegrations(prev => ({ ...prev, twilioWhatsappFrom: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-3 text-white text-xs font-mono focus:border-cyan-500 focus:ring-0"
                  placeholder="whatsapp:+14155238886"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-900 bg-slate-900/10">
          <button
            type="submit"
            disabled={isPending}
            className="text-xs font-bold uppercase tracking-wider font-mono bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 px-6 py-2.5 rounded flex items-center space-x-2 transition-all disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
