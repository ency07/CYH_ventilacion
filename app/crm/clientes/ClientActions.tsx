"use client";

import React, { useState } from "react";
import { Search, Filter, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCompanyAction, createContactAction } from "@/lib/server-actions/crm";

interface Props {
  initialSearch?: string;
  type?: "main_actions" | "add_contact" | "new_client_button";
  companyId?: string;
}

export default function ClientActions({ initialSearch = "", type = "main_actions", companyId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Company Form State
  const [cName, setCName] = useState("");
  const [cCity, setCCity] = useState("");
  
  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactCargo, setContactCargo] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/crm/clientes?q=${encodeURIComponent(search)}`);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await createCompanyAction({ name: cName, city: cCity });
    setLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setCName(""); setCCity("");
    } else {
      setError(res.error);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setLoading(true);
    setError("");
    const res = await createContactAction({
      companyId,
      fullName: contactName,
      cargo: contactCargo,
      email: contactEmail,
      phone: contactPhone
    });
    setLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setContactName(""); setContactCargo(""); setContactEmail(""); setContactPhone("");
    } else {
      setError(res.error);
    }
  };

  if (type === "add_contact") {
    return (
      <>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-bold uppercase px-2 py-1 bg-bg-secondary border border-border-subtle rounded text-text-secondary hover:text-text-primary transition-colors"
        >
          + Añadir Contacto
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide mb-4">Nuevo Contacto</h3>
              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Nombre Completo *</label>
                  <input required value={contactName} onChange={e => setContactName(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Cargo</label>
                  <input value={contactCargo} onChange={e => setContactCargo(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Email</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Teléfono</label>
                    <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full py-2 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded mt-4 hover:opacity-90 transition-opacity">
                  {loading ? "Guardando..." : "Crear Contacto"}
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  if (type === "new_client_button") {
    return (
      <>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-text-primary text-bg-primary text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors shadow-md flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Client
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide mb-4">Nueva Empresa</h3>
              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Nombre de la Empresa *</label>
                  <input required value={cName} onChange={e => setCName(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Ciudad</label>
                  <input value={cCity} onChange={e => setCCity(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
                </div>
                <button disabled={loading} type="submit" className="w-full py-2 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded mt-4 hover:opacity-90 transition-opacity">
                  {loading ? "Guardando..." : "Registrar Empresa"}
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-cyan transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa..." 
            className="pl-9 pr-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan shadow-sm w-full md:w-64"
          />
        </form>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded-md hover:bg-text-secondary transition-colors shadow-md">
          + Nueva Empresa
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide mb-4">Nueva Empresa</h3>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Nombre de la Empresa *</label>
                <input required value={cName} onChange={e => setCName(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Ciudad</label>
                <input value={cCity} onChange={e => setCCity(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan" />
              </div>
              <button disabled={loading} type="submit" className="w-full py-2 bg-accent-cyan text-bg-primary text-xs font-bold uppercase tracking-wider rounded mt-4 hover:opacity-90 transition-opacity">
                {loading ? "Guardando..." : "Registrar Empresa"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
