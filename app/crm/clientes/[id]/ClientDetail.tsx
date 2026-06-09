"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, FileText, 
  MessageSquare, Plus, Download, AlertCircle, Calendar,
  TrendingUp, Wind, CheckCircle2, X, AlertTriangle, ShieldAlert,
  UserCheck
} from "lucide-react";
import { 
  createCustomerPlantAction, 
  createCustomerContactAction, 
  addTechnicalMeasurementAction,
  updateCustomerStatusAction 
} from "@/lib/server-actions/customers";
import { 
  crmCustomers, 
  crmCustomerPlants, 
  crmCustomerContacts, 
  crmProposals, 
  crmDocuments,
  diagnosticReports 
} from "@/lib/db/schema";

interface ClientDetailProps {
  customer: typeof crmCustomers.$inferSelect;
  plants: (typeof crmCustomerPlants.$inferSelect & {
    diagnostics: (typeof diagnosticReports.$inferSelect)[];
  })[];
  contacts: (typeof crmCustomerContacts.$inferSelect)[];
  proposals: (typeof crmProposals.$inferSelect)[];
  documents: (typeof crmDocuments.$inferSelect)[];
  userRole: string;
  isTecnico: boolean;
  isAdmin: boolean;
}

export default function ClientDetail({
  customer,
  plants,
  contacts,
  proposals,
  documents,
  userRole,
  isTecnico,
  isAdmin,
}: ClientDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"plantas" | "contactos" | "documentacion">("plantas");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Modals visibility state
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState("");

  // Forms state
  // 1. Plant Form
  const [plantName, setPlantName] = useState("");
  const [plantCity, setPlantCity] = useState("");
  const [plantAddress, setPlantAddress] = useState("");
  const [plantAirflow, setPlantAirflow] = useState("0");

  // 2. Contact Form
  const [contactName, setContactName] = useState("");
  const [contactCargo, setContactCargo] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // 3. Technical Measurement Form
  const [measAirflow, setMeasAirflow] = useState("");
  const [measObservations, setMeasObservations] = useState("");
  const [measRecommendations, setMeasRecommendations] = useState("");
  const [measMaterials, setMeasMaterials] = useState("");

  // Clean phone number for WhatsApp URL
  const getWhatsAppLink = (phoneNum: string | null) => {
    if (!phoneNum) return "#";
    const cleanNum = phoneNum.replace(/\D/g, "");
    // Default country code for Colombia (57) if no country code provided
    const formatted = cleanNum.length === 10 ? `57${cleanNum}` : cleanNum;
    return `https://wa.me/${formatted}`;
  };

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName.trim() || !plantCity.trim()) return;
    setError("");

    startTransition(async () => {
      const res = await createCustomerPlantAction({
        customerId: customer.id,
        name: plantName,
        city: plantCity,
        address: plantAddress.trim() || undefined,
        airflowCfm: parseInt(plantAirflow) || 0,
      });

      if (res.success) {
        setIsPlantModalOpen(false);
        setPlantName("");
        setPlantCity("");
        setPlantAddress("");
        setPlantAirflow("0");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    setError("");

    startTransition(async () => {
      const res = await createCustomerContactAction({
        customerId: customer.id,
        fullName: contactName,
        cargo: contactCargo.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        email: contactEmail.trim() || undefined,
      });

      if (res.success) {
        setIsContactModalOpen(false);
        setContactName("");
        setContactCargo("");
        setContactPhone("");
        setContactEmail("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantId || !measAirflow) return;
    setError("");

    startTransition(async () => {
      const res = await addTechnicalMeasurementAction({
        plantId: selectedPlantId,
        airflow: parseInt(measAirflow) || 0,
        technicalObservations: measObservations.trim() || undefined,
        recommendations: measRecommendations.trim() || undefined,
        materialSuggestions: measMaterials.trim() || undefined,
      });

      if (res.success) {
        setIsMeasurementModalOpen(false);
        setSelectedPlantId("");
        setMeasAirflow("");
        setMeasObservations("");
        setMeasRecommendations("");
        setMeasMaterials("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleToggleStatus = async () => {
    const newStatus = customer.status === "activo" ? "inactivo" : "activo";
    setError("");
    startTransition(async () => {
      const res = await updateCustomerStatusAction(customer.id, newStatus);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-bg-secondary p-6 font-sans overflow-hidden">
      {/* HEADER BAR */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button
          onClick={() => router.push("/crm/clientes")}
          className="p-1.5 bg-bg-primary border border-border-subtle rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary uppercase tracking-tight">
              {customer.name}
            </h1>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              customer.status === "activo" 
                ? "bg-success-subtle/10 text-success border-success/20" 
                : "bg-danger-subtle/10 text-danger border-danger/20"
            }`}>
              {customer.status}
            </span>
            {!customer.nit && (
              <span className="bg-warning-subtle/10 text-warning border border-warning/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Falta NIT
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted mt-1 font-mono">
            {customer.nit && <span>NIT: {customer.nit}</span>}
            <span>•</span>
            <span>Asesor: {customer.assignedTo || "Sin asignar"}</span>
          </div>
        </div>

        {/* Contract Controls (ADMIN / DIRECTOR only) */}
        {!isTecnico && (isAdmin || userRole === "director_comercial") && (
          <div className="ml-auto">
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all ${
                customer.status === "activo"
                  ? "bg-danger-subtle/10 text-danger border-danger/20 hover:bg-danger/10"
                  : "bg-success-subtle/10 text-success border-success/20 hover:bg-success/10"
              }`}
            >
              {customer.status === "activo" ? "Dar de Baja Contrato" : "Reactivar Contrato"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger-subtle/10 text-danger border border-danger/20 p-3 rounded text-xs mb-4 shrink-0 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* THREE INTERACTIVE TABS */}
      <div className="flex border-b border-border-subtle shrink-0 gap-6 mb-6">
        <button
          onClick={() => setActiveTab("plantas")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "plantas"
              ? "border-accent-cyan text-text-primary"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          Plantas Industriales ({plants.length})
        </button>

        <button
          onClick={() => setActiveTab("contactos")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "contactos"
              ? "border-accent-cyan text-text-primary"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          Directorio de Contactos ({contacts.length})
        </button>

        {!isTecnico ? (
          <button
            onClick={() => setActiveTab("documentacion")}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "documentacion"
                ? "border-accent-cyan text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Documentación Comercial ({proposals.length + documents.length})
          </button>
        ) : (
          <div className="pb-2 text-xs font-bold uppercase tracking-wider text-text-muted/40 cursor-not-allowed flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-text-muted/40" /> Documentación [Restringido]
          </div>
        )}
      </div>

      {/* TAB CONTENT GRID */}
      <div className="flex-1 overflow-auto bg-bg-primary border border-border-subtle rounded-lg p-6 shadow-sm min-h-0 relative">
        {/* TAB 1: PLANTAS */}
        {activeTab === "plantas" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-accent-cyan" /> Ubicaciones Físicas y Caudales CFM
              </h2>
              <button
                onClick={() => setIsPlantModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan hover:bg-bg-primary rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Planta
              </button>
            </div>

            <div className="flex-1 overflow-auto min-h-0 pr-1">
              {plants.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-subtle rounded bg-bg-secondary/20 p-6 text-center">
                  <Building2 className="w-10 h-10 text-text-muted/50 mb-3" />
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
                    No hay ubicaciones registradas para este cliente
                  </p>
                  <button
                    onClick={() => setIsPlantModalOpen(true)}
                    className="mt-4 px-4 py-1.5 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded shadow hover:opacity-95"
                  >
                    Registrar Primera Planta
                  </button>
                </div>
              ) : (
                /* List of Plants with CFM Timeline */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plants.map((plant) => (
                    <div
                      key={plant.id}
                      className="bg-bg-secondary/35 border border-border-subtle rounded p-4 flex flex-col justify-between hover:border-accent-cyan/40 transition-all shadow-sm"
                    >
                      <div>
                        {/* Plant header */}
                        <div className="flex items-start justify-between border-b border-border-subtle/50 pb-2 mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                              {plant.name}
                            </h3>
                            <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3 text-text-muted" /> {plant.city} {plant.address ? `| ${plant.address}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold uppercase text-text-muted">Caudal Actual</span>
                            <p className="text-sm font-bold text-accent-cyan font-mono mt-0.5">
                              {plant.airflowCfm.toLocaleString()} CFM
                            </p>
                          </div>
                        </div>

                        {/* Measurements History list */}
                        <div className="space-y-2 mt-4">
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Historial de Mediciones CFM</p>
                          {plant.diagnostics?.length === 0 ? (
                            <p className="text-[10px] text-text-muted italic">Sin mediciones registradas.</p>
                          ) : (
                            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                              {plant.diagnostics.map((diag) => (
                                <div
                                  key={diag.id}
                                  className="flex items-center justify-between bg-bg-primary border border-border-subtle/40 rounded p-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-accent-cyan font-semibold">{diag.airflow?.toLocaleString()} CFM</span>
                                    {diag.createdAt && (
                                      <span className="text-text-muted text-[9px]">
                                        ({new Date(diag.createdAt).toLocaleDateString("es-CO")})
                                      </span>
                                    )}
                                  </div>
                                  {diag.technicalObservations && (
                                    <span className="text-text-secondary truncate max-w-[150px] italic text-[9px]">
                                      {diag.technicalObservations}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add new measurement button */}
                      <div className="border-t border-border-subtle/50 pt-3 mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedPlantId(plant.id);
                            setIsMeasurementModalOpen(true);
                          }}
                          className="px-3 py-1 bg-text-primary text-bg-primary hover:bg-bg-secondary hover:text-text-primary border border-transparent hover:border-border-subtle rounded text-[9px] font-bold uppercase tracking-wider transition-all"
                        >
                          Nueva Medición Técnica
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONTACTOS */}
        {activeTab === "contactos" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-accent-cyan" /> Personal Corporativo
              </h2>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan hover:bg-bg-primary rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Contacto
              </button>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-subtle rounded bg-bg-secondary/20 p-6 text-center">
                  <Phone className="w-10 h-10 text-text-muted/50 mb-3" />
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
                    No hay contactos registrados
                  </p>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="mt-4 px-4 py-1.5 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded shadow hover:opacity-95"
                  >
                    Añadir Primer Contacto
                  </button>
                </div>
              ) : (
                <div className="border border-border-subtle rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg-secondary border-b border-border-subtle">
                        <th className="p-3 font-bold uppercase tracking-wider">Nombre Completo</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Cargo</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Teléfono</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Email</th>
                        <th className="p-3 font-bold uppercase tracking-wider text-center w-20">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/55">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-bg-secondary/30 transition-colors">
                          <td className="p-3 font-bold text-text-primary">{contact.fullName}</td>
                          <td className="p-3 text-text-secondary">{contact.cargo || "Sin Cargo"}</td>
                          <td className="p-3 font-mono text-text-secondary">{contact.phone || "-"}</td>
                          <td className="p-3 font-mono text-text-secondary">{contact.email || "-"}</td>
                          <td className="p-3 text-center">
                            {contact.phone ? (
                              <a
                                href={getWhatsAppLink(contact.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex p-1.5 bg-success-subtle/10 border border-success/30 rounded text-success hover:bg-success hover:text-bg-primary transition-all shadow-sm"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-text-muted/40 italic">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTACION (HIDDEN FOR TECNICO) */}
        {activeTab === "documentacion" && !isTecnico && (
          <div className="h-full flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-4 shrink-0">
              <FileText className="w-4 h-4 text-accent-cyan" /> Archivos Indexados y Propuestas Comerciales
            </h2>

            <div className="flex-1 overflow-auto min-h-0 space-y-4">
              {/* Proposals section */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Propuestas Económicas</p>
                {proposals.length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-bg-secondary/20 border border-border-subtle p-3 rounded">
                    No hay propuestas vinculadas a esta cuenta corporativa.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="bg-bg-secondary/20 border border-border-subtle rounded p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-text-primary uppercase tracking-tight">{prop.title}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            Valor: ${prop.totalValue.toLocaleString("es-CO")} COP | Estado: {prop.status}
                          </p>
                        </div>
                        {prop.pdfUrl && (
                          <a
                            href={prop.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan rounded text-[10px] font-bold uppercase transition-all text-text-secondary hover:text-text-primary"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar PDF
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Documents Section */}
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Certificados y Fichas Técnicas</p>
                {documents.length === 0 ? (
                  <p className="text-xs text-text-muted italic bg-bg-secondary/20 border border-border-subtle p-3 rounded">
                    No se han cargado certificados u otros archivos asociados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-bg-secondary/20 border border-border-subtle rounded p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-text-primary truncate max-w-sm">{doc.fileName}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            Tipo: {doc.fileType.toUpperCase()} | Subido: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("es-CO") : ""}
                          </p>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan rounded text-[10px] font-bold uppercase transition-all text-text-secondary hover:text-text-primary"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR PLANTA */}
      {isPlantModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPlantModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
              Registrar Planta Industrial
            </h3>
            <form onSubmit={handleCreatePlant} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Nombre de la Planta *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Planta Principal Norte"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Ciudad *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Bogotá"
                    value={plantCity}
                    onChange={(e) => setPlantCity(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Caudal Inicial CFM</label>
                  <input
                    type="number"
                    value={plantAirflow}
                    onChange={(e) => setPlantAirflow(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Ej: Calle 80 # 65-10"
                  value={plantAddress}
                  onChange={(e) => setPlantAddress(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div className="border-t border-border-subtle pt-4 mt-6">
                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:opacity-95 transition-opacity"
                >
                  {isPending ? "Procesando..." : "Registrar Planta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AÑADIR CONTACTO */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
              Registrar Contacto B2B
            </h3>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Ing. Carlos Mendoza"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Cargo / Puesto</label>
                <input
                  type="text"
                  placeholder="Ej: Director de Mantenimiento"
                  value={contactCargo}
                  onChange={(e) => setContactCargo(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Ej: 3151234567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: c.mendoza@empresa.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan font-mono"
                  />
                </div>
              </div>
              <div className="border-t border-border-subtle pt-4 mt-6">
                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:opacity-95 transition-opacity"
                >
                  {isPending ? "Procesando..." : "Guardar Contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRAR MEDICION TECNICA CFM */}
      {isMeasurementModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsMeasurementModalOpen(false);
                setSelectedPlantId("");
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
              Nueva Medición Técnica de Campo
            </h3>
            <form onSubmit={handleAddMeasurement} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Caudal Medido (CFM) *</label>
                <input
                  required
                  type="number"
                  placeholder="Ej: 12500"
                  value={measAirflow}
                  onChange={(e) => setMeasAirflow(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Observaciones Técnicas</label>
                <textarea
                  placeholder="Ej: Se observa caída de presión en damper principal..."
                  value={measObservations}
                  onChange={(e) => setMeasObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Recomendaciones de Operación</label>
                <textarea
                  placeholder="Ej: Reajustar tensores de correa..."
                  value={measRecommendations}
                  onChange={(e) => setMeasRecommendations(e.target.value)}
                  rows={2}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Materiales Recomendados / Filtros</label>
                <input
                  type="text"
                  placeholder="Ej: Filtros sintéticos G4 24x24"
                  value={measMaterials}
                  onChange={(e) => setMeasMaterials(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div className="border-t border-border-subtle pt-4 mt-6">
                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:opacity-95 transition-opacity"
                >
                  {isPending ? "Registrando..." : "Registrar Medición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
