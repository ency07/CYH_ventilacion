"use client";

import React from "react";
import { UsersRound, Building, Wrench, BarChart2, Mail, ShieldAlert, Award } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  tenantId: string | null;
}

export default function EquipoClient({ 
  currentUser, 
  allUsers 
}: { 
  currentUser: any; 
  allUsers: UserProfile[] 
}) {
  // Map roles to departments
  const getDepartment = (role: string) => {
    switch (role) {
      case "root_dev":
      case "admin":
      case "super_admin":
      case "director":
        return "Dirección";
      case "tecnico":
      case "ingeniero":
        return "Ingeniería";
      case "comercial":
      case "vendedor":
      case "asesor_comercial":
        return "Ventas";
      default:
        return "Otros";
    }
  };

  const depts = {
    "Dirección": {
      name: "Dirección General & Operaciones",
      icon: Award,
      color: "text-purple-400 border-purple-500/30 bg-purple-950/20",
      users: allUsers.filter(u => getDepartment(u.role) === "Dirección")
    },
    "Ingeniería": {
      name: "Ingeniería de Flujo & Operaciones de Campo",
      icon: Wrench,
      color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
      users: allUsers.filter(u => getDepartment(u.role) === "Ingeniería")
    },
    "Ventas": {
      name: "Ventas & Desarrollo de Negocios CRM",
      icon: BarChart2,
      color: "text-blue-400 border-blue-500/30 bg-blue-950/20",
      users: allUsers.filter(u => getDepartment(u.role) === "Ventas")
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-8 gap-6 font-sans">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <UsersRound className="w-6 h-6 text-accent-cyan" />
          Estructura Relacional del Equipo
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">
          Distribución organizativa de los miembros del equipo B2B por departamento
        </p>
      </div>

      {/* Grid organigram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
        {(Object.keys(depts) as Array<keyof typeof depts>).map((key) => {
          const dept = depts[key];
          const Icon = dept.icon;
          return (
            <div key={key} className="flex flex-col gap-4">
              {/* Department Header */}
              <div className={`p-4 border rounded-sm flex items-center gap-3 ${dept.color}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white">{key}</h2>
                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{dept.name}</p>
                </div>
                <span className="ml-auto font-mono text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                  {dept.users.length}
                </span>
              </div>

              {/* Connecting line spacer (SCADA tree feel) */}
              <div className="h-2 w-1/2 border-r border-slate-800 self-start lg:block hidden" />

              {/* Cards list */}
              <div className="flex flex-col gap-4">
                {dept.users.length === 0 ? (
                  <div className="border border-dashed border-slate-850 p-6 text-center text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                    Sin personal asignado
                  </div>
                ) : (
                  dept.users.map((u) => (
                    <div 
                      key={u.id} 
                      className={`border bg-slate-900/40 p-4 rounded-sm space-y-3 relative overflow-hidden transition-all ${
                        u.id === currentUser.id 
                          ? "border-accent-cyan/40 shadow-[0_0_15px_rgba(0,212,255,0.05)] bg-slate-900/60" 
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Active/Suspended indicator */}
                      <span className={`absolute top-0 right-0 w-2 h-2 ${
                        u.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`} />

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-white text-xs uppercase font-mono">
                          {u.fullName?.substring(0, 2) || u.email.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            {u.fullName || "Sin nombre"}
                          </h3>
                          <span className="text-[9px] font-mono font-bold text-accent-cyan uppercase tracking-widest bg-accent-cyan-soft px-1.5 py-0.5 rounded-sm">
                            {u.role.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {u.email}
                        </span>
                        <span className={u.isActive ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                          {u.isActive ? "ONLINE" : "OFF"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
