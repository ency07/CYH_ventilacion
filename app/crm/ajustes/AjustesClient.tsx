"use client";

import React, { useState } from "react";
import { User, Shield, Bell, Key, Save, Plus, Edit2, Trash2, Check } from "lucide-react";
import { updateCrmUserAction } from "@/lib/server-actions/users";

export default function AjustesClient({ currentUser, allUsers }: { currentUser: any, allUsers: any[] }) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  
  // Perfil Local State
  const [profileName, setProfileName] = useState(currentUser?.fullName || "");
  const [profileMessage, setProfileMessage] = useState("");

  const tabs = [
    { id: "perfil", label: "Mi Perfil", icon: User },
    { id: "equipo", label: "Equipo y Roles", icon: Shield },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "seguridad", label: "Seguridad", icon: Key },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileMessage("");
    const res = await updateCrmUserAction(currentUser.id, { fullName: profileName });
    setSaving(false);
    if (res.success) {
      setProfileMessage("Perfil actualizado con éxito.");
      setTimeout(() => setProfileMessage(""), 3000);
    } else {
      setProfileMessage("Error al guardar: " + res.error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateCrmUserAction(userId, { role: newRole });
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case "super_admin": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "director_comercial": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "asesor_comercial": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ingeniero_preventa": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const formatRoleName = (role: string) => {
    return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] bg-bg-secondary p-4 md:p-8 gap-6">
      
      {/* Sidebar de Ajustes */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-xl font-display font-bold text-text-primary uppercase tracking-wide mb-4 px-2">Ajustes</h1>
        
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors text-left ${
                isActive 
                  ? "bg-bg-primary border border-border-subtle text-accent-cyan shadow-sm" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-primary/50"
              }`}
            >
              <Icon className="w-5 h-5" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 bg-bg-primary border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col">
        
        {activeTab === "perfil" && (
          <div className="p-8">
            <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide mb-6">Información Personal</h2>
            
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-subtle">
              <div className="w-24 h-24 bg-bg-tertiary rounded-full border-2 border-border-medium flex items-center justify-center relative group cursor-pointer overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-text-muted">{profileName?.substring(0, 2).toUpperCase() || "CY"}</span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <button className="px-4 py-2 bg-bg-secondary border border-border-subtle text-xs font-bold uppercase tracking-wider rounded text-text-primary hover:border-accent-cyan transition-colors">
                  Cambiar Avatar
                </button>
                <p className="text-xs text-text-muted mt-2">Formatos permitidos: JPG, PNG o GIF. Máx 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nombre Completo</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Correo Electrónico</label>
                <input type="email" value={currentUser?.email || ""} disabled className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-2 text-sm text-text-muted cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Rol de Sistema</label>
                <input type="text" value={formatRoleName(currentUser?.role || "Sin Rol")} disabled className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-2 text-sm text-text-muted cursor-not-allowed font-semibold text-accent-cyan" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Zona Horaria</label>
                <select className="w-full bg-bg-secondary border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan">
                  <option>(GMT-05:00) Bogotá, Lima, Quito</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-end gap-4">
              {profileMessage && (
                <span className={`text-xs font-bold ${profileMessage.includes("Error") ? "text-red-500" : "text-emerald-500"} flex items-center gap-1`}>
                  {profileMessage.includes("Error") ? <Trash2 className="w-3 h-3" /> : <Check className="w-3 h-3" />} {profileMessage}
                </span>
              )}
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded-md hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "equipo" && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">Gestión de Usuarios y Roles</h2>
                <p className="text-xs text-text-muted mt-1">Administra los accesos y permisos según las jerarquías de Fase 1.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-subtle text-xs font-bold uppercase tracking-wider rounded-md hover:border-accent-cyan hover:text-text-primary transition-colors disabled:opacity-50">
                <Plus className="w-4 h-4" /> Invitar Usuario
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-bg-secondary border border-border-subtle rounded-md overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-tertiary border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-wider text-xs">Usuario</th>
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-wider text-xs">Rol de Fase 1</th>
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-wider text-xs text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-bg-tertiary/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-primary">{u.fullName || "Sin nombre"}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={u.role} 
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={!["super_admin", "root_dev"].includes(currentUser?.role)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border outline-none cursor-pointer ${getRoleBadgeColor(u.role)}`}
                          >
                            <option value="super_admin" className="bg-bg-primary text-text-primary">Super Admin</option>
                            <option value="director_comercial" className="bg-bg-primary text-text-primary">Director Comercial</option>
                            <option value="asesor_comercial" className="bg-bg-primary text-text-primary">Asesor Comercial</option>
                            <option value="ingeniero_preventa" className="bg-bg-primary text-text-primary">Ingeniero Preventa</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 text-text-muted hover:text-red-500 transition-colors ml-1" title="Revocar Acceso" disabled={!["super_admin", "root_dev"].includes(currentUser?.role) || currentUser?.id === u.id}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && (
                  <div className="p-6 text-center text-text-muted text-sm">No se encontraron usuarios en la base de datos.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "notificaciones" || activeTab === "seguridad") && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Shield className="w-16 h-16 text-border-medium mb-4" />
            <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide">Módulo en Construcción</h3>
            <p className="text-sm text-text-muted mt-2 max-w-sm">Esta sección estará disponible en la próxima actualización de la plataforma.</p>
          </div>
        )}
        
      </div>
    </div>
  );
}
