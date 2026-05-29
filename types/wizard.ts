export type ServiceType = "fabricacion" | "venta" | "mantenimiento" | "reparacion";

export type WizardStep = "service" | "calculator" | "symptoms" | "teaser" | "lead" | "summary";

export interface FlowInputs {
  length: number;
  width: number;
  height: number;
  environment: string;
}

export interface FlowResult {
  volume: number;
  estimatedFlow: number;
  category: string;
  recommendation: string;
  investmentRange: string;
  // Ficha técnica dinámica
  technicalObservations: string;
  materialSuggestions: string;
  ductingObservations: string;
  inspectionRecommendations: string;
}

export interface SymptomInputs {
  // Vectores Mantenimiento
  preventivo?: boolean;
  eficiencia?: boolean;
  desgaste?: boolean;
  vibracion_sutil?: boolean;
  consumo?: boolean;
  monitoreo?: boolean;

  // Vectores Reparación
  falla_critica?: boolean;
  no_enciende?: boolean;
  humo?: boolean;
  falla_electrica?: boolean;
  ruido_severo?: boolean;
  danos_estructurales?: boolean;
}

export interface SymptomResult {
  severity: "low" | "medium" | "high";
  complexityScore: number;
  alertMessage: string;
  recommendedAction: string;
  // Ficha técnica dinámica
  technicalObservations: string;
  materialSuggestions: string;
  ductingObservations: string;
  inspectionRecommendations: string;
}

export interface LeadInputs {
  nombre: string;
  empresa: string;
  cargo: string;
  telefono: string;
  email: string;
  ciudad: string;
  urgencia: "baja" | "media" | "alta";
}

export interface PriceRange {
  minCOP: number;
  maxCOP: number;
  minUSD: number;
  maxUSD: number;
}

export interface WizardState {
  step: WizardStep;
  service: ServiceType | null;
  flowInputs: FlowInputs;
  flowResult: FlowResult | null;
  symptoms: SymptomInputs;
  symptomsResult: SymptomResult | null;
  leadData: LeadInputs | null;
}
