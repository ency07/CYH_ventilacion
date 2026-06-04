import React from "react";
import { db } from "@/lib/db";
import { crmUsers, leads, crmPipeline } from "@/lib/db/schema";
import { UsersRound, Activity, Mail, Phone, ShieldCheck, Briefcase } from "lucide-react";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EquipoComercialPage() {
  const users = await db.select().from(crmUsers);
  const pipelines = await db.select().from(crmPipeline);
  const allLeads = await db.select().from(leads);

  // Mapear carga de trabajo por asesor
  const teamStats = users.map(user => {
    // Buscar pipelines asignados a este usuario
    const userPipelines = pipelines.filter(p => p.assignedTo === user.email);
    const assignedLeadIds = new Set(userPipelines.map(p => p.leadId));
    
    // Buscar leads reales de esos pipelines
    const userLeads = allLeads.filter(l => assignedLeadIds.has(l.id));
    
    const activeLeads = userLeads.filter(l => l.status !== 'ganado' && l.status !== 'perdido').length;
    const wonLeads = userLeads.filter(l => l.status === 'ganado').length;
    
    const winRate = userLeads.length > 0 ? ((wonLeads / userLeads.length) * 100).toFixed(1) : "0.0";

    return {
      ...user,
      activeLeads,
      wonLeads,
      winRate,
      totalLeads: userLeads.length
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <UsersRound className="w-7 h-7 text-accent-cyan" /> 
            Equipo Comercial
          </h1>
          <p className="text-sm text-text-muted mt-1">Carga de trabajo, rendimiento y gestión de asesores B2B.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamStats.map((member) => (
          <div key={member.id} className="bg-bg-primary border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform">
            <div className="p-6 border-b border-border-subtle flex items-start gap-4">
              <div className="w-12 h-12 bg-bg-secondary border border-border-subtle rounded-full flex items-center justify-center uppercase font-bold text-lg text-text-primary">
                {member.fullName?.charAt(0) || member.email.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-text-primary truncate">{member.fullName || 'Asesor Sin Nombre'}</h3>
                <p className="text-xs text-text-muted truncate">{member.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary border border-border-subtle rounded text-[10px] font-bold uppercase text-text-secondary">
                  {member.role === 'admin' ? <ShieldCheck className="w-3 h-3 text-accent-cyan" /> : <Briefcase className="w-3 h-3 text-emerald-500" />}
                  {member.role}
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4 flex-1 bg-bg-secondary/20">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted mb-1">Leads Activos</span>
                <span className="text-2xl font-display font-bold text-blue-500">{member.activeLeads}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-text-muted mb-1">Win Rate</span>
                <span className="text-2xl font-display font-bold text-emerald-500">{member.winRate}%</span>
              </div>
            </div>

            <div className="p-4 border-t border-border-subtle bg-bg-primary flex justify-between items-center text-xs text-text-muted">
              <span>Total histórico: {member.totalLeads}</span>
              <span className="flex items-center gap-1 hover:text-accent-cyan cursor-pointer transition-colors">
                <Activity className="w-3 h-3" /> Ver Detalle
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
