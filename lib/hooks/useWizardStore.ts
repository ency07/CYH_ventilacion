import { create } from "zustand";
import { WizardState, ServiceType, WizardStep, FlowInputs, SymptomInputs, LeadInputs } from "@/types/wizard";
import { calculateFlowAndInvestment, diagnoseSymptoms } from "@/lib/calculations/flow";

interface WizardStore extends WizardState {
  setStep: (step: WizardStep) => void;
  setService: (service: ServiceType) => void;
  setFlowInputs: (inputs: FlowInputs) => void;
  setSymptoms: (symptoms: SymptomInputs) => void;
  setLeadData: (leadData: LeadInputs) => void;
  resetWizard: () => void;
}

const initialFlowInputs: FlowInputs = {
  length: 0,
  width: 0,
  height: 0,
  environment: "warehouse",
};

const initialSymptoms: SymptomInputs = {
  // Vectores Mantenimiento
  preventivo: false,
  eficiencia: false,
  desgaste: false,
  vibracion_sutil: false,
  consumo: false,
  monitoreo: false,

  // Vectores Reparación
  falla_critica: false,
  no_enciende: false,
  humo: false,
  falla_electrica: false,
  ruido_severo: false,
  danos_estructurales: false,
};

export const useWizardStore = create<WizardStore>((set) => ({
  step: "service",
  service: null,
  flowInputs: initialFlowInputs,
  flowResult: null,
  symptoms: initialSymptoms,
  symptomsResult: null,
  leadData: null,

  setStep: (step) => set({ step }),
  
  setService: (service) => set({ 
    service,
    flowInputs: initialFlowInputs,
    flowResult: null,
    symptoms: initialSymptoms,
    symptomsResult: null,
    leadData: null,
  }),

  setFlowInputs: (flowInputs) => set(() => {
    const flowResult = calculateFlowAndInvestment(flowInputs);
    return { flowInputs, flowResult };
  }),

  setSymptoms: (symptoms) => set((state) => {
    const service = state.service || "mantenimiento";
    const symptomsResult = diagnoseSymptoms(symptoms, service);
    return { symptoms, symptomsResult };
  }),

  setLeadData: (leadData) => set({ leadData }),

  resetWizard: () => set({
    step: "service",
    service: null,
    flowInputs: initialFlowInputs,
    flowResult: null,
    symptoms: initialSymptoms,
    symptomsResult: null,
    leadData: null,
  }),
}));
