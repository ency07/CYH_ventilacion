import { FlowInputs, FlowResult, SymptomInputs, SymptomResult, ServiceType, PriceRange } from "@/types/wizard";

/**
 * Calculates estimated flow and recommendations based on building metrics.
 * Implements highly realistic corporate B2B technical observations.
 */
export function calculateFlowAndInvestment(inputs: FlowInputs): FlowResult {
  const { length, width, height, environment } = inputs;
  
  // Volume calculation
  const volume = length * width * height;
  
  // Air changes per hour coefficient (realistic industrial values for B2B)
  let renewalCoef = 10;
  if (environment === "heavy_plant") renewalCoef = 35;
  else if (environment === "data_center") renewalCoef = 25;
  else if (environment === "mining") renewalCoef = 55;
  else if (environment === "warehouse") renewalCoef = 12;

  const estimatedFlow = volume * renewalCoef;
  
  // Initial declarations
  let category = "";
  let recommendation = "";
  let investmentRange = "";
  let technicalObservations = "";
  let materialSuggestions = "";
  let ductingObservations = "";
  let inspectionRecommendations = "";

  if (estimatedFlow > 100000) {
    category = "CAUDAL CRÍTICO DE INFRAESTRUCTURA MÁXIMA";
    recommendation = "Sistema de ventilación de alto caudal tipo Plenum con ventiladores centrífugos de acoplamiento directo y motores WEG/Siemens de eficiencia premium IE4.";
    investmentRange = "Clase Especial - Sistema de Caudal Crítico (Gran Minería & Data Centers)";
    technicalObservations = `Caudal crítico masivo calculado en ${estimatedFlow.toLocaleString()} m³/h. Solución redundante N+1 diseñada para garantizar la continuidad operativa absoluta de la infraestructura y el barrido total de contaminantes o calor térmico acumulado.`;
    materialSuggestions = "Carcasa estructural de Acero ASTM A514 de alta resistencia. Álabes forjados en Aluminio Aeronáutico 6061-T6 o Acero Inoxidable 316L con acabado pulido espejo antidesgaste.";
    ductingObservations = "Sistemas de ductos bridados de alta sección con empaquetaduras de neopreno de alta temperatura. Diseñar Plenum de distribución con compuertas motorizadas multidisco.";
    inspectionRecommendations = "Comisionamiento predictivo H24 con sensores de vibración e inclinación en tiempo real. Termografía infrarroja continua en devanados de motores y cojinetes.";
  } else if (estimatedFlow > 45000) {
    category = "FLUJO INDUSTRIAL DE ALTA PRESIÓN Y CAUDAL ELEVADO";
    recommendation = "Extractor centrífugo industrial de álabes inclinados hacia atrás (Airfoil) autolimitador con acoplamiento directo y variador de frecuencia.";
    investmentRange = "Clase A - Ventilación Forzada de Alta Presión (Infraestructura Mayor)";
    technicalObservations = `Caudal de alta capacidad determinado en ${estimatedFlow.toLocaleString()} m³/h. Configurado para superar caídas severas de presión estática generadas por sistemas complejos de ductería o bancos de filtros multietapa.`;
    materialSuggestions = "Rotor y voluta fabricados en Acero Inoxidable 304. Impulsor soldado continuamente bajo procedimiento calificado AWS y equilibrado dinámico estricto según norma ISO 1940 grado G2.5.";
    ductingObservations = "Ductos de sección circular con soldadura longitudinal hermética. Instalar codos con deflectores de flujo internos y silenciador disipativo para mitigación de ruido acústico.";
    inspectionRecommendations = "Medición periódica trimestral de espectro de vibraciones FFT. Análisis de líquidos penetrantes anual en soldaduras críticas del impulsor.";
  } else if (estimatedFlow > 15000) {
    category = "FLUJO INDUSTRIAL ESTÁNDAR DE REGULACIÓN ACTIVA";
    recommendation = "Extractor centrífugo de álabes curvados hacia adelante (Forward Curved) con transmisión por bandas y poleas y motor de alta eficiencia IE3.";
    investmentRange = "Clase B - Sistema Distribuido de Renovación Media (Planta Local)";
    technicalObservations = `El caudal de ${estimatedFlow.toLocaleString()} m³/h es ideal para renovaciones distribuidas. Configurado para plantas con requerimientos de presión estática moderada y bajo ruido estructural.`;
    materialSuggestions = "Estructura de Acero Galvanizado estructural G90 por inmersión en caliente. Chumaceras autoalineables tipo bloque de pie SKF o NSK de servicio pesado con grasera externa.";
    ductingObservations = "Se sugiere ductería de sección rectangular bridada con juntas elásticas flexibles de lona de neopreno. Mantener velocidades de aire de ducto entre 8 y 12 m/s.";
    inspectionRecommendations = "Mantenimiento mensual de tensión de bandas de transmisión y verificación de alineación láser de poleas. Inspección de temperatura termográfica en chumaceras.";
  } else {
    category = "FLUJO COMPACTO ESPECIALIZADO DE BAJA PRESIÓN";
    recommendation = "Extractor helicocentrifugador o axial tubular de acoplamiento directo de bajas revoluciones.";
    investmentRange = "Clase C - Instalación Modular Estándar (PYME Industrial)";
    technicalObservations = `Caudal estimado de ${estimatedFlow.toLocaleString()} m³/h apto para sistemas locales o descarga libre. Baja firma sonora y óptimo consumo eléctrico en regímenes continuos.`;
    materialSuggestions = "Carcasa de lámina de Acero al Carbón ASTM A36 con acabado en pintura epóxica horneada. Álabes balanceados de Poliamida reforzada con fibra de vidrio (PAGAS) para bajo par de arranque.";
    ductingObservations = "Diámetro comercial sugerido de ducto: 400mm a 600mm. Diseñar codos limpios con radio R = 1.5D para suprimir turbulencias de retorno.";
    inspectionRecommendations = "Limpieza semestral del polvo acumulado en álabes para evitar desbalances. Verificación de apriete en la base amortiguadora de caucho.";
  }

  return {
    volume: Math.round(volume * 100) / 100,
    estimatedFlow: Math.round(estimatedFlow * 100) / 100,
    category,
    recommendation,
    investmentRange,
    technicalObservations,
    materialSuggestions,
    ductingObservations,
    inspectionRecommendations
  };
}

