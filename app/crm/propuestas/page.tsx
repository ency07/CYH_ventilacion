import React from "react";
import { db } from "@/lib/db";
import { crmProposals, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { FileText, Download, Send, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default async function PropuestasPage() {
  const proposals = await db.select({
    proposal: crmProposals,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
    },
    companyName: crmCompanies.name
  })
  .from(crmProposals)
  .leftJoin(leads, eq(crmProposals.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmProposals.updatedAt));

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <FileText className="w-7 h-7 text-accent-cyan" /> 
            Cotizaciones y Propuestas
          </h1>
          <p className="text-sm text-text-muted mt-1">Gestión documental comercial, envíos y seguimiento de cierres.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar propuesta..." 
              className="pl-9 pr-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan shadow-sm w-full md:w-64"
            />
          </div>
          <button className="p-2 border border-border-subtle bg-bg-primary rounded-md text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-bg-primary border border-border-subtle rounded-md shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg-tertiary sticky top-0 z-10 border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Propuesta</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Prospecto / Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Valor Total</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Actualizado</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay propuestas generadas en el sistema.</p>
                </td>
              </tr>
            ) : (
              proposals.map(({ proposal, lead, companyName }) => (
                <tr key={proposal.id} className="hover:bg-bg-secondary/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-text-primary">{proposal.title}</span>
                    <p className="text-xs text-text-muted">v{proposal.version}.0</p>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/crm/${lead?.id}`} className="font-bold text-text-primary uppercase hover:text-accent-cyan transition-colors">
                      {companyName || lead?.fullName || 'Desconocido'}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-primary font-mono font-bold">
                      {formatCOP(proposal.totalValue)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                      proposal.status === 'aceptada' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      proposal.status === 'rechazada' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      proposal.status === 'enviada' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-bg-tertiary text-text-secondary border-border-subtle'
                    }`}>
                      {proposal.status === 'aceptada' && <CheckCircle2 className="w-3 h-3" />}
                      {proposal.status === 'rechazada' && <XCircle className="w-3 h-3" />}
                      {proposal.status === 'enviada' && <Send className="w-3 h-3" />}
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {proposal.pdfUrl && (
                        <a 
                          href={proposal.pdfUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-text-muted hover:text-accent-cyan transition-colors border border-transparent hover:border-accent-cyan/20 rounded"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <Link href={`/crm/${lead?.id}`} className="text-[10px] uppercase font-bold text-accent-cyan border border-accent-cyan/30 px-2 py-1 rounded hover:bg-accent-cyan hover:text-bg-primary transition-colors">
                        Ver Negocio
                      </Link>
                    </div>
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
