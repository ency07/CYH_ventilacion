import React from "react";
import { db } from "@/lib/db";
import { Building2, Search, Filter, Phone, Mail, UserCircle, Briefcase, MapPin } from "lucide-react";
import { ilike } from "drizzle-orm";
import ClientActions from "./ClientActions";

export const dynamic = "force-dynamic";

export default async function B2BCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams?.q || "";

  const companies = await db.query.crmCompanies.findMany({
    where: query ? (fields, { ilike }) => ilike(fields.name, `%${query}%`) : undefined,
    with: {
      contacts: true,
      leads: true,
    },
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
  });

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">Directorio B2B</h1>
          <p className="text-sm text-text-muted mt-1">Gestión de empresas cliente y su estructura de contactos.</p>
        </div>
        
        <ClientActions initialSearch={query} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-border-subtle">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <Building2 className="w-12 h-12 mb-4 opacity-50" />
            <p>{query ? `No hay empresas que coincidan con "${query}".` : "No hay empresas registradas aún."}</p>
          </div>
        ) : (
          companies.map(company => (
            <div key={company.id} className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col xl:flex-row gap-6">
              
              {/* Información de Empresa */}
              <div className="xl:w-1/3 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-border-subtle pb-4 xl:pb-0 xl:pr-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-md">
                      <Building2 className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary uppercase">{company.name}</h2>
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {company.city || "Ciudad no registrada"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Proyectos Activos</span>
                      <span className="font-semibold text-text-primary">{company.leads?.filter(l => l.status !== 'perdido').length || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Valor Histórico</span>
                      <span className="font-semibold text-emerald-500">
                        ${((company.leads?.reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0) || 0) / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-subtle/50 text-right">
                  <button className="text-xs font-bold text-accent-cyan hover:text-accent-cyan/80 uppercase tracking-wider">Ver Ficha Completa &rarr;</button>
                </div>
              </div>

              {/* Directorio de Contactos (Personas) */}
              <div className="xl:w-2/3 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Contactos Clave ({company.contacts?.length || 0})</h3>
                  <ClientActions companyId={company.id} type="add_contact" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(!company.contacts || company.contacts.length === 0) ? (
                    <div className="col-span-2 text-xs text-text-muted italic py-4 bg-bg-secondary rounded border border-border-subtle text-center">
                      No hay contactos enlazados a esta empresa.
                    </div>
                  ) : (
                    company.contacts.map(contact => (
                      <div key={contact.id} className="p-3 bg-bg-secondary border border-border-subtle rounded flex flex-col gap-2 hover:border-accent-cyan/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-text-muted" />
                            <div>
                              <p className="text-xs font-bold text-text-primary">{contact.fullName}</p>
                              <p className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3"/> {contact.cargo || "Sin cargo"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 mt-1 border-t border-border-subtle/50 flex flex-col gap-1">
                          {contact.email && <p className="text-[10px] text-text-muted flex items-center gap-1.5"><Mail className="w-3 h-3"/> {contact.email}</p>}
                          {contact.phone && <p className="text-[10px] text-text-muted flex items-center gap-1.5"><Phone className="w-3 h-3"/> {contact.phone}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}
