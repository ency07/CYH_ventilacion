import React from "react";
import { getAllLeadsWithCrmDataAction } from "@/lib/server-actions/crm";
import { Inbox, Filter, Search, Plus } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { success, data: leads } = await getAllLeadsWithCrmDataAction();
  const safeLeads = success ? (leads || []) : [];

  // Filter out leads that are "ganado" (won) because they should be in Clientes, not Leads inbox
  const activeLeads = safeLeads.filter(l => l.status !== "ganado");

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <Inbox className="w-7 h-7 text-accent-cyan" /> 
            Bandeja de Leads
          </h1>
          <p className="text-sm text-text-muted mt-1">Prospectos nuevos, contactos iniciales y diagnósticos pendientes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar lead por nombre..." 
              className="pl-9 pr-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan shadow-sm w-full md:w-64"
            />
          </div>
          <button className="p-2 border border-border-subtle bg-bg-primary rounded-md text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#00D1D1] transition-colors shadow-md">
            <Plus className="w-4 h-4" /> Ingresar Lead
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-bg-primary border border-border-subtle rounded-md shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg-tertiary sticky top-0 z-10 border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Prospecto / Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Servicio de Interés</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Ingreso</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {activeLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>La bandeja de entrada está limpia.</p>
                </td>
              </tr>
            ) : (
              activeLeads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-bg-secondary/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-text-primary uppercase">{lead.fullName}</p>
                    <p className="text-xs text-text-muted">{lead.companyName} &bull; {lead.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                      lead.status === 'nuevo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      lead.status === 'contacto' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      lead.status === 'perdido' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-primary uppercase font-mono">{lead.serviceType}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/crm/${lead.id}`} 
                      className="px-3 py-1.5 text-xs font-bold bg-bg-tertiary text-text-primary border border-border-subtle rounded hover:border-accent-cyan hover:text-accent-cyan transition-colors"
                    >
                      Ver Detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
