"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Palette, 
  Key, 
  Upload, 
  Loader2, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileText
} from "lucide-react";
import { updateTenantBrandingAction, uploadMediaAction, resetTenantBrandingAction } from "@/lib/server-actions/config";
import { crmTenantConfig, crmTenantBranding, crmTenantIntegrations, crmMediaLibrary } from "@/lib/db/schema";

interface ConfigFormProps {
  initialConfig: typeof crmTenantConfig.$inferSelect;
  initialBranding: typeof crmTenantBranding.$inferSelect;
  initialIntegrations: typeof crmTenantIntegrations.$inferSelect | null;
  mediaLibrary: (typeof crmMediaLibrary.$inferSelect)[];
}

type TabType = "empresa" | "branding" | "integraciones";

const COLOR_PRESETS = [
  {
    name: "Corporate Light",
    primaryColor: "#FFFFFF",
    secondaryColor: "#0F172A",
    btnColor: "#0F172A",
    sidebarColor: "#FFFFFF",
    loginColor: "#FFFFFF",
    portalColor: "#FFFFFF"
  },
  {
    name: "Siemens Light",
    primaryColor: "#F8FAFC",
    secondaryColor: "#009999",
    btnColor: "#009999",
    sidebarColor: "#F8FAFC",
    loginColor: "#F8FAFC",
    portalColor: "#F8FAFC"
  },
  {
    name: "Modern Light",
    primaryColor: "#F4F4F5",
    secondaryColor: "#2563EB",
    btnColor: "#2563EB",
    sidebarColor: "#F4F4F5",
    loginColor: "#F4F4F5",
    portalColor: "#F4F4F5"
  },
  {
    name: "Industrial Dark",
    primaryColor: "#0F172A",
    secondaryColor: "#0EA5E9",
    btnColor: "#0EA5E9",
    sidebarColor: "#0F172A",
    loginColor: "#0F172A",
    portalColor: "#0F172A"
  },
  {
    name: "Siemens Dark",
    primaryColor: "#001B36",
    secondaryColor: "#00A0A0",
    btnColor: "#00A0A0",
    sidebarColor: "#001B36",
    loginColor: "#001B36",
    portalColor: "#001B36"
  },
  {
    name: "Carbon Dark",
    primaryColor: "#111827",
    secondaryColor: "#06B6D4",
    btnColor: "#06B6D4",
    sidebarColor: "#111827",
    loginColor: "#111827",
    portalColor: "#111827"
  }
];