/**
 * Diagnoses symptoms and assesses system complexity and severity using realistic Weighted Scoring.
 */
export function diagnoseSymptoms(symptoms: SymptomInputs, service: ServiceType): SymptomResult {
  let score = 0;
  
  // Real Weighted Scoring logic based on service type
  if (service === "mantenimiento") {
    // Maintenance Weighted Weights (Sum to 100)
    if (symptoms.vibracion_sutil) score += 20;
    if (symptoms.desgaste) score += 20;
    if (symptoms.monitoreo) score += 20;
    if (symptoms.eficiencia) score += 15;
    if (symptoms.consumo) score += 15;
    if (symptoms.preventivo) score += 10;
  } else {
    // Repair Weighted Weights (Max 130, normalized or capped to 100)
    if (symptoms.no_enciende) score += 30;
    if (symptoms.humo) score += 25;
    if (symptoms.falla_critica) score += 25;
    if (symptoms.falla_electrica) score += 20;
    if (symptoms.danos_estructurales) score += 20;
    if (symptoms.ruido_severo) score += 15;
  }

  // Cap score at 100
  const complexityScore = Math.min(score, 100);

  let severity: "low" | "medium" | "high" = "low";
  let alertMessage = "";
  let recommendedAction = "";
  let technicalObservations = "";
  let materialSuggestions = "";
  let ductingObservations = "";
  let inspectionRecommendations = "";

  if (service === "mantenimiento") {
    if (complexityScore >= 60) {
      severity = "high";
      alertMessage = "CRÍTICO: Indicadores de desgaste y vibración acumulados en rango de peligro.";
      recommendedAction = "Se requiere parada técnica programada en las próximas 48 horas para balanceo dinámico y termografía del motor.";
      technicalObservations = "Los parámetros ingresados muestran una elevación de temperatura sostenida en rodamientos acoplada a una caída de flujo volumétrico superior al 20%. Riesgo de bloqueo del eje.";
      materialSuggestions = "Reemplazo preventivo de rodamientos de rodillos a rótula SKF y grasa de complejo de sulfonato de calcio de alta temperatura.";
      ductingObservations = "Se detectan vibraciones mecánicas secundarias propagadas a la estructura de anclaje de ductos. Ajustar soportes antivibratorios de resorte.";
      inspectionRecommendations = "Ejecutar análisis de espectro de vibraciones FFT multicanal en chumaceras y análisis termal de bornes en tablero de control.";
    } else if (complexityScore >= 30) {
      severity = "medium";
      alertMessage = "PRECAUCIÓN: Desgaste moderado y picos de consumo detectados en la unidad.";
      recommendedAction = "Programar mantenimiento preventivo correctivo menor en un plazo no mayor a 15 días hábiles.";
      technicalObservations = "Fatiga normal de bandas de transmisión de poleas por horas de servicio. Se registra incremento menor de fricción mecánica en rodamientos.";
      materialSuggestions = "Juego de bandas en V perfil Gates Super HC de alta resistencia y retenes de grasa de neopreno.";
      ductingObservations = "Leves silbidos acústicos en uniones de bridas del ducto. Pérdida menor de presión estática.";
      inspectionRecommendations = "Alineación láser de poleas de transmisión y re-torque general de tornillería de base estructural.";
    } else {
      severity = "low";
      alertMessage = "ESTABLE: Sistema operando bajo parámetros nominales de diseño.";
      recommendedAction = "Programar servicio preventivo estándar de lubricación y limpieza de álabes dentro del trimestre en curso.";
      technicalObservations = "El ventilador opera dentro del rango de tolerancias seguras. Desgaste superficial insignificante de pintura protectora.";
      materialSuggestions = "Lubricante base mineral de viscosidad media para rodamientos en condiciones de operación estándar.";
      ductingObservations = "Presión diferencial y estática estables. Flujo de aire sin turbulencias o restricciones de descarga.";
      inspectionRecommendations = "Inspección visual básica del rodete, limpieza de malla protectora de succión y registro de amperaje en vacío.";
    }
  } else {
    // "reparacion"
    if (complexityScore >= 50) {
      severity = "high";
      alertMessage = "URGENCIA CRÍTICA: Emergencia operativa activa. Extractor inoperable o con riesgo de destrucción.";
      recommendedAction = "Parada de seguridad inmediata. Despachar equipo de ingeniería de campo prioritario para intervención correctiva de urgencia 24h.";
      technicalObservations = "Motor inoperante por corto en devanados, presencia de humo por sobrecalentamiento severo o fractura estructural visible en soldaduras de álabes.";
      materialSuggestions = "Motor industrial WEG/Siemens de eficiencia IE3 a prueba de explosión (según zona) e impulsor soldado OEM balanceado de repuesto.";
      ductingObservations = "Colapso estructural de junta flexible de lona o deformación plástica en codo de transición por presión diferencial extrema.";
      inspectionRecommendations = "Megado de motor (prueba de aislamiento), escaneo por ultrasonido en soldaduras de soporte de la voluta y alineación láser del eje motriz.";
    } else if (complexityScore >= 20) {
      severity = "medium";
      alertMessage = "ALERTA OPERATIVA: Falla activa moderada. Extractor operable con restricciones severas.";
      recommendedAction = "Desplegar ingeniero de campo de CYH para diagnóstico y reparación en sitio dentro de las próximas 48 horas.";
      technicalObservations = "Golpeteo mecánico de alta intensidad por desbalance dinámico del rotor o disparos térmicos intermitentes en variador de frecuencia.";
      materialSuggestions = "Kit de chumaceras bipartidas de alta velocidad, acoplamientos elásticos tipo rejilla Falk y bases antivibratorias nuevas.";
      ductingObservations = "Fugas de aire de volumen significativo por juntas rotas o bridas desalineadas. Reducción de caudal útil en planta.";
      inspectionRecommendations = "Balanceo dinámico in-situ del impulsor en 2 planos y verificación de curvas de arranque del variador de frecuencia.";
    } else {
      severity = "low";
      alertMessage = "ANOMALÍA LEVE: Fallas auxiliares que no comprometen la rotación básica del extractor.";
      recommendedAction = "Corregir anomalías en la próxima ventana de parada programada de planta (próximos 7 días).";
      technicalObservations = "Tornillería de anclaje floja o desajuste de compuerta antirretorno. Perfil eléctrico e hidráulico estable.";
      materialSuggestions = "Tornillos grado 8 con tuercas de seguridad autofrenantes de nailon (Nyloc) y empaquetadura de caucho sintético.";
      ductingObservations = "Ligero paso de flujo de aire en compuerta debido a acumulación de suciedad en bisagras.";
      inspectionRecommendations = "Apriete con torquímetro calibrado y limpieza y lubricación de bisagras de compuertas de descarga.";
    }
  }

  return {
    severity,
    complexityScore: Math.round(complexityScore * 100) / 100,
    alertMessage,
    recommendedAction,
    technicalObservations,
    materialSuggestions,
    ductingObservations,
    inspectionRecommendations
  };
}

