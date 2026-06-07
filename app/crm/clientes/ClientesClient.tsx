"use client";

import React, { useState } from "react";
import { Filter, Search, Download, Plus, ChevronDown, Building2 } from "lucide-react";
import ClientActions from "./ClientActions";

const getSector = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("metal") || lower.includes("steel") || lower.includes("iron")) return "Manufactura";
  if (lower.includes("min") || lower.includes("copper") || lower.includes("gold")) return "Minería";
  if (lower.includes("energy") || lower.includes("power") || lower.includes("elec")) return "Energía";
  if (lower.includes("chem") || lower.includes("oil") || lower.includes("gas")) return "Petroquímica";
  return "Industria General";
};

export default function ClientesClient({ 
  companies, 
  userRole = "comercial",
  isAdmin = false 
}: { 
  companies: any[], 
  userRole?: string,
  isAdmin?: boolean 
}) {
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);

  // Extract unique cities and industries for the dropdown filter options
  const uniqueRegions = Array.from(new Set(companies.map(c => c.city).filter(Boolean)));
  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry || getSector(c.name)).filter(Boolean)));

  const filteredCompanies = companies.filter(company => {
    const sector = company.industry || getSector(company.name);
    const matchesSearch = company.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = filterRegion === "all" || company.city === filterRegion;
    const matchesIndustry = filterIndustry === "all" || sector === filterIndustry;
    return matchesSearch && matchesRegion && matchesIndustry;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Nombre de Empresa", "Ciudad/Region", "Sector Industrial", "Contacto Principal", "Cargo Contacto", "Proyectos Activos", "Valor de Cartera"];
    const rows = filteredCompanies.map(c => {
      const activeProjectsCount = c.leads?.filter((l: any) => l.status !== 'perdido').length || 0;
      const totalValue = c.leads?.reduce((sum: number, l: any) => sum + (l.estimatedBudgetMax || 0), 0) || 0;
      const mainContact = c.contacts && c.contacts.length > 0 ? c.contacts[0] : null;
      const sector = c.industry || getSector(c.name);
      return [
        c.id,
        c.name,
        c.city || "No Registrada",
        sector,
        mainContact ? mainContact.fullName : "Sin contacto",
        mainContact ? (mainContact.cargo || "Sin Cargo") : "",
        activeProjectsCount,
        totalValue
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `empresas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {isAdmin && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <ClientActions type="new_client_button" />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-bg-primary border border-border-subtle rounded-t-lg p-2 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center divide-x divide-border-subtle">
          <div className="flex items-center gap-2 px-4 text-text-primary">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          {/* Region Filter */}
          <div className="px-4 relative">
            <button 
              onClick={() => { setRegionDropdownOpen(!regionDropdownOpen); setIndustryDropdownOpen(false); }}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors capitalize font-medium"
            >
              {filterRegion === "all" ? "Todas las Regiones" : filterRegion} <ChevronDown className="w-4 h-4" />
            </button>
            {regionDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRegionDropdownOpen(false)} />
                <div className="absolute left-4 top-full mt-2 w-48 bg-bg-primary border border-border-subtle rounded shadow-lg z-40 py-1">
                  <button 
                    onClick={() => { setFilterRegion("all"); setRegionDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-medium"
                  >
                    Todas las Regiones
                  </button>
                  {uniqueRegions.map((region: string) => (
                    <button 
                      key={region}
                      onClick={() => { setFilterRegion(region); setRegionDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-medium capitalize"
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Industry Filter */}
          <div className="px-4 relative">
            <button 
              onClick={() => { setIndustryDropdownOpen(!industryDropdownOpen); setRegionDropdownOpen(false); }}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors capitalize font-medium"
            >
              {filterIndustry === "all" ? "Todos los Sectores" : filterIndustry} <ChevronDown className="w-4 h-4" />
            </button>
            {industryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIndustryDropdownOpen(false)} />
                <div className="absolute left-4 top-full mt-2 w-48 bg-bg-primary border border-border-subtle rounded shadow-lg z-40 py-1">
                  <button 
                    onClick={() => { setFilterIndustry("all"); setIndustryDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-medium"
                  >
                    Todos los Sectores
                  </button>
                  {uniqueIndustries.map((ind: string) => (
                    <button 
                      key={ind}
                      onClick={() => { setFilterIndustry(ind); setIndustryDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-medium"
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-2 w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-bg-secondary border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan" 
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
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-text-muted">
                  No hay empresas registradas que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filteredCompanies.map(company => {
                const activeProjectsCount = company.leads?.filter((l: any) => l.status !== 'perdido').length || 0;
                const totalValue = company.leads?.reduce((sum: number, l: any) => sum + (l.estimatedBudgetMax || 0), 0) || 0;
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
