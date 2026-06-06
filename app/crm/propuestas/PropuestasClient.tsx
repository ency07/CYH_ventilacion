"use client";

import React, { useState } from "react";
import { FileText, Plus, Search, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateProposalStatusAction } from "@/lib/server-actions/crm";

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function PropuestasClient({ proposalsData, userRole = "comercial" }: { proposalsData: any[], userRole?: string }) {
  const [selectedPropId, setSelectedPropId] = useState<string | null>(proposalsData.length > 0 ? proposalsData[0].proposal.id : null);
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredProposals = proposalsData.filter(p => 
    p.proposal.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProposal = proposalsData.find(p => p.proposal.id === selectedPropId);

  const canApprove = ["admin", "super_admin", "director_comercial"].includes(userRole);

  const handleApprove = async () => {
    if (!selectedProposal || !canApprove || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await updateProposalStatusAction(selectedProposal.proposal.id, "aceptada");
      if (res.success) {
        alert("¡Propuesta aprobada exitosamente!");
        window.location.reload();
      } else {
        alert(`Error al aprobar propuesta: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error al aprobar propuesta: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptada': return <span className="bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">ACEPTADA</span>;
      case 'rechazada': return <span className="bg-danger/10 text-danger border border-danger/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">RECHAZADA</span>;
      case 'enviada': return <span className="bg-info/10 text-info px-2 py-0.5 rounded text-[10px] font-bold uppercase">ENVIADA</span>;
      case 'negociacion': return <span className="bg-text-primary text-bg-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">NEGOCIACIÓN</span>;
      default: return <span className="bg-bg-primary text-text-primary border border-border-subtle px-2 py-0.5 rounded text-[10px] font-bold uppercase">BORRADOR</span>;
    }
  };


  return (
    <div className="flex flex-col md:flex-row h-full bg-bg-primary overflow-hidden font-sans border-t border-border-subtle">
      
      {/* LEFT PANEL: PROPOSALS LIST */}
      <div className="w-full md:w-[40%] flex flex-col border-r border-border-subtle bg-bg-primary z-10 shrink-0">
        
        {/* Header List */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Propuestas Activas</h1>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-text-primary text-bg-primary rounded text-xs font-bold hover:bg-opacity-90 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> NEW PROPOSAL
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-subtle bg-bg-secondary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar propuestas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-primary border border-border-subtle rounded-md focus:outline-none focus:border-text-primary" 
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[15%_45%_25%_15%] gap-2 px-4 py-3 bg-bg-secondary border-b border-border-subtle text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div>VER</div>
          <div>PROYECTO / CLIENTE</div>
          <div className="text-right pr-2">MONTO (USD)</div>
          <div className="text-right pr-4">ESTADO</div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredProposals.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">No proposals found.</div>
          ) : (
            filteredProposals.map(item => {
              const isActive = item.proposal.id === selectedPropId;
              return (
                <div 
                  key={item.proposal.id} 
                  onClick={() => setSelectedPropId(item.proposal.id)}
                  className={`grid grid-cols-[15%_45%_25%_15%] gap-2 px-4 py-4 border-b border-border-subtle cursor-pointer transition-colors items-center ${
                    isActive ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'
                  }`}
                >
                  <div>
                    <span className="bg-bg-primary border border-border-subtle text-text-primary text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                      V{item.proposal.version}.0
                    </span>
                  </div>
                  <div className="pr-2">
                    <p className="font-bold text-text-primary text-sm truncate">{item.proposal.title}</p>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">
                      {item.companyName || item.lead?.fullName || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right pr-2">
                    <span className="font-mono text-xs font-medium text-text-primary">
                      {formatUSD(item.proposal.totalValue || 0)}
                    </span>
                  </div>
                  <div className="text-right flex justify-end">
                    {getStatusBadge(item.proposal.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-subtle bg-bg-primary flex items-center justify-between text-xs text-text-secondary">
          <span>Mostrando {filteredProposals.length} de {proposalsData.length} propuestas</span>
          <div className="flex gap-1">
            <button className="p-1 border border-border-subtle rounded bg-bg-primary hover:bg-bg-secondary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 border border-border-subtle rounded bg-bg-primary hover:bg-bg-secondary">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: DOCUMENT VIEWER */}
      <div className="w-full md:w-[60%] flex flex-col bg-bg-tertiary relative">
        {selectedProposal ? (
          <>
            {/* Viewer Header */}
            <div className="px-6 py-4 bg-[#e8edf5] border-b border-[#d1d9e6] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-text-secondary" />
                <div>
                  <h2 className="text-sm font-bold text-[#041627]">{selectedProposal.proposal.title} - V{selectedProposal.proposal.version}.0.pdf</h2>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Last updated: {format(new Date(selectedProposal.proposal.updatedAt), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
              
              {/* Fake PDF Paper */}
              <div className="w-full max-w-[800px] bg-bg-primary shadow-md border border-[#d1d9e6] p-12 aspect-[1/1.4] flex flex-col relative shrink-0">
                <h1 className="text-2xl font-black tracking-tighter text-[#0b1c30]">CYH INDUSTRIAL</h1>
                <p className="text-[10px] tracking-widest text-text-secondary uppercase mb-16">Advanced Engineering Systems</p>

                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Commercial Proposal For:</p>
                <h2 className="text-4xl font-bold text-[#041627] leading-tight max-w-[80%]">{selectedProposal.proposal.title}</h2>
                <p className="text-sm text-text-secondary mt-4">{format(new Date(selectedProposal.proposal.createdAt), "MMMM do, yyyy")}</p>

                <div className="flex mt-20 gap-16 border-t border-text-primary pt-6">
                  <div className="flex-1">
                    <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider mb-4">Client Information</h3>
                    <p className="text-sm font-bold text-[#0b1c30]">{selectedProposal.companyName || selectedProposal.lead?.fullName || 'Client Name'}</p>
                    <p className="text-xs text-text-secondary mt-1">Tech Park, Bldg 4, Sector 7</p>
                    <p className="text-xs text-text-secondary mt-1">Attn: Eng. {selectedProposal.lead?.fullName}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider mb-4">Project Lead</h3>
                    <p className="text-sm font-bold text-[#0b1c30]">Johnathan Doe</p>
                    <p className="text-xs text-text-secondary mt-1">Senior Project Manager</p>
                    <p className="text-xs text-text-secondary mt-1">j.doe@cyh-industrial.com</p>
                  </div>
                </div>

                <div className="mt-16 border-t border-border-medium pt-6">
                  <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-wider mb-4">Resumen Ejecutivo</h3>
                  <div className="h-4 bg-bg-secondary rounded w-full mb-2"></div>
                  <div className="h-4 bg-bg-secondary rounded w-11/12 mb-2"></div>
                  <div className="h-4 bg-bg-secondary rounded w-10/12"></div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="w-full max-w-[800px] mt-8 bg-bg-primary border border-[#d1d9e6] rounded-t-lg p-6 shadow-sm mb-20 shrink-0">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-6">Historial de Comentarios</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded bg-[#e8edf5] text-text-secondary flex items-center justify-center text-xs font-bold shrink-0">SJ</div>
                    <div>
                      <p className="text-xs"><span className="font-bold text-text-primary">Sarah Jenkins</span> <span className="text-text-muted ml-1">Ventas</span></p>
                      <p className="text-sm text-text-secondary mt-1">Client requested a revision on the sensor placement for the main intake valve.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded bg-[#0b1c30] text-white flex items-center justify-center text-xs font-bold shrink-0">JD</div>
                    <div>
                      <p className="text-xs"><span className="font-bold text-text-primary">Johnathan Doe</span> <span className="text-text-muted ml-1">Ingeniería</span></p>
                      <p className="text-sm text-text-secondary mt-1">Updated the technical diagram A-102 to reflect the new sensor positions for <span className="font-bold text-text-primary">@Sarah Jenkins</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <input 
                    type="text" 
                    placeholder="Añadir un comentario o mencionar a alguien..." 
                    className="w-full px-4 py-2 text-sm bg-bg-secondary border border-[#d1d9e6] rounded focus:outline-none focus:border-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-bg-primary border-t border-[#d1d9e6] p-4 px-8 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Monto Total</span>
                <span className="text-2xl font-black text-[#041627] tracking-tight">{formatUSD(selectedProposal.proposal.totalValue || 0)}</span>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-text-secondary"></div>
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">In Negotiation</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {selectedProposal.proposal.status === "aceptada" ? (
                    <span className="px-8 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded text-xs font-bold uppercase tracking-wider">
                      PROPUESTA APROBADA
                    </span>
                  ) : (
                    <button 
                      onClick={handleApprove}
                      disabled={!canApprove || isUpdating}
                      className={`px-8 py-2 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                        canApprove && !isUpdating
                          ? "bg-text-primary text-bg-primary hover:bg-opacity-90 cursor-pointer"
                          : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {!canApprove ? "APROBACIÓN RESTRINGIDA" : "APROBAR"}
                    </button>
                  )}
                  <button className="px-6 py-2 bg-bg-primary border border-text-primary text-text-primary rounded text-xs font-bold hover:bg-bg-secondary transition-colors">
                    NUEVA VERSIÓN
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            Select a proposal to view details
          </div>
        )}
      </div>

    </div>
  );
}
