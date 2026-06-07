/**
 * Utility mapper for CYH OS
 * Maps Internal CRM Stages to equivalent statuses on the future Customer Portal.
 * 
 * Internal CRM Stages:
 * - nuevo
 * - contacto
 * - reunion
 * - diagnostico
 * - propuesta_prep
 * - propuesta_entregada
 * - negociacion
 * - ganado
 * - perdido
 * 
 * Customer Portal Statuses:
 * - Diagnóstico (Initial reviews / data collection)
 * - Ingeniería (Detailed sizing and flow calculations)
 * - Cotización (Drafting values and proposal preparation)
 * - Aprobación (Sent proposal waiting for customer signature)
 * - Fabricación (After win, structural steel processing)
 * - Instalación (On-site setup and assembly)
 * - Entrega (Commissioning and handover)
 * - Cerrado (Won/Lost finalized)
 */

export type CRMInternalStage = 
  | "nuevo" 
  | "contacto" 
  | "reunion" 
  | "diagnostico" 
  | "propuesta_prep" 
  | "propuesta_entregada" 
  | "negociacion" 
  | "ganado" 
  | "perdido";

export type CustomerPortalStatus = 
  | "Diagnóstico"
  | "Ingeniería"
  | "Cotización"
  | "Aprobación"
  | "Fabricación"
  | "Instalación"
  | "Entrega"
  | "Cerrado";

export function mapCrmStageToPortal(
  crmStage: CRMInternalStage | string,
  extraParams?: {
    isFabricationStarted?: boolean;
    isInstallationStarted?: boolean;
    isDelivered?: boolean;
  }
): CustomerPortalStatus {
  const stage = String(crmStage).toLowerCase();

  switch (stage) {
    case "nuevo":
    case "contacto":
    case "reunion":
      return "Diagnóstico";

    case "diagnostico":
      return "Ingeniería";

    case "propuesta_prep":
      return "Cotización";

    case "propuesta_entregada":
    case "negociacion":
      return "Aprobación";

    case "ganado":
      if (extraParams?.isDelivered) {
        return "Entrega";
      }
      if (extraParams?.isInstallationStarted) {
        return "Instalación";
      }
      if (extraParams?.isFabricationStarted) {
        return "Fabricación";
      }
      // Default immediately after win
      return "Fabricación";

    case "perdido":
    default:
      return "Cerrado";
  }
}
