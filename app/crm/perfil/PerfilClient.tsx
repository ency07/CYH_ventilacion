"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  User, Lock, Clock, Settings, Shield,
  Camera, Save, Eye, EyeOff, Check, AlertCircle,
  Loader2, Sun, Moon, Monitor, Globe, Bell,
  BellOff, Calendar, MapPin, Phone, Briefcase,
  Mail, ChevronRight, Activity, LogIn, Key
} from "lucide-react";
import {
  updateProfileAction,
  changePasswordAction,
  updateThemePreferenceAction,
  updateLanguagePreferenceAction,
} from "@/lib/server-actions/profile";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ─────────────────────────────────────────────────────────────────────
type CrmUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  position: string | null;
  isActive: boolean;
  createdAt: Date;
  preferences: { theme: string; language: string; notifications: boolean } | null;
  lastLoginAt: Date | null;
};

type AuthUser = {
  email?: string;
  createdAt?: string;
  lastSignInAt?: string;
  emailConfirmed: boolean;
};

type AuditEntry = {
  id: string;
  action: string;
  entityAffected: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
};

interface Props {
  user: CrmUser;
  authUser: AuthUser;
  auditHistory: AuditEntry[];
}

// ─── Role label map ────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  root_dev:          { label: "ROOT DEV",           color: "bg-red-900/30 text-red-400 border-red-800" },
  admin:             { label: "ADMINISTRADOR",       color: "bg-orange-900/30 text-orange-400 border-orange-800" },
  super_admin:       { label: "SUPER ADMIN",         color: "bg-orange-900/30 text-orange-400 border-orange-800" },
  director:          { label: "DIRECTOR",            color: "bg-violet-900/30 text-violet-400 border-violet-800" },
  director_comercial:{ label: "DIR. COMERCIAL",      color: "bg-violet-900/30 text-violet-400 border-violet-800" },
  vendedor:          { label: "VENDEDOR",            color: "bg-blue-900/30 text-blue-400 border-blue-800" },
  comercial:         { label: "COMERCIAL",           color: "bg-blue-900/30 text-blue-400 border-blue-800" },
  tecnico:           { label: "TÉCNICO",             color: "bg-emerald-900/30 text-emerald-400 border-emerald-800" },
  ingeniero:         { label: "INGENIERO",           color: "bg-emerald-900/30 text-emerald-400 border-emerald-800" },
  cliente:           { label: "CLIENTE",             color: "bg-slate-700/30 text-slate-400 border-slate-700" },
};

