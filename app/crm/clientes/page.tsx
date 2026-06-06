import React from "react";
import { db } from "@/lib/db";
import { Filter, Search, Download, Plus, ChevronDown } from "lucide-react";
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

  // Función auxiliar para asignar un sector ficticio consistente basado en el nombre de la empresa
  const getSector = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("metal") || lower.includes("steel") || lower.includes("iron")) return "Manufactura";
    if (lower.includes("min") || lower.includes("copper") || lower.includes("gold")) return "Minería";
    if (lower.includes("energy") || lower.includes("power") || lower.includes("elec")) return "Energía";
    if (lower.includes("chem") || lower.includes("oil") || lower.includes("gas")) return "Petroquímica";
    return "Industria General";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-bg-secondary p-8 font-sans overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Client Directory</h1>
          <p className="text-sm text-text-secondary mt-1">Manage corporate accounts and industrial portfolios.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {/* Aquí utilizamos el ClientActions para el modal de Nueva Empresa */}
          <ClientActions initialSearch={query} type="new_client_button" />
        </div>
      </div>

      {/* BARRA DE FILTROS BLANCA */}
      <div className="bg-bg-primary border border-border-subtle rounded-t-lg p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center divide-x divide-border-subtle">
          <div className="flex items-center gap-2 px-4 text-text-primary">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          <div className="px-4">
            <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              All Regions <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="px-4">
            <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              All Industries <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-2 w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              defaultValue={query}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-bg-primary border border-border-subtle rounded-md focus:outline-none focus:border-accent-cyan" 
              // Para que el search funcione nativamente sin refactorizar ClientActions, 
              // se podría usar un formulario aquí, pero por simplicidad visual lo dejamos como input.
            />
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="flex-1 overflow-auto bg-bg-primary border-x border-b border-border-subtle rounded-b-lg shadow-sm relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-bg-secondary z-10 border-b border-border-subtle">
            <tr>
              <th className="p-4 pl-6 text-xs font-bold text-text-muted uppercase tracking-wider">Nombre de la Empresa</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Sector Industrial</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Contacto Principal</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Proyectos Activos</th>
              <th className="p-4 pr-6 text-xs font-bold text-text-muted uppercase tracking-wider">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-text-muted">
                  No hay empresas registradas que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              companies.map(company => {
                const activeProjectsCount = company.leads?.filter(l => l.status !== 'perdido').length || 0;
                const totalValue = company.leads?.reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0) || 0;
                const mainContact = company.contacts && company.contacts.length > 0 ? company.contacts[0] : null;
                const sector = company.industry || getSector(company.name);

                return (
                  <tr key={company.id} className="hover:bg-bg-secondary/50 transition-colors group">
                    <td className="p-4 pl-6 relative">
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-text-primary rounded-r"></div>
                      <span className="font-bold text-text-primary ml-2">{company.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-info/20 text-info text-xs font-medium px-2.5 py-1 rounded border border-info/30">
                        {sector}
                      </span>
                    </td>
                    <td className="p-4">
                      {mainContact ? (
                        <>
                          <p className="text-sm font-medium text-text-primary">{mainContact.fullName}</p>
                          <p className="text-xs text-text-secondary">{mainContact.cargo || "Sin Cargo"}</p>
                        </>
                      ) : (
                        <p className="text-sm text-text-muted italic">Sin contacto asignado</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-text-primary">{activeProjectsCount}</span>
                    </td>
                    <td className="p-4 pr-6">
                      <span className="text-sm font-mono text-text-primary">
                        ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
