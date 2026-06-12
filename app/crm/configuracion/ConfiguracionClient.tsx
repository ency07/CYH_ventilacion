"use client";

import React, { useState } from "react";
import { 
  Settings, Building2, Sliders, Puzzle, ShieldCheck, 
  Save, Loader2, Check, AlertTriangle, Key, Terminal,
  Image as ImageIcon, Palette, Eye, ArrowUp, ArrowDown, Trash2, Plus
} from "lucide-react";
import { updateTenantBrandingAction, uploadMediaAction } from "@/lib/server-actions/config";

interface ConfigProps {
  currentUser: any;
  initialBranding: any;
}

export default function ConfiguracionClient({ currentUser, initialBranding }: ConfigProps) {
  const [activeTab, setActiveTab] = useState("empresa");
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const branding = initialBranding?.branding || {};
  const crmConfigDb = branding.crmConfig || {};
  const portalConfigDb = branding.portalConfig || {};

  // --- Tab 1: Datos de empresa ---
  const [companyName, setCompanyName] = useState(initialBranding?.config?.companyName || "");
  const [nit, setNit] = useState(initialBranding?.config?.nit || "");
  const [email, setEmail] = useState(initialBranding?.config?.email || "");
  const [phone, setPhone] = useState(initialBranding?.config?.phone || "");
  const [address, setAddress] = useState(initialBranding?.config?.address || "");

  // --- Tab 2: Branding (Logos) ---
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");
  const [logoDarkUrl, setLogoDarkUrl] = useState(branding.logoDarkUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(branding.faviconUrl || "");
  const [loginBgUrl, setLoginBgUrl] = useState(branding.loginBgUrl || "");
  const [portalBgUrl, setPortalBgUrl] = useState(branding.portalBgUrl || "");

  // --- Tab 3: Colores Corporativos ---
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || "#0f172a");
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor || "#0ea5e9");
  const [btnColor, setBtnColor] = useState(branding.btnColor || "#0ea5e9");
  const [sidebarColor, setSidebarColor] = useState(branding.sidebarColor || "#0f172a");
  const [loginColor, setLoginColor] = useState(branding.loginColor || "#0f172a");
  const [portalColor, setPortalColor] = useState(branding.portalColor || "#0f172a");

  // --- Tab 4: CRM Config (Toggles & Pipeline stages) ---
  const [showDashboard, setShowDashboard] = useState(crmConfigDb.showDashboard ?? true);
  const [showReports, setShowReports] = useState(crmConfigDb.showReports ?? true);
  const [showAlerts, setShowAlerts] = useState(crmConfigDb.showAlerts ?? true);
  const [showFinances, setShowFinances] = useState(crmConfigDb.showFinances ?? true);
  const [showDiagnostics, setShowDiagnostics] = useState(crmConfigDb.showDiagnostics ?? true);

  const [stages, setStages] = useState<Array<{ name: string; prob: number; color: string }>>(
    branding.pipelineStages || [
      { name: "Nuevo Prospecto", prob: 10, color: "bg-slate-500" },
      { name: "Diagnóstico Técnico", prob: 30, color: "bg-blue-500" },
      { name: "Propuesta Enviada", prob: 60, color: "bg-amber-500" },
      { name: "Negociación / Cierre", prob: 80, color: "bg-purple-500" },
      { name: "Cerrado Ganado", prob: 100, color: "bg-emerald-500" }
    ]
  );
  const [newStageName, setNewStageName] = useState("");
  const [newStageProb, setNewStageProb] = useState(50);

  // --- Tab 5: Portal Cliente ---
  const [portalName, setPortalName] = useState(branding.portalName || "Portal Cliente");
  const [welcomeMessage, setWelcomeMessage] = useState(portalConfigDb.welcomeMessage || "Bienvenido a su portal corporativo.");
  const [portalModules, setPortalModules] = useState({
    solicitudes: portalConfigDb.modules?.solicitudes ?? true,
    facturas: portalConfigDb.modules?.facturas ?? true,
    activos: portalConfigDb.modules?.activos ?? true,
    contratos: portalConfigDb.modules?.contratos ?? true,
    warRooms: portalConfigDb.modules?.warRooms ?? true,
    diagnosticos: portalConfigDb.modules?.diagnosticos ?? true,
  });
  const [menuOrder, setMenuOrder] = useState<string[]>(
    portalConfigDb.menuOrder || ["Inicio", "Solicitudes", "Activos", "Facturas", "Contratos"]
  );

  // --- Tab 6: Integraciones ---
  const [telegramBotToken, setTelegramBotToken] = useState(initialBranding?.integrations?.telegramBotToken || "");
  const [telegramChatIdVentas, setTelegramChatIdVentas] = useState(initialBranding?.integrations?.telegramChatIdVentas || "");
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("resend");

  // Handle uploading files for logos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: (val: string) => void, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadMediaAction(formData);

      if (res.success) {
        fieldSetter(res.data);
        setMessage({ success: true, text: `Archivo cargado exitosamente.` });
      } else {
        setMessage({ success: false, text: res.error });
      }
    } catch (err: any) {
      setMessage({ success: false, text: err.message || "Error al subir el archivo." });
    } finally {
      setUploadingField(null);
    }
  };

  const handleStageProbChange = (index: number, val: number) => {
    const next = [...stages];
    next[index].prob = val;
    setStages(next);
  };

  const handleStageNameChange = (index: number, val: string) => {
    const next = [...stages];
    next[index].name = val;
    setStages(next);
  };

  const addStage = () => {
    if (!newStageName.trim()) return;
    const colors = ["bg-slate-500", "bg-blue-500", "bg-indigo-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setStages([...stages, { name: newStageName, prob: newStageProb, color: randomColor }]);
    setNewStageName("");
    setNewStageProb(50);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const moveMenuItem = (index: number, direction: "up" | "down") => {
    const next = [...menuOrder];
    if (direction === "up" && index > 0) {
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
    } else if (direction === "down" && index < next.length - 1) {
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
    }
    setMenuOrder(next);
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
          logoUrl: logoUrl || null,
          logoDarkUrl: logoDarkUrl || null,
          faviconUrl: faviconUrl || null,
          loginBgUrl: loginBgUrl || null,
          portalBgUrl: portalBgUrl || null,
          primaryColor,
          secondaryColor,
          btnColor,
          sidebarColor,
          loginColor,
          portalColor,
          customCss: initialBranding?.branding?.customCss || null,
          portalName: portalName || "Portal Cliente",
          crmConfig: {
            showDashboard,
            showReports,
            showAlerts,
            showFinances,
            showDiagnostics
          },
          pipelineStages: stages,
          portalConfig: {
            welcomeMessage,
            modules: portalModules,
            menuOrder
          }
        },
        { 
          telegramBotToken,
          telegramChatIdVentas,
          resendApiKey: initialBranding?.integrations?.resendApiKey || null
        }
      );

      if (res.success) {
        setMessage({ success: true, text: "Configuración global de marca e IAM guardada y aplicada correctamente." });
        setTimeout(() => setMessage(null), 3500);
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
    { id: "empresa", name: "Datos Empresa", icon: Building2 },
    { id: "branding", name: "Branding / Logos", icon: ImageIcon },
    { id: "colores", name: "Colores Corporativos", icon: Palette },
    { id: "crm", name: "Configuración CRM", icon: Sliders },
    { id: "portal", name: "Portal Cliente", icon: Eye },
    { id: "integraciones", name: "Integraciones SMTP", icon: Puzzle },
    { id: "seguridad", name: "Seguridad RLS", icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent-cyan" />
            Configuración & Whitelabel
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Ajustes globales de marca, logos, CRM, Portal Cliente e integraciones
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

            {/* TAB 2: BRANDING LOGOS */}
            {activeTab === "branding" && (
              <div className="space-y-6 max-w-3xl">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                  [+] LOGOTIPOS Y MATERIAL DE MARCA
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Principal (Claro) */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono block">Logo Principal (Fondo Oscuro)</span>
                    <input 
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="URL del Logo Principal"
                      className="w-full bg-slate-950 border border-slate-850 p-2 text-xs font-mono text-slate-300 rounded focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition text-slate-300">
                        {uploadingField === "logoUrl" ? "Cargando..." : "Subir Archivo"}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setLogoUrl, "logoUrl")}
                        />
                      </label>
                      {logoUrl && <img src={logoUrl} alt="Logo Prev" className="h-6 object-contain max-w-[120px]" />}
                    </div>
                  </div>

                  {/* Logo Oscuro */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono block">Logo Secundario (Fondo Claro)</span>
                    <input 
                      type="text"
                      value={logoDarkUrl}
                      onChange={(e) => setLogoDarkUrl(e.target.value)}
                      placeholder="URL del Logo Oscuro"
                      className="w-full bg-slate-950 border border-slate-850 p-2 text-xs font-mono text-slate-300 rounded focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition text-slate-300">
                        {uploadingField === "logoDarkUrl" ? "Cargando..." : "Subir Archivo"}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setLogoDarkUrl, "logoDarkUrl")}
                        />
                      </label>
                      {logoDarkUrl && <img src={logoDarkUrl} alt="Logo Dark Prev" className="h-6 object-contain max-w-[120px]" />}
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono block">Favicon Sitio (.ico / .png)</span>
                    <input 
                      type="text"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="URL del Favicon"
                      className="w-full bg-slate-950 border border-slate-855 p-2 text-xs font-mono text-slate-300 rounded"
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition text-slate-300">
                        {uploadingField === "faviconUrl" ? "Cargando..." : "Subir Favicon"}
                        <input 
                          type="file" 
                          accept="image/x-icon, image/png"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setFaviconUrl, "faviconUrl")}
                        />
                      </label>
                      {faviconUrl && <img src={faviconUrl} alt="Favicon Prev" className="h-6 w-6 object-contain" />}
                    </div>
                  </div>

                  {/* Imagen Login */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono block">Imagen de Fondo de Pantalla Login</span>
                    <input 
                      type="text"
                      value={loginBgUrl}
                      onChange={(e) => setLoginBgUrl(e.target.value)}
                      placeholder="URL Imagen Login"
                      className="w-full bg-slate-950 border border-slate-855 p-2 text-xs font-mono text-slate-300 rounded"
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition text-slate-300">
                        {uploadingField === "loginBgUrl" ? "Cargando..." : "Subir Imagen"}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setLoginBgUrl, "loginBgUrl")}
                        />
                      </label>
                      {loginBgUrl && <img src={loginBgUrl} alt="Login Background Preview" className="h-6 object-contain max-w-[80px]" />}
                    </div>
                  </div>

                  {/* Imagen Portal Cliente */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm md:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono block">Logotipo Encabezado Portal Cliente</span>
                    <input 
                      type="text"
                      value={portalBgUrl}
                      onChange={(e) => setPortalBgUrl(e.target.value)}
                      placeholder="URL Imagen Encabezado Portal"
                      className="w-full bg-slate-950 border border-slate-855 p-2 text-xs font-mono text-slate-300 rounded"
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition text-slate-300">
                        {uploadingField === "portalBgUrl" ? "Cargando..." : "Subir Logotipo"}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setPortalBgUrl, "portalBgUrl")}
                        />
                      </label>
                      {portalBgUrl && <img src={portalBgUrl} alt="Portal Header Preview" className="h-6 object-contain max-w-[120px]" />}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: COLORES CORPORATIVOS */}
            {activeTab === "colores" && (
              <div className="space-y-6 max-w-3xl">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                  [+] PALETA DE COLORES DE LA PLATAFORMA (DYNAMIC CSS)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  
                  {/* Primario */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color Primario</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Secundario */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color Secundario</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color de Botones</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={btnColor} 
                        onChange={(e) => setBtnColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={btnColor} 
                        onChange={(e) => setBtnColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color del Sidebar</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={sidebarColor} 
                        onChange={(e) => setSidebarColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={sidebarColor} 
                        onChange={(e) => setSidebarColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Login */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color Panel Login</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={loginColor} 
                        onChange={(e) => setLoginColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={loginColor} 
                        onChange={(e) => setLoginColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Portal */}
                  <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-850 rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono block">Color Portal Cliente</span>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={portalColor} 
                        onChange={(e) => setPortalColor(e.target.value)} 
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={portalColor} 
                        onChange={(e) => setPortalColor(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono p-1 text-white rounded"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: CRM CONFIG */}
            {activeTab === "crm" && (
              <div className="space-y-6 max-w-3xl">
                
                {/* Visual Toggles */}
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] MÓDULOS ACTIVOS DEL CRM
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Mostrar Dashboard", state: showDashboard, setter: setShowDashboard },
                      { label: "Mostrar Reportes & Estadísticas", state: showReports, setter: setShowReports },
                      { label: "Mostrar Notificaciones / Alertas", state: showAlerts, setter: setShowAlerts },
                      { label: "Mostrar Finanzas & PSE", state: showFinances, setter: setShowFinances },
                      { label: "Mostrar Diagnósticos Técnicos", state: showDiagnostics, setter: setShowDiagnostics }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-sm">
                        <span className="text-xs text-white uppercase font-mono font-bold">{item.label}</span>
                        <button
                          type="button"
                          onClick={() => item.setter(!item.state)}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors ${item.state ? "bg-accent-cyan" : "bg-slate-850"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition-transform ${item.state ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Builder */}
                <div className="space-y-4">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] CONSTRUCTOR PERSONALIZADO DE PIPELINE / EMBUDO
                  </h2>

                  <div className="space-y-3">
                    {stages.map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950/40 p-3 border border-slate-855 rounded-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color || "bg-accent-cyan"}`} />
                        
                        {/* Name Input */}
                        <input 
                          type="text" 
                          value={stage.name} 
                          onChange={(e) => handleStageNameChange(idx, e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-850 p-1.5 text-xs text-white rounded font-mono font-bold uppercase"
                        />

                        {/* Probability */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">Probabilidad:</span>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={stage.prob}
                            onChange={(e) => handleStageProbChange(idx, parseInt(e.target.value) || 0)}
                            className="w-14 bg-slate-950 border border-slate-850 text-center p-1.5 text-xs text-white rounded font-mono"
                          />
                          <span className="text-xs text-slate-400 font-mono">%</span>
                        </div>

                        {/* Delete Stage */}
                        <button 
                          type="button" 
                          onClick={() => removeStage(idx)}
                          className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Stage Form */}
                  <div className="flex gap-3 bg-slate-950/80 p-4 border border-slate-800 rounded-sm">
                    <input 
                      type="text"
                      placeholder="Nueva Etapa (Ej. Visita Técnica)"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Prob:</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={newStageProb}
                        onChange={(e) => setNewStageProb(parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-950 border border-slate-850 p-2 text-center text-xs text-white rounded font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addStage}
                      className="flex items-center gap-2 bg-slate-800 text-accent-cyan border border-slate-700 px-4 py-2 text-xs uppercase font-bold rounded hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4" /> Agregar Etapa
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: PORTAL CLIENTE */}
            {activeTab === "portal" && (
              <div className="space-y-6 max-w-3xl">
                
                {/* General Settings */}
                <div className="space-y-4">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] GENERAL PORTAL DE CLIENTES
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Nombre del Portal</label>
                      <input 
                        type="text" 
                        value={portalName}
                        onChange={(e) => setPortalName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Mensaje de Bienvenida</label>
                      <input 
                        type="text" 
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-slate-500 font-mono" 
                      />
                    </div>
                  </div>
                </div>

                {/* Modules Activation */}
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] MÓDULOS ACTIVOS DEL PORTAL DE CLIENTE
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "solicitudes", label: "Gestión de Solicitudes" },
                      { key: "facturas", label: "Consultar Facturas / Pagos" },
                      { key: "activos", label: "Ficha Técnica de Activos" },
                      { key: "contratos", label: "Firmar Contratos" },
                      { key: "warRooms", label: "Historial de War Rooms" },
                      { key: "diagnosticos", label: "Ver Propuestas & Diagnósticos" }
                    ].map((mod) => (
                      <div key={mod.key} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-sm">
                        <span className="text-xs text-white uppercase font-mono font-bold">{mod.label}</span>
                        <button
                          type="button"
                          onClick={() => setPortalModules({ ...portalModules, [mod.key]: !((portalModules as any)[mod.key]) })}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors ${(portalModules as any)[mod.key] ? "bg-accent-cyan" : "bg-slate-850"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition-transform ${(portalModules as any)[mod.key] ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu Reordering */}
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] ORDENAMIENTO DEL MENÚ DE NAVEGACIÓN
                  </h2>
                  <div className="space-y-2 max-w-md">
                    {menuOrder.map((item, idx) => (
                      <div key={item} className="flex items-center justify-between bg-slate-950/60 p-3 border border-slate-855 rounded-sm">
                        <span className="text-xs text-white font-mono font-bold uppercase">{idx + 1}. {item}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveMenuItem(idx, "up")}
                            className="p-1 text-slate-400 hover:text-accent-cyan disabled:opacity-30 transition-colors"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === menuOrder.length - 1}
                            onClick={() => moveMenuItem(idx, "down")}
                            className="p-1 text-slate-400 hover:text-accent-cyan disabled:opacity-30 transition-colors"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 6: INTEGRACIONES */}
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

            {/* TAB 7: SEGURIDAD */}
            {activeTab === "seguridad" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    [+] DIAGNÓSTICO DE AISLAMIENTO MULTI-TENANT RLS
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/60 border border-slate-855 p-5 rounded-sm space-y-4">
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

                    <div className="bg-slate-950/60 border border-slate-855 p-5 rounded-sm space-y-4">
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
                  disabled={saving || uploadingField !== null}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50 font-mono"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Whitelabel Config
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