/**
 * Calculates a highly realistic industrial pricing range based on engineering variables.
 */
export function calculateDynamicPricing(
  service: ServiceType | null,
  flowResult: FlowResult | null,
  symptomsResult: SymptomResult | null,
  urgencia: "baja" | "media" | "alta" | undefined
): PriceRange {
  // Coherent, realistic base calculation in COP
  let baseCOP = 0;

  if (service === "fabricacion") {
    baseCOP = 12000000; // Base: $12M COP
    if (flowResult) {
      // Scale by caudal
      const flowFactor = flowResult.estimatedFlow / 10000;
      baseCOP += flowFactor * 2200000;

      // Scale by environment/materials sugeridos
      if (flowResult.category.includes("CRÍTICO")) {
        baseCOP += 14000000;
      } else if (flowResult.category.includes("ALTA PRESIÓN")) {
        baseCOP += 7500000;
      } else if (flowResult.category.includes("ESTÁNDAR")) {
        baseCOP += 3200000;
      }
    }
  } else if (service === "venta") {
    baseCOP = 5500000; // Base: $5.5M COP
    if (flowResult) {
      const flowFactor = flowResult.estimatedFlow / 12000;
      baseCOP += flowFactor * 1400000;
      if (flowResult.category.includes("CRÍTICO")) {
        baseCOP += 6000000;
      }
    }
  } else if (service === "mantenimiento") {
    baseCOP = 1800000; // Base: $1.8M COP
    if (symptomsResult) {
      // Scale by complexity score
      baseCOP += (symptomsResult.complexityScore / 100) * 1600000;
      if (symptomsResult.severity === "high") {
        baseCOP += 1400000;
      } else if (symptomsResult.severity === "medium") {
        baseCOP += 500000;
      }
    }
  } else if (service === "reparacion") {
    baseCOP = 3200000; // Base: $3.2M COP
    if (symptomsResult) {
      baseCOP += (symptomsResult.complexityScore / 100) * 2800000;
      if (symptomsResult.severity === "high") {
        baseCOP += 2500000;
      } else if (symptomsResult.severity === "medium") {
        baseCOP += 900000;
      }
    }
  }

  // Multiply by Urgencia (Alta = emergency fees, etc.)
  let multiplier = 1.0;
  if (urgencia === "alta") {
    multiplier = 1.35; // +35% emergency operational dispatch
  } else if (urgencia === "media") {
    multiplier = 1.10; // +10% priority scheduling
  }

  const finalCOP = baseCOP * multiplier;

  // Realistic range of +/- 15%
  const minCOP = Math.round((finalCOP * 0.85) / 50000) * 50000;
  const maxCOP = Math.round((finalCOP * 1.15) / 50000) * 50000;

  // Convert to USD (Assume standard conversion rate: 1 USD = 4000 COP)
  const exchangeRate = 4000;
  const minUSD = Math.round((minCOP / exchangeRate) / 50) * 50;
  const maxUSD = Math.round((maxCOP / exchangeRate) / 50) * 50;

  return {
    minCOP,
    maxCOP,
    minUSD,
    maxUSD
  };
}
