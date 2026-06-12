"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, Building2, Sliders, Puzzle, ShieldCheck, 
  Save, Loader2, Check, AlertTriangle, Key, Terminal,
  Image as ImageIcon, Palette, Eye, ArrowUp, ArrowDown, Trash2, Plus, Copy, RefreshCw, Grid, PlusCircle,
  FileText, File, ExternalLink, Upload, X
} from "lucide-react";
import { 
  updateTenantBrandingAction, 
  uploadMediaAction,
  getMediaLibraryAction,
  deleteMediaLibraryAction,
  getCatalogProductsAction,
  createCatalogProductAction,
  updateCatalogProductAction,
  deleteCatalogProductAction,
  resetTenantBrandingAction
} from "@/lib/server-actions/config";

interface ConfigProps {
  currentUser: any;
  initialBranding: any;
  initialTab?: string;
}

const COLOR_PRESETS = [
  {
    name: "Corporate Light",
    primaryColor: "#FFFFFF",
    secondaryColor: "#0F172A",
    btnColor: "#0F172A",
    sidebarColor: "#FFFFFF",
    loginColor: "#FFFFFF",
    portalColor: "#FFFFFF",
    isDark: false
  },
  {
    name: "Siemens Light",
    primaryColor: "#F8FAFC",
    secondaryColor: "#009999",
    btnColor: "#009999",
    sidebarColor: "#F8FAFC",
    loginColor: "#F8FAFC",
    portalColor: "#F8FAFC",
    isDark: false
  },
  {
    name: "Modern Light",
    primaryColor: "#F4F4F5",
    secondaryColor: "#2563EB",
    btnColor: "#2563EB",
    sidebarColor: "#F4F4F5",
    loginColor: "#F4F4F5",
    portalColor: "#F4F4F5",
    isDark: false
  },
  {
    name: "Industrial Dark",
    primaryColor: "#0F172A",
    secondaryColor: "#0EA5E9",
    btnColor: "#0EA5E9",
    sidebarColor: "#0F172A",
    loginColor: "#0F172A",
    portalColor: "#0F172A",
    isDark: true
  },
  {
    name: "Siemens Dark",
    primaryColor: "#001B36",
    secondaryColor: "#00A0A0",
    btnColor: "#00A0A0",
    sidebarColor: "#001B36",
    loginColor: "#001B36",
    portalColor: "#001B36",
    isDark: true
  },
  {
    name: "Carbon Dark",
    primaryColor: "#111827",
    secondaryColor: "#06B6D4",
    btnColor: "#06B6D4",
    sidebarColor: "#111827",
    loginColor: "#111827",
    portalColor: "#111827",
    isDark: true
  }
];