// ─── Avatar initials fallback ──────────────────────────────────────────────────
function Initials({ name, email }: { name?: string | null; email?: string }) {
  const src = name || email || "?";
  const parts = src.trim().split(/\s+/);
  const letters = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 flex items-center justify-center text-2xl font-bold text-white font-mono select-none">
      {letters}
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-sm border shadow-xl text-sm font-semibold font-mono animate-slide-up ${
      type === "success"
        ? "bg-emerald-950 border-emerald-700 text-emerald-300"
        : "bg-red-950 border-red-700 text-red-300"
    }`}>
      {type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PerfilClient({ user, authUser, auditHistory }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "editar" | "password" | "historial" | "preferencias">("perfil");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Profile edit state
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [position, setPosition] = useState(user.position || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

  // Password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleSaveProfile() {
    startTransition(async () => {
      const res = await updateProfileAction({ fullName, phone, position, avatarUrl });
      if (res.success) showToast("Perfil actualizado correctamente", "success");
      else showToast(res.error || "Error al guardar", "error");
    });
  }

  function handleChangePassword() {
    setPwdError("");
    if (newPwd.length < 8) { setPwdError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPwd !== confirmPwd) { setPwdError("Las contraseñas no coinciden"); return; }
    startTransition(async () => {
      const res = await changePasswordAction({ currentPassword: currentPwd, newPassword: newPwd });
      if (res.success) {
        showToast("Contraseña cambiada correctamente", "success");
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        setPwdError(res.error || "Error al cambiar contraseña");
      }
    });
  }

  async function handleThemeChange(t: "dark" | "light" | "system") {
    setTheme(t);
    await updateThemePreferenceAction(t);
  }

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role.toUpperCase(), color: "bg-slate-700/30 text-slate-400 border-slate-700" };

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: "perfil",       label: "Mi Perfil",      icon: User },
    { id: "editar",       label: "Editar Datos",   icon: Settings },
    { id: "password",     label: "Contraseña",     icon: Lock },
    { id: "historial",    label: "Historial",      icon: Clock },
    { id: "preferencias", label: "Preferencias",   icon: Shield },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-slate-950 font-sans">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Page header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <User className="h-4 w-4 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono">
              Perfil de Usuario
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {user.email}
            </p>
          </div>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem-5rem)] overflow-hidden">
        {/* Sidebar nav */}
        <aside className="w-52 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 flex flex-col py-4 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`perfil-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider font-mono transition-all duration-100 border-l-2 ${
                  active
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-900 dark:border-white text-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* ── TAB: Mi Perfil ─────────────────────────────────────────── */}
          {activeTab === "perfil" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-8">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                    ) : (
                      <Initials name={user.fullName} email={user.email} />
                    )}
                    <button
                      onClick={() => setActiveTab("editar")}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center border-2 border-white dark:border-slate-900 hover:opacity-80 transition-opacity"
                      title="Editar avatar"
                    >
                      <Camera className="h-3 w-3 text-white dark:text-slate-900" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {user.fullName || user.email.split("@")[0]}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
                    {user.position && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {user.position}
                      </p>
                    )}
                    {user.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {user.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { icon: Mail, label: "Correo", value: user.email },
                    { icon: Shield, label: "Rol", value: roleInfo.label },
                    { icon: Calendar, label: "Miembro desde", value: authUser.createdAt ? format(new Date(authUser.createdAt), "dd MMM yyyy", { locale: es }) : "—" },
                    { icon: Activity, label: "Último acceso", value: authUser.lastSignInAt ? format(new Date(authUser.lastSignInAt), "dd MMM yyyy HH:mm", { locale: es }) : "—" },
                    { icon: Check, label: "Email verificado", value: authUser.emailConfirmed ? "Sí ✓" : "No ✗" },
                    { icon: Activity, label: "Estado", value: user.isActive ? "Activo" : "Suspendido" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-sm p-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{label}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab("editar")}
                    className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-mono"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Editar información personal
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Editar Datos ───────────────────────────────────────── */}
          {activeTab === "editar" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono mb-6 flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" /> Datos Personales
                </h2>

                <div className="space-y-4">
                  {/* Email - read only */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono mb-1">
                      Correo Electrónico (solo lectura)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>

                  {/* Full name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      id="perfil-fullname"
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Ej. Juan Carlos Pérez"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Teléfono
                    </label>
                    <input
                      id="perfil-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+57 300 000 0000"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Cargo / Posición
                    </label>
                    <input
                      id="perfil-position"
                      type="text"
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      placeholder="Ej. Ingeniero de Ventas"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      URL de Avatar (imagen)
                    </label>
                    <input
                      id="perfil-avatar"
                      type="url"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                    {avatarUrl && (
                      <div className="mt-2">
                        <img src={avatarUrl} alt="preview" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>

                  <button
                    id="perfil-save-btn"
                    onClick={handleSaveProfile}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest font-mono rounded-sm transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Contraseña ─────────────────────────────────────────── */}
          {activeTab === "password" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono mb-6 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Cambiar Contraseña
                </h2>

                <div className="space-y-4">
                  {/* Current password */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        id="perfil-current-pwd"
                        type={showPwd ? "text" : "password"}
                        value={currentPwd}
                        onChange={e => setCurrentPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      id="perfil-new-pwd"
                      type={showPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                    {newPwd && (
                      <div className="mt-1.5 flex gap-1">
                        {[8, 12, 16].map(len => (
                          <div key={len} className={`h-1 flex-1 rounded-full transition-colors ${newPwd.length >= len ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                        ))}
                        <span className="text-[9px] text-slate-400 font-mono ml-1">
                          {newPwd.length < 8 ? "Débil" : newPwd.length < 12 ? "Media" : "Fuerte"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 font-mono mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      id="perfil-confirm-pwd"
                      type={showPwd ? "text" : "password"}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 transition-colors"
                    />
                  </div>

                  {pwdError && (
                    <div className="flex items-center gap-2 text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-sm px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {pwdError}
                    </div>
                  )}

                  <div className="pt-1 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-sm">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      ⚠ Después de cambiar la contraseña deberás iniciar sesión de nuevo en todos los dispositivos.
                    </p>
                  </div>

                  <button
                    id="perfil-change-pwd-btn"
                    onClick={handleChangePassword}
                    disabled={isPending || !currentPwd || !newPwd || !confirmPwd}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest font-mono rounded-sm transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                    {isPending ? "Cambiando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Historial de Acceso ─────────────────────────────────── */}
          {activeTab === "historial" && (
            <div className="max-w-3xl space-y-4">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Historial de Actividad
                  </h2>
                  <span className="text-[10px] text-slate-400 font-mono">{auditHistory.length} registros</span>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Activity className="h-8 w-8 mb-3 opacity-40" />
                    <p className="text-xs font-mono">Sin registros de actividad aún</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditHistory.map((entry) => (
                      <div key={entry.id} className="px-5 py-3 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {entry.action.includes("login") || entry.action.includes("access") ? (
                            <LogIn className="h-3.5 w-3.5 text-slate-500" />
                          ) : entry.action.includes("password") ? (
                            <Key className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Activity className="h-3.5 w-3.5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate">{entry.action.replace(/_/g, " ").toUpperCase()}</p>
                            <time className="text-[10px] text-slate-400 font-mono shrink-0">
                              {format(new Date(entry.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                            </time>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{entry.entityAffected}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">IP: {entry.ipAddress}</span>
                            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono truncate max-w-xs">{entry.userAgent.split(" ")[0]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Preferencias ───────────────────────────────────────── */}
          {activeTab === "preferencias" && (
            <div className="max-w-lg space-y-6">
              {/* Theme selector */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono mb-5 flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5" /> Apariencia
                </h2>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-4">
                  Selecciona el tema de la interfaz. La preferencia se guarda en tu perfil y persiste entre sesiones.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "light",  label: "Claro",  icon: Sun,     desc: "Fondo blanco" },
                    { id: "dark",   label: "Oscuro", icon: Moon,    desc: "Fondo oscuro" },
                    { id: "system", label: "Sistema", icon: Monitor, desc: "Automático" },
                  ] as const).map(({ id, label, icon: Icon, desc }) => {
                    const active = mounted ? theme === id : user.preferences?.theme === id;
                    return (
                      <button
                        key={id}
                        id={`theme-btn-${id}`}
                        onClick={() => handleThemeChange(id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-sm border-2 transition-all font-mono ${
                          active
                            ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`} />
                        <span className={`text-[10px] font-bold uppercase ${active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</span>
                        <span className="text-[9px] text-slate-400">{desc}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification preferences */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono mb-5 flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" /> Notificaciones
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Notificaciones del sistema</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Alertas de actividad, asignaciones y SLA</p>
                  </div>
                  <div className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm">
                    Próximamente
                  </div>
                </div>
              </div>

              {/* Language (placeholder) */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-sm p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white font-mono mb-5 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> Idioma
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select
                      disabled
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-400 font-mono cursor-not-allowed"
                    >
                      <option>Español (Colombia)</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm whitespace-nowrap">
                    Próximamente
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
