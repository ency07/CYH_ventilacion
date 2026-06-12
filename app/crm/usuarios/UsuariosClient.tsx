"use client";

import React, { useState } from "react";
import { 
  User, 
  Plus, 
  Search, 
  ShieldAlert, 
  Trash2, 
  UserMinus, 
  UserPlus, 
  Loader2, 
  Building, 
  Check, 
  X,
  Shield,
  Clock
} from "lucide-react";
import { 
  createCrmUserAction, 
  suspendCrmUserAction, 
  reactivateCrmUserAction, 
  deleteCrmUserAction 
} from "@/lib/server-actions/users";

export default function UsuariosClient({ 
  currentUser, 
  allUsers 
}: { 
  currentUser: any; 
  allUsers: any[] 
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  
  // New User Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("vendedor");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = 
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreating(true);

    try {
      const res = await createCrmUserAction(email, fullName, role, password);
      if (res.success) {
        setFormSuccess("Usuario creado exitosamente.");
        setEmail("");
        setFullName("");
        setRole("vendedor");
        setPassword("");
        // Reload after success
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
          window.location.reload();
        }, 1500);
      } else {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err.message || "Error al crear el usuario.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSuspend = async (user: any) => {
    setLoading(user.id);
    try {
      const action = user.isActive ? suspendCrmUserAction : reactivateCrmUserAction;
      const res = await action(user.id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar permanentemente este usuario? Esta acción es irreversible.")) {
      return;
    }
    setLoading(userId);
    try {
      const res = await deleteCrmUserAction(userId);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "root_dev": return "bg-purple-900/40 text-purple-300 border border-purple-500/20";
      case "admin": return "bg-red-900/40 text-red-300 border border-red-500/20";
      case "vendedor": return "bg-blue-900/40 text-blue-300 border border-blue-500/20";
      case "tecnico": return "bg-amber-900/40 text-amber-300 border border-amber-500/20";
      case "cliente": return "bg-emerald-900/40 text-emerald-300 border border-emerald-500/20";
      default: return "bg-slate-900/40 text-slate-300 border border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-cyan" />
            Administración de Usuarios
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
            Control de accesos y provisionamiento SaaS sin código
          </p>
        </div>

        {["root_dev", "admin", "super_admin"].includes(currentUser.role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" /> Crear Usuario
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 pl-10 pr-4 text-white text-xs placeholder:text-slate-600 focus:border-slate-500 focus:ring-0"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 px-3 text-white text-xs focus:border-slate-500 focus:ring-0"
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor / Comercial</option>
            <option value="tecnico">Técnico / Operario</option>
            <option value="cliente">Cliente Portal B2B</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 font-mono uppercase">
          <Building className="w-4 h-4 text-slate-500" />
          Tenant: <span className="text-white font-bold">{currentUser.tenantId ? currentUser.tenantId.substring(0, 8) : "Global (root_dev)"}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <th className="py-4 px-6">Usuario</th>
              <th className="py-4 px-6">Rol</th>
              <th className="py-4 px-6">Tenant ID</th>
              <th className="py-4 px-6">Estado</th>
              <th className="py-4 px-6">Creado El</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 uppercase tracking-widest font-mono">
                  Ningún usuario coincide con los filtros
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{u.fullName || "Sin nombre registrado"}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{u.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getRoleBadgeColor(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                    {u.tenantId ? u.tenantId : "Global / System"}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`flex items-center gap-1.5 font-bold ${u.isActive ? "text-emerald-400" : "text-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                      {u.isActive ? "ACTIVO" : "SUSPENDIDO"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(u.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Suspend/Reactivate Button */}
                      {u.id !== currentUser.id && u.role !== "root_dev" && (
                        <button
                          disabled={loading === u.id}
                          onClick={() => handleToggleSuspend(u)}
                          className={`p-1.5 rounded-sm border transition-colors ${
                            u.isActive 
                              ? "border-red-900/30 hover:border-red-600 bg-red-950/20 text-red-400" 
                              : "border-emerald-900/30 hover:border-emerald-600 bg-emerald-950/20 text-emerald-400"
                          }`}
                          title={u.isActive ? "Suspender Usuario" : "Reactivar Usuario"}
                        >
                          {loading === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.isActive ? (
                            <UserMinus className="w-3.5 h-3.5" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Delete Button (root_dev only) */}
                      {currentUser.role === "root_dev" && u.id !== currentUser.id && (
                        <button
                          disabled={loading === u.id}
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-sm border border-red-900/30 hover:border-red-600 bg-red-950/20 text-red-400 transition-colors"
                          title="Eliminar permanentemente"
                        >
                          {loading === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-sm shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-cyan" />
              Crear Nuevo Usuario
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-600/30 text-red-200 text-xs rounded-sm text-center font-mono">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-600/30 text-emerald-200 text-xs rounded-sm text-center">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@cyh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 px-3 text-white text-xs focus:border-slate-500 focus:ring-0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Carlos Alberto Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 px-3 text-white text-xs focus:border-slate-500 focus:ring-0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Rol del Sistema</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 px-3 text-white text-xs focus:border-slate-500 focus:ring-0"
                >
                  <option value="vendedor">Vendedor / Asesor Comercial</option>
                  <option value="tecnico">Técnico de Servicio</option>
                  <option value="admin">Administrador del Tenant</option>
                  <option value="cliente">Cliente Portal B2B</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Contraseña (Mínimo 6 caracteres)</label>
                <input
                  type="password"
                  placeholder="Dejar vacío para contraseña por defecto (CYH123456!)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm py-2 px-3 text-white text-xs focus:border-slate-500 focus:ring-0 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 mt-6"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Crear Perfil <Check className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