export default function ConfigForm({ 
  initialConfig, 
  initialBranding, 
  initialIntegrations,
  mediaLibrary 
}: ConfigFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("empresa");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
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
    logoDarkUrl: initialBranding.logoDarkUrl || "",
    faviconUrl: initialBranding.faviconUrl || "",
    loginBgUrl: initialBranding.loginBgUrl || "",
    portalBgUrl: initialBranding.portalBgUrl || "",
    primaryColor: initialBranding.primaryColor,
    secondaryColor: initialBranding.secondaryColor,
    btnColor: initialBranding.btnColor || "#0ea5e9",
    sidebarColor: initialBranding.sidebarColor || "#0f172a",
    loginColor: initialBranding.loginColor || "#0f172a",
    portalColor: initialBranding.portalColor || "#0f172a",
    customCss: initialBranding.customCss || "",
    portalName: initialBranding.portalName,
    crmConfig: initialBranding.crmConfig,
    pipelineStages: initialBranding.pipelineStages,
    portalConfig: initialBranding.portalConfig
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

  // General File Upload Handler
  async function handleFieldUpload(e: React.ChangeEvent<HTMLInputElement>, fieldName: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingField(fieldName);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadMediaAction(formData);

      if (!res.success) {
        throw new Error(res.error || "Error al subir el archivo.");
      }

      const fileUrl = res.data;
      setBranding(prev => ({ ...prev, [fieldName]: fileUrl }));
      
      // Update local media library preview list
      const newMediaItem = {
        id: Math.random().toString(),
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: null,
        createdAt: new Date(),
      };
      setLocalMediaList(prev => [newMediaItem, ...prev]);
      
      setFeedback({ type: "success", message: "Archivo cargado y registrado correctamente." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al subir el archivo." });
    } finally {
      setIsUploading(false);
      setUploadingField(null);
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
          initialIntegrations ? integrations : undefined
        );

        if (!res.success) {
          throw new Error(res.error || "Error al actualizar la configuración.");
        }

        setFeedback({ type: "success", message: "Configuración guardada correctamente." });
        router.refresh();
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Error al guardar los cambios." });
      }
    });
  }

  // Reset Branding Handler
  async function handleResetBranding() {
    if (!window.confirm("¿Está seguro de que desea restablecer la marca y colores corporativos a los valores originales de CYH?")) return;
    setIsUploading(true);
    setFeedback(null);
    try {
      const res = await resetTenantBrandingAction();
      if (res.success) {
        setFeedback({ type: "success", message: "Configuración restablecida. Recargando..." });
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setFeedback({ type: "error", message: res.error || "Error al restablecer branding." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al restablecer branding." });
    } finally {
      setIsUploading(false);
    }
  }

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBranding(prev => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      btnColor: preset.btnColor,
      sidebarColor: preset.sidebarColor,
      loginColor: preset.loginColor,
      portalColor: preset.portalColor
    }));
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded shadow-lg overflow-hidden font-sans">
      
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
            <div className="font-mono text-xs">{feedback.message}</div>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Form Fields Column */}
            <div className="xl:col-span-2 space-y-6">
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
                  <label className="text-xs font-bold text-slate-300 uppercase">URL del Logotipo Principal</label>
                  <input 
                    type="text"
                    value={branding.logoUrl}
                    onChange={e => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-sm focus:border-cyan-500 focus:ring-0 font-mono"
                    placeholder="URL del logo principal"
                  />
                </div>
              </div>

              {/* Upload Panel for Logo & Branding elements */}
              <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-900 rounded">
                <span className="text-xs font-bold text-slate-400 uppercase block font-mono">Gestor de Carga Multimedia de Marca</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { field: "logoUrl", label: "Logo Principal" },
                    { field: "logoDarkUrl", label: "Logo Oscuro" },
                    { field: "faviconUrl", label: "Favicon Sitio" },
                    { field: "loginBgUrl", label: "Imagen Login" },
                    { field: "portalBgUrl", label: "Logo Portal Cliente" }
                  ].map(item => (
                    <div key={item.field} className="space-y-1.5 p-2 bg-slate-900/50 border border-slate-800 rounded">
                      <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">{item.label}</span>
                      <div className="relative border border-dashed border-slate-750 rounded p-2 text-center cursor-pointer flex flex-col items-center justify-center min-h-[60px]">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => handleFieldUpload(e, item.field)}
                          disabled={isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {uploadingField === item.field ? (
                          <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="text-[8px] text-slate-500 font-mono mt-1">Subir archivo</span>
                      </div>
                      {(branding as any)[item.field] && (
                        <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-slate-500">
                          <span className="truncate max-w-[80px]">{(branding as any)[item.field]}</span>
                          <img src={(branding as any)[item.field]} alt="preview" className="h-4 w-4 object-contain" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recent uploads gallery selection shortcut */}
                <div className="space-y-1.5 border-t border-slate-900 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 font-mono">
                    <ImageIcon className="h-3 w-3 text-cyan-400" /> Usar Cargas Recientes para Logo Principal
                  </span>
                  <div className="grid grid-cols-6 gap-1.5 max-h-[60px] overflow-y-auto pr-1">
                    {localMediaList.map(media => (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: media.fileUrl }))}
                        className={`h-8 border rounded bg-slate-950/60 flex items-center justify-center p-1 transition-all ${
                          branding.logoUrl === media.fileUrl ? "border-cyan-500" : "border-slate-800"
                        }`}
                        title={media.fileName}
                      >
                        <img src={media.fileUrl} alt={media.fileName} className="h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-3 bg-slate-950/30 p-4 border border-slate-900 rounded">
                <span className="text-xs font-bold text-cyan-400 uppercase font-mono block">Temas Predeterminados (Presets)</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-600 p-2 rounded text-left flex flex-col gap-1 transition-all"
                    >
                      <span className="text-[10px] font-bold text-white font-mono truncate">{preset.name}</span>
                      <div className="flex gap-1 items-center mt-1">
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-800" style={{ backgroundColor: preset.primaryColor }} />
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-800" style={{ backgroundColor: preset.secondaryColor }} />
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-800" style={{ backgroundColor: preset.btnColor }} />
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-800" style={{ backgroundColor: preset.sidebarColor }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Pickers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: "primaryColor", label: "Primario" },
                  { key: "secondaryColor", label: "Secundario" },
                  { key: "btnColor", label: "Botones" },
                  { key: "sidebarColor", label: "Sidebar" },
                  { key: "loginColor", label: "Login Panel" },
                  { key: "portalColor", label: "Portal Fondo" }
                ].map(col => (
                  <div key={col.key} className="space-y-1 bg-slate-950/30 p-2.5 border border-slate-900 rounded">
                    <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">{col.label}</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={(branding as any)[col.key]}
                        onChange={e => setBranding(prev => ({ ...prev, [col.key]: e.target.value }))}
                        className="w-7 h-7 rounded border border-slate-850 bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text"
                        required
                        value={(branding as any)[col.key]}
                        onChange={e => setBranding(prev => ({ ...prev, [col.key]: e.target.value }))}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded py-0.5 px-2 text-white text-[10px] font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom CSS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Código CSS Personalizado</label>
                <textarea 
                  rows={2}
                  value={branding.customCss}
                  onChange={e => setBranding(prev => ({ ...prev, customCss: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-2 px-3 text-white text-xs focus:border-cyan-500 focus:ring-0 font-mono resize-none"
                  placeholder="/* Agregue sus variables o estilos aquí */"
                />
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="xl:col-span-1 space-y-6 bg-slate-950/30 p-4 border border-slate-900 rounded-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono block border-b border-slate-800 pb-1 mb-2">Previsualización en Vivo</span>

              {/* CRM View */}
              <div className="border border-slate-850 rounded bg-slate-950 p-3 font-mono text-[8px] space-y-1.5">
                <span className="font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-0.5 mb-1.5">CRM Previsualizar</span>
                <div className="flex h-28 border border-slate-850 rounded overflow-hidden">
                  <div className="w-1/4 border-r border-slate-850 p-1.5 flex flex-col justify-between" style={{ backgroundColor: branding.sidebarColor, color: branding.primaryColor === '#FFFFFF' || branding.sidebarColor === '#FFFFFF' ? '#0f172a' : '#ffffff' }}>
                    <div className="space-y-1">
                      <div className="font-bold text-[6px] truncate flex items-center gap-0.5">
                        {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="h-2.5 w-auto object-contain max-w-[25px]" /> : <div className="w-2 h-2 rounded bg-accent-cyan" />}
                        <span>{config.companyName || "CYH OS"}</span>
                      </div>
                      <div className="h-0.5 bg-slate-800/40 rounded w-full" />
                    </div>
                    <div className="h-1.5 rounded w-2/3 bg-slate-800/20" />
                  </div>
                  <div className="flex-grow bg-slate-900 p-2 flex flex-col justify-between">
                    <div className="h-1 bg-slate-850 rounded w-12" />
                    <div className="space-y-1 py-1">
                      <div className="h-2 bg-slate-850 rounded w-1/3" />
                      <div className="h-1 bg-slate-850 rounded w-full" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="px-2 py-0.5 rounded-sm text-[6px] font-bold uppercase" style={{ backgroundColor: branding.btnColor, color: '#000000' }}>
                        Botón
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portal View */}
              <div className="border border-slate-850 rounded bg-slate-950 p-3 font-mono text-[8px] space-y-1.5">
                <span className="font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-0.5 mb-1.5">Portal Previsualizar</span>
                <div className="h-28 border border-slate-850 rounded overflow-hidden flex flex-col" style={{ backgroundColor: branding.portalColor }}>
                  <div className="border-b border-slate-850 p-1 flex justify-between items-center" style={{ backgroundColor: branding.primaryColor, color: branding.primaryColor === '#FFFFFF' ? '#0f172a' : '#ffffff' }}>
                    <div className="flex items-center gap-1">
                      {branding.portalBgUrl ? <img src={branding.portalBgUrl} alt="Portal Logo" className="h-2.5 w-auto object-contain max-w-[30px]" /> : <div className="w-2 h-2 rounded bg-accent-cyan" />}
                      <span className="font-bold text-[7px]">{branding.portalName || "Portal Cliente"}</span>
                    </div>
                    <div className="h-1.5 bg-slate-850/40 rounded w-8" />
                  </div>
                  <div className="flex-1 bg-slate-900/50 p-2 space-y-1.5">
                    <div className="h-1 bg-slate-850 rounded w-2/3" />
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-6 border border-slate-850 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                        <span className="text-[4px] text-slate-500">Activos</span>
                        <span className="text-[6px] font-bold text-cyan-400">Ver</span>
                      </div>
                      <div className="h-6 border border-slate-850 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                        <span className="text-[4px] text-slate-500">Facturas</span>
                        <span className="text-[6px] font-bold text-cyan-400">Ver</span>
                      </div>
                      <div className="h-6 border border-slate-850 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                        <span className="text-[4px] text-slate-500">Solicitudes</span>
                        <span className="text-[6px] font-bold text-cyan-400">Ver</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
        <div className="flex justify-end pt-4 border-t border-slate-900 bg-slate-900/10 gap-3">
          {activeTab === "branding" && (
            <button
              type="button"
              onClick={handleResetBranding}
              disabled={isUploading || isPending}
              className="text-xs font-bold uppercase tracking-wider font-mono bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 px-4 py-2.5 rounded flex items-center space-x-2 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restablecer Branding</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isPending || isUploading}
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
