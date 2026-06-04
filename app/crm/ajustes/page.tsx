"use client";

import React, { useState } from "react";
import { Settings, User, Shield, Sliders, Puzzle } from "lucide-react";

export default function AjustesPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  const tabs = [
    { id: "perfil", name: "Mi Perfil", icon: User },
    { id: "roles", name: "Roles y Permisos", icon: Shield },
    { id: "pipeline", name: "Etapas del Pipeline", icon: Sliders },
    { id: "integraciones", name: "Integraciones", icon: Puzzle },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
          <Settings className="w-7 h-7 text-text-muted" /> 
          Configuración Global
        </h1>
        <p className="text-sm text-text-muted mt-1">Administra tu perfil, permisos del equipo y parámetros del CRM.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors text-left ${
                activeTab === tab.id 
                  ? "bg-bg-primary border border-border-subtle text-accent-cyan shadow-sm" 
                  : "text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-accent-cyan" : "text-text-muted"}`} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-bg-primary border border-border-subtle rounded-md shadow-sm p-6 overflow-y-auto">
          
          {activeTab === "perfil" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-text-primary mb-6 border-b border-border-subtle pb-2">Mi Perfil</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-bg-secondary border border-border-subtle rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-text-muted" />
                  </div>
                  <button className="px-4 py-2 bg-bg-secondary border border-border-subtle rounded text-xs font-bold text-text-primary hover:border-accent-cyan transition-colors">
                    Cambiar Avatar
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Nombre Completo</label>
                    <input type="text" className="w-full bg-bg-secondary border border-border-subtle rounded p-2.5 text-sm text-text-primary" defaultValue="Administrador CYH" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Correo Electrónico</label>
                    <input type="email" className="w-full bg-bg-secondary border border-border-subtle rounded p-2.5 text-sm text-text-primary opacity-50" defaultValue="admin@cyh.com" disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Nueva Contraseña</label>
                  <input type="password" className="w-full bg-bg-secondary border border-border-subtle rounded p-2.5 text-sm text-text-primary" placeholder="••••••••" />
                </div>

                <button className="px-6 py-2.5 bg-accent-cyan text-bg-primary rounded font-bold text-sm hover:opacity-90 transition-opacity">
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-6 border-b border-border-subtle pb-2">Gestión de Roles</h2>
              <p className="text-sm text-text-muted mb-4">Solo el Super Administrador puede modificar estos permisos.</p>
              
              <div className="border border-border-subtle rounded-md overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-bg-secondary border-b border-border-subtle">
                    <tr>
                      <th className="p-3 text-xs font-bold text-text-muted uppercase">Rol</th>
                      <th className="p-3 text-xs font-bold text-text-muted uppercase">Nivel de Acceso</th>
                      <th className="p-3 text-xs font-bold text-text-muted uppercase text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    <tr>
                      <td className="p-3 text-sm font-bold text-text-primary">Super Admin</td>
                      <td className="p-3 text-xs text-text-secondary">Acceso Total</td>
                      <td className="p-3 text-right"><button className="text-xs text-text-muted hover:text-accent-cyan">Editar</button></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-bold text-text-primary">Director Comercial</td>
                      <td className="p-3 text-xs text-text-secondary">Dashboard, Todos los Leads</td>
                      <td className="p-3 text-right"><button className="text-xs text-text-muted hover:text-accent-cyan">Editar</button></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-bold text-text-primary">Asesor Comercial</td>
                      <td className="p-3 text-xs text-text-secondary">Solo Leads Asignados</td>
                      <td className="p-3 text-right"><button className="text-xs text-text-muted hover:text-accent-cyan">Editar</button></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm font-bold text-text-primary">Ingeniero Preventa</td>
                      <td className="p-3 text-xs text-text-secondary">Diagnósticos y Revisiones</td>
                      <td className="p-3 text-right"><button className="text-xs text-text-muted hover:text-accent-cyan">Editar</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === "pipeline" || activeTab === "integraciones") && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sliders className="w-12 h-12 text-border-medium mb-4" />
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide">Próximamente</h3>
              <p className="text-sm text-text-muted max-w-sm mt-2">Esta sección está en construcción para la fase administrativa avanzada.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
