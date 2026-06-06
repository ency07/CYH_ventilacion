"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Download, Star, Edit2, X, MoreHorizontal, Phone, FileText, Mail, MapPin, Building2, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getLeadByIdAction } from "@/lib/server-actions/leads";

export default function LeadsClient({ leads, companies, contacts, tasks }: { leads: any[], companies: any[], contacts: any[], tasks: any[] }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [fullLead, setFullLead] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!selectedLeadId) {
      setFullLead(null);
      return;
    }
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await getLeadByIdAction(selectedLeadId);
        if (res.success && res.data) {
          setFullLead(res.data);
        }
      } catch (err) {
        console.error("Error loading lead details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [selectedLeadId]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const company = selectedLead ? companies.find(c => c.id === selectedLead.companyId) : null;
  const contact = selectedLead ? contacts.find(c => c.id === selectedLead.contactId) : null;

  const displayCompanyName = (lead: any) => {
    const c = companies.find(c => c.id === lead.companyId);
    return c?.name || lead.companyName || 'Empresa Desconocida';
  };

  const displayContactName = (lead: any) => {
    const p = contacts.find(c => c.id === lead.contactId);
    if (p) return `${p.firstName} ${p.lastName}`;
    if (lead.firstName || lead.lastName) return `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    return 'Contacto Desconocido';
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-bg-secondary font-sans">
      
      {/* HEADER PRINCIPAL */}
      <div className="px-6 py-4 flex items-center justify-between bg-bg-primary border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-text-primary">Leads Pipeline</h2>
          <span className="bg-bg-secondary px-2 py-0.5 rounded text-xs font-bold text-accent-cyan border border-border-subtle">{leads.length} TOTAL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar leads, empresas o proyectos..." className="pl-9 pr-4 py-1.5 text-sm bg-bg-secondary border border-border-subtle rounded-md w-72 focus:outline-none focus:border-accent-cyan" />
          </div>
          <button className="px-3 py-1.5 border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary rounded flex items-center gap-2 hover:bg-bg-secondary transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </button>
          <button className="px-3 py-1.5 border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary rounded flex items-center gap-2 hover:bg-bg-secondary transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          <Link href="/crm/leads/nuevo" className="flex items-center gap-2 px-4 py-1.5 bg-text-primary text-bg-primary rounded-md text-sm font-bold hover:bg-text-secondary transition-colors">
            <Plus className="w-4 h-4" /> New Lead
          </Link>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA (Toma 100% del ancho siempre) */}
      <div className="flex-1 overflow-auto w-full bg-bg-primary relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-bg-secondary z-10 shadow-sm">
            <tr>
              <th className="p-4 pl-6 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Empresa</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Contacto</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Ciudad</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Origen</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Fecha</th>
              <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-sm text-text-muted">No hay leads registrados actualmente.</td>
              </tr>
            ) : (
              leads.map(lead => {
                const isSelected = lead.id === selectedLeadId;
                const c = companies.find(c => c.id === lead.companyId);
                const p = contacts.find(c => c.id === lead.contactId);
                const dateRaw = new Date(lead.createdAt);
                
                return (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`cursor-pointer transition-colors group ${isSelected ? 'bg-bg-secondary/60' : 'hover:bg-bg-secondary/30'}`}
                  >
                    <td className="p-4 pl-6 relative">
                      {/* Borde izquierdo dinámico para selección simulando el diseño */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-cyan rounded-r"></div>}
                      {!isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-border-subtle rounded-r transition-colors"></div>}
                      
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary text-sm">{displayCompanyName(lead)}</span>
                        <span className="text-[10px] text-text-muted font-mono uppercase mt-0.5">ID: {lead.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-primary">{displayContactName(lead)}</p>
                      <p className="text-xs text-text-secondary">{p?.title || 'Sin Cargo'}</p>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {lead.city || 'No Registrada'}
                    </td>
                    <td className="p-4">
                      {lead.source ? (
                        <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {lead.source}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text-secondary font-mono">
                      {format(dateRaw, 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded bg-bg-secondary text-text-secondary flex items-center justify-center hover:bg-accent-cyan hover:text-white transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded bg-bg-secondary text-text-secondary flex items-center justify-center hover:bg-accent-cyan hover:text-white transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* OVERLAY INVISIBLE PARA CERRAR EL DRAWER SI SE HACE CLIC AFUERA (Opcional) */}
      {selectedLeadId && (
        <div 
          className="absolute inset-0 z-20 bg-transparent" 
          onClick={() => setSelectedLeadId(null)}
        />
      )}

      {/* DRAWER FLOTANTE (PANEL DERECHO) */}
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-[480px] bg-bg-primary shadow-[-15px_0_30px_rgba(0,0,0,0.1)] border-l border-border-subtle z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
          selectedLeadId ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()} // Previene que el overlay cierre al hacer clic adentro
      >
        {selectedLead && (
          <>
            {/* Header del Drawer */}
            <div className="p-6 pb-0 border-b border-border-subtle bg-bg-primary">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-text-primary text-bg-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Lead Activo</span>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedLeadId(null)} className="w-8 h-8 rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-bg-secondary border border-border-subtle rounded-md flex items-center justify-center shrink-0">
                  <Building2 className="w-8 h-8 text-text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary leading-tight">{displayCompanyName(selectedLead)}</h3>
                  <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedLead.city || 'Ubicación no registrada'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Alta Prioridad
                    </span>
                  </div>
                </div>
              </div>

              {/* Navegación por Pestañas */}
              <div className="flex overflow-x-auto no-scrollbar border-b border-border-subtle">
                {['Resumen', 'Diagnósticos', 'Actividades', 'Propuestas', 'Notas'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`py-3 px-4 text-sm whitespace-nowrap transition-colors relative ${
                      activeTab === tab.toLowerCase() 
                        ? 'text-text-primary font-bold' 
                        : 'text-text-secondary hover:text-text-primary font-medium'
                    }`}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase() && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-bg-primary">
              {activeTab === 'resumen' && (
                <>
                  {/* Tarjetas de Contacto */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Información de Contacto</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-bg-secondary/50 border border-border-subtle rounded-md">
                        <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Contacto Principal</p>
                        <p className="text-sm font-medium text-text-primary truncate">{displayContactName(selectedLead)}</p>
                      </div>
                      <div className="p-3 bg-bg-secondary/50 border border-border-subtle rounded-md">
                        <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Cargo</p>
                        <p className="text-sm font-medium text-text-primary truncate">{contact?.title || selectedLead.cargo || '-'}</p>
                      </div>
                      <div className="p-3 bg-bg-secondary/50 border border-border-subtle rounded-md col-span-2">
                        <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Email Corporativo</p>
                        <p className="text-sm font-medium text-text-primary truncate">{contact?.email || selectedLead.email || '-'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Línea de Tiempo de Actividades Reales */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Actividades Recientes</h4>
                    </div>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border-subtle">
                      {loadingDetails ? (
                        <div className="text-xs text-text-muted">Cargando bitácora...</div>
                      ) : (fullLead?.crmActivityLogs || []).length === 0 ? (
                        <div className="text-xs text-text-muted">No hay actividades registradas.</div>
                      ) : (
                        (fullLead.crmActivityLogs).slice(0, 3).map((act: any, aIdx: number) => (
                          <div key={act.id || aIdx} className="relative">
                            <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center z-10">
                              <FileText className="w-3 h-3 text-text-secondary" />
                            </div>
                            <p className="text-sm text-text-primary capitalize"><span className="font-bold">{act.activityType.replace(/_/g, ' ')}</span></p>
                            <p className="text-[11px] text-text-secondary mt-0.5">{act.description}</p>
                            <p className="text-[9px] text-text-muted mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Diagnósticos y Documentos Reales */}
                  <section>
                    <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Diagnósticos y Propuestas</h4>
                    <div className="space-y-2">
                      {loadingDetails ? (
                        <div className="text-xs text-text-muted">Cargando archivos...</div>
                      ) : (
                        <>
                          {(fullLead?.diagnosticReports || []).map((diag: any, dIdx: number) => (
                            <div key={`diag-${diag.id}`} className="flex items-center justify-between p-3 border border-border-subtle rounded-md hover:border-accent-cyan cursor-pointer transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded flex items-center justify-center">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-text-primary">Diagnostico_Preingenieria_{dIdx + 1}.pdf</p>
                                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{diag.airflow ? `${diag.airflow} m³/h` : 'Caudal N/A'} • {diag.status}</p>
                                </div>
                              </div>
                              {diag.generatedPdfUrl && (
                                <a href={diag.generatedPdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 text-text-muted group-hover:text-accent-cyan transition-colors" />
                                </a>
                              )}
                            </div>
                          ))}

                          {(fullLead?.crmProposals || []).map((prop: any, pIdx: number) => (
                            <div key={`prop-${prop.id}`} className="flex items-center justify-between p-3 border border-border-subtle rounded-md hover:border-accent-cyan cursor-pointer transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded flex items-center justify-center">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-text-primary">{prop.title}</p>
                                  <p className="text-[10px] text-text-muted uppercase tracking-wider">${(prop.totalValue / 1000000).toFixed(1)}M COP • {prop.status}</p>
                                </div>
                              </div>
                              {prop.pdfUrl && (
                                <a href={prop.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 text-text-muted group-hover:text-accent-cyan transition-colors" />
                                </a>
                              )}
                            </div>
                          ))}

                          {(!fullLead?.diagnosticReports?.length && !fullLead?.crmProposals?.length) && (
                            <div className="text-xs text-text-muted">No hay diagnósticos ni propuestas registradas.</div>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'diagnósticos' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Reportes de Diagnóstico Técnico</h4>
                  {loadingDetails ? (
                    <div className="text-xs text-text-muted">Cargando...</div>
                  ) : (fullLead?.diagnosticReports || []).length === 0 ? (
                    <div className="text-xs text-text-muted">No hay diagnósticos técnicos registrados.</div>
                  ) : (
                    (fullLead.diagnosticReports).map((diag: any, idx: number) => (
                      <div key={diag.id} className="p-4 bg-bg-secondary/40 border border-border-subtle rounded-md space-y-3">
                        <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                          <span className="font-bold text-xs text-text-primary">Diagnóstico #{idx + 1}</span>
                          <span className="bg-bg-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{diag.status}</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div><span className="text-text-muted">Caudal de Aire:</span> <span className="font-bold">{diag.airflow ? `${diag.airflow} m³/h` : 'N/A'}</span></div>
                          <div><span className="text-text-muted">Observaciones:</span> <p className="text-text-secondary mt-0.5 leading-relaxed">{diag.technicalObservations || 'Sin observaciones'}</p></div>
                          <div><span className="text-text-muted">Recomendaciones:</span> <p className="text-text-secondary mt-0.5 leading-relaxed">{diag.recommendations || 'Sin recomendaciones'}</p></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'actividades' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Historial de Actividades Completo</h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border-subtle">
                    {loadingDetails ? (
                      <div className="text-xs text-text-muted">Cargando...</div>
                    ) : (fullLead?.crmActivityLogs || []).length === 0 ? (
                      <div className="text-xs text-text-muted">No hay actividades en el historial.</div>
                    ) : (
                      (fullLead.crmActivityLogs).map((act: any, idx: number) => (
                        <div key={act.id || idx} className="relative">
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center z-10">
                            <FileText className="w-3 h-3 text-text-secondary" />
                          </div>
                          <p className="text-sm text-text-primary capitalize"><span className="font-bold">{act.activityType.replace(/_/g, ' ')}</span></p>
                          <p className="text-xs text-text-secondary mt-0.5">{act.description}</p>
                          <p className="text-[10px] text-text-muted mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'propuestas' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Historial de Propuestas Comerciales</h4>
                  {loadingDetails ? (
                    <div className="text-xs text-text-muted">Cargando...</div>
                  ) : (fullLead?.crmProposals || []).length === 0 ? (
                    <div className="text-xs text-text-muted">No hay propuestas registradas.</div>
                  ) : (
                    (fullLead.crmProposals).map((prop: any, idx: number) => (
                      <div key={prop.id} className="p-4 bg-bg-secondary/40 border border-border-subtle rounded-md space-y-3">
                        <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                          <span className="font-bold text-xs text-text-primary truncate max-w-[200px]">{prop.title}</span>
                          <span className="bg-bg-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{prop.status}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div><span className="text-text-muted">Valor Total:</span> <span className="font-bold text-emerald-600">${(prop.totalValue || 0).toLocaleString()} COP</span></div>
                          <div><span className="text-text-muted">Fecha Emisión:</span> <span className="text-text-secondary">{new Date(prop.createdAt).toLocaleDateString()}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notas' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Notas Comerciales</h4>
                  <div className="p-4 bg-bg-secondary/40 border border-border-subtle rounded-md text-xs text-text-secondary leading-relaxed">
                    {selectedLead.notes || "No hay notas u observaciones adicionales registradas para este lead."}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 bg-bg-secondary border-t border-border-subtle shrink-0">
              <div className="flex gap-2">
                <button className="flex-1 bg-text-primary text-bg-primary py-2.5 rounded-md font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
                  Convertir a Oportunidad
                </button>
                <button className="w-12 h-[44px] border border-border-subtle bg-bg-primary flex items-center justify-center rounded-md hover:bg-bg-secondary transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTÓN FLOTANTE CHAT (Contextual de Soporte) */}
      <button className="absolute bottom-6 right-6 lg:right-[500px] w-14 h-14 bg-text-primary text-bg-primary rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group">
        <MessageSquare className="w-6 h-6" />
        <div className="absolute right-16 bg-text-primary text-bg-primary px-3 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
          Consultas Técnicas
        </div>
      </button>

    </div>
  );
}