export default function ConfiguracionClient({ currentUser, initialBranding, initialTab }: ConfigProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab || "empresa");
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

  // --- Tab 4: Media Library states ---
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // --- Tab 5: Catalog states ---
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "axiales",
    rpm: "",
    caudal: "",
    presion: "",
    potencia: "",
    voltaje: "",
    proteccion: "",
    material: "",
    aplicacion: "",
    normas: "",
    eficiencia: "IE3",
    image: "",
    curvaPoints: "M 10 90 Q 40 40, 90 10",
    gallery: [] as string[]
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [showMediaPickerForField, setShowMediaPickerForField] = useState<string | null>(null); // 'image' or 'gallery'

  // --- Tab 6: CRM Config (Toggles & Pipeline stages) ---
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

  // --- Tab 7: Portal Cliente ---
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

  // --- Tab 8: Integraciones ---
  const [telegramBotToken, setTelegramBotToken] = useState(initialBranding?.integrations?.telegramBotToken || "");
  const [telegramChatIdVentas, setTelegramChatIdVentas] = useState(initialBranding?.integrations?.telegramChatIdVentas || "");
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("resend");

  // Load resources for specific tabs
  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
    } else if (activeTab === "catalog") {
      fetchCatalog();
      fetchMedia(); // also load media for catalog image selector
    }
  }, [activeTab]);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    const res = await getMediaLibraryAction();
    if (res.success && res.data) {
      setMediaItems(res.data);
    }
    setLoadingMedia(false);
  };

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    const res = await getCatalogProductsAction();
    if (res.success && res.data) {
      setCatalogItems(res.data);
    }
    setLoadingCatalog(false);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL del archivo copiada al portapapeles.");
  };

  const handleDeleteMedia = async (id: string, url: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar permanentemente este archivo de almacenamiento?")) return;
    const res = await deleteMediaLibraryAction(id, url);
    if (res.success) {
      setMediaItems(prev => prev.filter(item => item.id !== id));
    } else {
      alert(res.error || "Fallo al eliminar archivo.");
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle media file upload
  const handleMediaLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadMediaAction(formData);
      if (res.success) {
        // Refetch media library
        await fetchMedia();
      } else {
        alert(res.error || "Error al subir archivo.");
      }
    } catch (err: any) {
      alert(err.message || "Fallo la carga.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

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
        // Refetch media items so they show in recent library
        fetchMedia();
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
        router.refresh();
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

  // --- Reset Handler ---
  const handleResetBranding = async () => {
    if (!window.confirm("¿Está seguro de que desea restablecer la marca y colores corporativos a los valores originales de CYH?")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await resetTenantBrandingAction();
      if (res.success) {
        setMessage({ success: true, text: "Configuración restablecida correctamente. Recargando..." });
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ success: false, text: res.error || "Error al restablecer configuración." });
      }
    } catch (err: any) {
      setMessage({ success: false, text: err.message || "Error al restablecer branding." });
    } finally {
      setSaving(false);
    }
  };

  // --- Catalog CRUD Operations ---
  const openCatalogModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        id: product.id,
        name: product.name,
        category: product.category,
        rpm: product.rpm || "",
        caudal: product.caudal || "",
        presion: product.presion || "",
        potencia: product.potencia || "",
        voltaje: product.voltaje || "",
        proteccion: product.proteccion || "",
        material: product.material || "",
        aplicacion: product.aplicacion || "",
        normas: product.normas || "",
        eficiencia: product.eficiencia || "IE3",
        image: product.image || "",
        curvaPoints: product.curvaPoints || "M 10 90 Q 40 40, 90 10",
        gallery: product.gallery || []
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        id: "",
        name: "",
        category: "axiales",
        rpm: "",
        caudal: "",
        presion: "",
        potencia: "",
        voltaje: "",
        proteccion: "",
        material: "",
        aplicacion: "",
        normas: "",
        eficiencia: "IE3",
        image: "",
        curvaPoints: "M 10 90 Q 40 40, 90 10",
        gallery: []
      });
    }
    setShowCatalogModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.id || !productForm.name || !productForm.image) {
      alert("Por favor complete el Código de equipo, Nombre e Imagen principal.");
      return;
    }

    try {
      let res;
      if (editingProduct) {
        res = await updateCatalogProductAction(productForm.id, productForm);
      } else {
        res = await createCatalogProductAction(productForm);
      }

      if (res.success) {
        setShowCatalogModal(false);
        fetchCatalog();
        alert("Equipo guardado exitosamente.");
      } else {
        alert(res.error || "Error al guardar el equipo.");
      }
    } catch (err: any) {
      alert(err.message || "Error inesperado al guardar.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar permanentemente el equipo '${id}'?`)) return;
    try {
      const res = await deleteCatalogProductAction(id);
      if (res.success) {
        fetchCatalog();
        alert("Equipo eliminado del catálogo.");
      } else {
        alert(res.error || "Error al eliminar el equipo.");
      }
    } catch (err: any) {
      alert(err.message || "Fallo la eliminación.");
    }
  };

  // Add to product form gallery
  const handleAddToGallery = (url: string) => {
    if (!url) return;
    if (productForm.gallery.includes(url)) {
      alert("La imagen ya está en la galería.");
      return;
    }
    setProductForm(prev => ({
      ...prev,
      gallery: [...prev.gallery, url]
    }));
    setNewGalleryUrl("");
  };

  // Remove from product form gallery
  const handleRemoveFromGallery = (idx: number) => {
    setProductForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx)
    }));
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setBtnColor(preset.btnColor);
    setSidebarColor(preset.sidebarColor);
    setLoginColor(preset.loginColor);
    setPortalColor(preset.portalColor);
  };

  const tabs = [
    { id: "empresa", name: "Datos Empresa", icon: Building2 },
    { id: "branding", name: "Branding / Logos", icon: ImageIcon },
    { id: "colores", name: "Colores Corporativos", icon: Palette },
    { id: "media", name: "Biblioteca Multimedia", icon: Grid },
    { id: "catalog", name: "Catálogo Equipos", icon: Sliders },
    { id: "crm", name: "Configuración CRM", icon: Settings },
    { id: "portal", name: "Portal Cliente", icon: Eye },
    { id: "integraciones", name: "Integraciones SMTP", icon: Puzzle },
    { id: "seguridad", name: "Seguridad RLS", icon: ShieldCheck },
  ];

  // Filter media files based on active filter
  const filteredMediaItems = mediaItems.filter(item => {
    if (mediaFilter === "all") return true;
    const isImage = item.mimeType?.startsWith("image/");
    const isPdf = item.mimeType === "application/pdf" || item.fileName?.endsWith(".pdf");
    if (mediaFilter === "images") return isImage;
    if (mediaFilter === "pdfs") return isPdf;
    if (mediaFilter === "other") return !isImage && !isPdf;
    return true;
  });

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
                type="button"
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
            {(activeTab === "branding" || activeTab === "colores") && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form column */}
                <div className="xl:col-span-2 space-y-6">
                  {activeTab === "branding" && (
                    <div className="space-y-6">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                        [+] LOGOTIPOS Y MATERIAL DE MARCA
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Principal */}
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

                  {activeTab === "colores" && (
                    <div className="space-y-6">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-4">
                        [+] PALETA DE COLORES DE LA PLATAFORMA (DYNAMIC CSS)
                      </h2>

                      {/* Presets segment */}
                      <div className="space-y-3 bg-slate-950/30 p-4 border border-slate-850 rounded-sm mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan font-mono block">Temas Predeterminados (Presets)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {COLOR_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-600 p-2.5 rounded text-left flex flex-col gap-1 transition-all"
                            >
                              <span className="text-[10px] font-bold text-white font-mono truncate">{preset.name}</span>
                              <div className="flex gap-1 items-center mt-1">
                                <div className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: preset.primaryColor }} />
                                <div className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: preset.secondaryColor }} />
                                <div className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: preset.btnColor }} />
                                <div className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: preset.sidebarColor }} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                </div>

                {/* Mockups column (Live Preview) */}
                <div className="xl:col-span-1 space-y-6 bg-slate-950/30 p-4 border border-slate-855 rounded-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan font-mono block border-b border-slate-800 pb-1 mb-2">Previsualización en Vivo</span>

                  {/* CRM Mockup */}
                  <div className="border border-slate-800 rounded bg-slate-950 p-4 font-mono text-[9px] space-y-2">
                    <span className="font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-900 pb-1 mb-2">Vista Previa CRM</span>
                    <div className="flex h-36 border border-slate-800 rounded overflow-hidden">
                      {/* Sidebar */}
                      <div className="w-1/4 border-r border-slate-800 p-2 flex flex-col justify-between" style={{ backgroundColor: sidebarColor, color: primaryColor === '#FFFFFF' || sidebarColor === '#FFFFFF' ? '#0f172a' : '#ffffff' }}>
                        <div className="space-y-1.5">
                          <div className="font-bold text-[7px] truncate flex items-center gap-1">
                            {logoUrl ? <img src={logoUrl} alt="Logo" className="h-3 w-auto object-contain max-w-[30px]" /> : <div className="w-2.5 h-2.5 rounded bg-accent-cyan" />}
                            <span>{companyName || "CYH OS"}</span>
                          </div>
                          <div className="h-1 bg-slate-800/40 rounded w-full" />
                          <div className="h-1 bg-slate-800/40 rounded w-4/5" />
                        </div>
                        <div className="h-2 rounded w-2/3 bg-slate-800/20" />
                      </div>
                      
                      {/* Main */}
                      <div className="flex-1 bg-slate-900 p-2.5 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <div className="h-2 bg-slate-800 rounded w-16" />
                          <div className="w-4 h-4 rounded-full bg-slate-800" />
                        </div>
                        <div className="space-y-2 py-2">
                          <div className="h-2.5 bg-slate-800 rounded w-1/3" />
                          <div className="h-1.5 bg-slate-800 rounded w-full" />
                          <div className="h-1.5 bg-slate-800 rounded w-5/6" />
                        </div>
                        <div className="flex justify-end">
                          <button type="button" className="px-3 py-1 rounded-sm text-[7px] font-bold uppercase" style={{ backgroundColor: btnColor, color: '#000000' }}>
                            Botón
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal Mockup */}
                  <div className="border border-slate-800 rounded bg-slate-950 p-4 font-mono text-[9px] space-y-2">
                    <span className="font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-900 pb-1 mb-2">Vista Previa Portal Cliente</span>
                    <div className="h-36 border border-slate-800 rounded overflow-hidden flex flex-col" style={{ backgroundColor: portalColor }}>
                      {/* Header */}
                      <div className="border-b border-slate-800 p-2 flex justify-between items-center" style={{ backgroundColor: primaryColor, color: primaryColor === '#FFFFFF' ? '#0f172a' : '#ffffff' }}>
                        <div className="flex items-center gap-1.5">
                          {portalBgUrl ? <img src={portalBgUrl} alt="Portal Logo" className="h-3 w-auto object-contain max-w-[40px]" /> : <div className="w-2.5 h-2.5 rounded bg-accent-cyan" />}
                          <span className="font-bold text-[8px]">{portalName || "Portal Cliente"}</span>
                        </div>
                        <div className="h-2 bg-slate-800/40 rounded w-10" />
                      </div>
                      {/* Body */}
                      <div className="flex-1 bg-slate-900/50 p-3 space-y-2">
                        <div className="text-[7px] text-slate-300 font-semibold truncate">{welcomeMessage || "Bienvenido a su portal"}</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="h-8 border border-slate-800 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                            <span className="text-[5px] text-slate-400">Solicitudes</span>
                            <span className="text-[7px] font-bold text-accent-cyan">Activas</span>
                          </div>
                          <div className="h-8 border border-slate-800 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                            <span className="text-[5px] text-slate-400">Facturas</span>
                            <span className="text-[7px] font-bold text-accent-cyan">Ver</span>
                          </div>
                          <div className="h-8 border border-slate-800 bg-slate-950/40 rounded-sm flex flex-col justify-center items-center">
                            <span className="text-[5px] text-slate-400">Activos</span>
                            <span className="text-[7px] font-bold text-accent-cyan">Ficha</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BIBLIOTECA MULTIMEDIA */}
            {activeTab === "media" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                    [+] BIBLIOTECA MULTIMEDIA / STORAGE EN LINEA
                  </h2>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded text-xs font-bold uppercase tracking-wider text-accent-cyan hover:bg-slate-900 transition-colors font-mono">
                      {isUploadingMedia ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" /> Subir Archivo
                        </>
                      )}
                      <input 
                        type="file"
                        onChange={handleMediaLibraryUpload}
                        disabled={isUploadingMedia || loadingMedia}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Filter segments */}
                <div className="flex gap-2">
                  {["all", "images", "pdfs", "other"].map(filterVal => (
                    <button
                      key={filterVal}
                      type="button"
                      onClick={() => setMediaFilter(filterVal)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border transition-all ${
                        mediaFilter === filterVal 
                          ? "bg-slate-900 border-slate-700 text-accent-cyan" 
                          : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {filterVal === "all" ? "Todos" : filterVal === "images" ? "Imágenes" : filterVal === "pdfs" ? "PDFs" : "Otros"}
                    </button>
                  ))}
                </div>

                {loadingMedia ? (
                  <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" /> Cargando archivos de Storage...
                  </div>
                ) : filteredMediaItems.length === 0 ? (
                  <div className="border border-dashed border-slate-800 p-12 rounded text-center text-slate-500 font-mono text-xs">
                    No se encontraron archivos en esta categoría.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredMediaItems.map((media) => {
                      const isImage = media.mimeType?.startsWith("image/");
                      return (
                        <div key={media.id} className="bg-slate-950 border border-slate-850 rounded overflow-hidden group flex flex-col justify-between text-left">
                          <div className="h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden p-2">
                            {isImage ? (
                              <img src={media.fileUrl} alt={media.fileName} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <FileText className="w-12 h-12 text-slate-600" />
                            )}
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(media.fileUrl)}
                                className="p-2 bg-slate-900 border border-slate-855 rounded hover:border-slate-600 text-slate-300 hover:text-white"
                                title="Copiar URL"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a
                                href={media.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slate-900 border border-slate-855 rounded hover:border-slate-600 text-slate-300 hover:text-white"
                                title="Abrir enlace"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                          <div className="p-2.5 space-y-1.5 border-t border-slate-850 flex-1 flex flex-col justify-between bg-slate-900/10">
                            <div>
                              <div className="text-[10px] font-bold text-white font-mono truncate" title={media.fileName}>
                                {media.fileName}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono flex justify-between mt-1">
                                <span>{formatBytes(media.fileSize)}</span>
                                <span>{media.mimeType?.split("/")[1] || "unknown"}</span>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1.5 border-t border-slate-955">
                              <button
                                type="button"
                                onClick={() => handleDeleteMedia(media.id, media.fileUrl)}
                                className="p-1 hover:text-red-400 text-slate-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CATÁLOGO DE EQUIPOS */}
            {activeTab === "catalog" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                    [+] CATÁLOGO GENERAL DE EQUIPOS
                  </h2>
                  <button
                    type="button"
                    onClick={() => openCatalogModal()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-opacity-95 transition-colors font-mono"
                  >
                    <Plus className="w-4 h-4" /> Registrar Equipo
                  </button>
                </div>

                {loadingCatalog ? (
                  <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" /> Cargando catálogo de equipos...
                  </div>
                ) : catalogItems.length === 0 ? (
                  <div className="border border-dashed border-slate-800 p-12 rounded text-center text-slate-500 font-mono text-xs">
                    No hay equipos registrados en el catálogo. Utiliza el botón superior para agregar uno nuevo.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-sm">
                    <table className="w-full text-left font-mono text-[10px] border-collapse bg-slate-900/10">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Imagen</th>
                          <th className="py-3 px-4">Código (ID)</th>
                          <th className="py-3 px-4">Nombre</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4">Eficiencia</th>
                          <th className="py-3 px-4">Caudal / RPM</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-855 text-slate-300">
                        {catalogItems.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-900/20">
                            <td className="py-2.5 px-4">
                              <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded border border-slate-800 object-contain bg-slate-950" />
                            </td>
                            <td className="py-2.5 px-4 font-bold text-accent-cyan">{prod.id}</td>
                            <td className="py-2.5 px-4 font-bold text-white max-w-[200px] truncate">{prod.name}</td>
                            <td className="py-2.5 px-4 uppercase text-[9px] text-slate-400">{prod.category}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold">
                                {prod.eficiencia || "N/A"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-400">{prod.caudal || "N/A"} / {prod.rpm || "N/A"}</td>
                            <td className="py-2.5 px-4 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openCatalogModal(prod)}
                                className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-750 transition-colors uppercase font-bold text-[8px]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="px-2 py-1 bg-red-950/30 text-red-400 hover:text-red-300 rounded border border-red-900/30 transition-colors uppercase font-bold text-[8px]"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: CRM CONFIG */}
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
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-855 rounded-sm">
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
                            className="w-14 bg-slate-950 border border-slate-855 text-center p-1.5 text-xs text-white rounded font-mono"
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
                      className="flex-1 bg-slate-950 border border-slate-855 p-2 text-xs text-white rounded font-mono"
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

            {/* TAB 7: PORTAL CLIENTE */}
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

            {/* TAB 8: INTEGRACIONES */}
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

            {/* TAB 9: SEGURIDAD */}
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
            {activeTab !== "seguridad" && activeTab !== "media" && activeTab !== "catalog" && (
              <div className="border-t border-slate-800 pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetBranding}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-mono"
                >
                  <RefreshCw className="w-4 h-4" /> Restablecer Branding
                </button>
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

      {/* CATALOG PRODUCT FORM MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-sm w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8">
            <div className="flex justify-between items-center border-b border-slate-800 p-4 bg-slate-950/40">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                {editingProduct ? `[Editar] Equipo ${productForm.id}` : "[Registrar] Nuevo Equipo en Catálogo"}
              </span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Código Equipo (ID)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={productForm.id}
                    onChange={e => setProductForm(prev => ({ ...prev, id: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono disabled:opacity-50"
                    placeholder="Ej. AX-800"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. Ventilador Axial AX-800 Premium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Categoría</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  >
                    <option value="axiales">Ventiladores Axiales</option>
                    <option value="centrifugos">Ventiladores Centrífugos</option>
                    <option value="extractores">Extractores Industriales</option>
                    <option value="hvac">HVAC Industrial</option>
                    <option value="colectores">Colectores de Polvo</option>
                    <option value="ducteria">Ductería</option>
                    <option value="motores">Motores IE2 / IE3 / IE4</option>
                    <option value="tableros">Tableros Eléctricos</option>
                    <option value="sistemas">Sistemas de Extracción</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Eficiencia</label>
                  <select
                    value={productForm.eficiencia}
                    onChange={e => setProductForm(prev => ({ ...prev, eficiencia: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  >
                    <option value="IE2">IE2 Compliant</option>
                    <option value="IE3">IE3 Compliant</option>
                    <option value="IE4">IE4 Compliant</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">RPM</label>
                  <input
                    type="text"
                    value={productForm.rpm}
                    onChange={e => setProductForm(prev => ({ ...prev, rpm: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. 1,450 RPM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Caudal</label>
                  <input
                    type="text"
                    value={productForm.caudal}
                    onChange={e => setProductForm(prev => ({ ...prev, caudal: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. 10,889 CFM"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Presión</label>
                  <input
                    type="text"
                    value={productForm.presion}
                    onChange={e => setProductForm(prev => ({ ...prev, presion: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. 150 Pa"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Potencia</label>
                  <input
                    type="text"
                    value={productForm.potencia}
                    onChange={e => setProductForm(prev => ({ ...prev, potencia: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. 3.0 HP"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Voltaje</label>
                  <input
                    type="text"
                    value={productForm.voltaje}
                    onChange={e => setProductForm(prev => ({ ...prev, voltaje: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. 220/440 V"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Protección</label>
                  <input
                    type="text"
                    value={productForm.proteccion}
                    onChange={e => setProductForm(prev => ({ ...prev, proteccion: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. IP55 Clase F"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Normativas</label>
                  <input
                    type="text"
                    value={productForm.normas}
                    onChange={e => setProductForm(prev => ({ ...prev, normas: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                    placeholder="Ej. AMCA 210, RETIE, NTC 2050"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Material Constructivo</label>
                <input
                  type="text"
                  value={productForm.material}
                  onChange={e => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  placeholder="Ej. Aluminio Fundido al Silicio (Aspas ASTM B26)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Aplicación del Equipo</label>
                <textarea
                  rows={2}
                  value={productForm.aplicacion}
                  onChange={e => setProductForm(prev => ({ ...prev, aplicacion: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono resize-none"
                  placeholder="Ej. Inyección y extracción general en plantas avícolas."
                />
              </div>

              {/* Curve Points SVG represent */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Coordenadas de Curva SVG P vs Q</label>
                <input
                  type="text"
                  value={productForm.curvaPoints}
                  onChange={e => setProductForm(prev => ({ ...prev, curvaPoints: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  placeholder="M 10 90 Q 40 40, 90 10"
                />
              </div>

              {/* Image Input with library selector */}
              <div className="space-y-1 bg-slate-950/40 p-4 border border-slate-850 rounded">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Imagen Principal del Equipo</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    value={productForm.image}
                    onChange={e => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="URL de la imagen del equipo"
                    className="flex-grow bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaPickerForField("image")}
                    className="px-3 py-2 bg-slate-850 border border-slate-750 text-slate-300 hover:text-white rounded text-xs uppercase font-bold font-mono"
                  >
                    Seleccionar
                  </button>
                </div>
                {productForm.image && (
                  <div className="mt-2">
                    <img src={productForm.image} alt="Principal Preview" className="h-14 w-14 object-contain rounded border border-slate-800 bg-slate-950" />
                  </div>
                )}
              </div>

              {/* Product Gallery Manager */}
              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Galería Adicional de Imágenes del Equipo</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGalleryUrl}
                    onChange={e => setNewGalleryUrl(e.target.value)}
                    placeholder="Pegue URL de imagen adicional"
                    className="flex-grow bg-slate-950 border border-slate-850 p-2 text-xs text-white rounded font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaPickerForField("gallery")}
                    className="px-3 py-2 bg-slate-850 border border-slate-750 text-slate-300 hover:text-white rounded text-xs uppercase font-bold font-mono"
                  >
                    Elegir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToGallery(newGalleryUrl)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 text-accent-cyan hover:bg-slate-750 rounded text-xs uppercase font-bold font-mono"
                  >
                    Agregar
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2 mt-2">
                  {productForm.gallery?.map((url, idx) => (
                    <div key={idx} className="relative group h-12 border border-slate-800 bg-slate-950 rounded overflow-hidden flex items-center justify-center p-1">
                      <img src={url} alt={`Gallery ${idx}`} className="h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFromGallery(idx)}
                        className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!productForm.gallery || productForm.gallery.length === 0) && (
                    <span className="text-[8px] font-mono text-slate-500 col-span-6">No hay imágenes en la galería.</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-end gap-3 bg-slate-950/40 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2 bg-slate-855 border border-slate-750 text-slate-300 hover:text-white text-xs uppercase font-bold rounded font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent-cyan text-bg-primary text-xs uppercase font-bold rounded font-mono"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA SELECTOR DIALOG */}
      {showMediaPickerForField && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
            <div className="flex justify-between items-center border-b border-slate-800 p-4 bg-slate-950/40">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                [Seleccionar de Biblioteca Multimedia]
              </span>
              <button
                type="button"
                onClick={() => setShowMediaPickerForField(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {mediaItems.length === 0 ? (
                <div className="border border-dashed border-slate-800 p-12 rounded text-center text-slate-500 font-mono text-xs">
                  No hay archivos en la biblioteca. Suba imágenes en la pestaña "Biblioteca Multimedia" primero.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaItems.filter(item => item.mimeType?.startsWith("image/")).map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => {
                        if (showMediaPickerForField === "image") {
                          setProductForm(prev => ({ ...prev, image: media.fileUrl }));
                        } else if (showMediaPickerForField === "gallery") {
                          handleAddToGallery(media.fileUrl);
                        }
                        setShowMediaPickerForField(null);
                      }}
                      className="bg-slate-950 border border-slate-855 hover:border-accent-cyan hover:ring-1 hover:ring-accent-cyan/20 p-1.5 rounded overflow-hidden h-24 flex items-center justify-center transition-all group"
                      title={media.fileName}
                    >
                      <img src={media.fileUrl} alt={media.fileName} className="max-h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 p-4 flex justify-end bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowMediaPickerForField(null)}
                className="px-4 py-2 bg-slate-855 border border-slate-750 text-slate-300 hover:text-white text-xs uppercase font-bold rounded font-mono"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
