import { ServiceType } from "@/types/wizard";

export interface ServiceCardInfo {
  id: ServiceType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
}

export const SERVICE_CARDS: ServiceCardInfo[] = [
  {
    id: "fabricacion",
    title: "FABRICACIÓN DE EQUIPOS",
    subtitle: "DISEÑO A MEDIDA",
    description: "Cálculo estructural, diseño aerodinámico y balanceo dinámico de extractores centrífugos e industriales bajo normas AMCA.",
    badge: "AMCA 210 / ISO 1940"
  },
  {
    id: "venta",
    title: "SUMINISTRO DE VENTILADORES",
    subtitle: "EQUIPOS OEM CERTIFICADOS",
    description: "Suministro directo de extractores axiales, tubulares y de tejado premium para integración en sistemas de climatización e inyección forzada.",
    badge: "OEM CERTIFIED"
  },
  {
    id: "mantenimiento",
    title: "MANTENIMIENTO PREVENTIVO",
    subtitle: "CONFIABILIDAD Y CONTINUIDAD",
    description: "Análisis de vibración triaxial, termografía de motores e inspección de pérdidas de caudal para garantizar la continuidad operativa de la planta.",
    badge: "MANTENIMIENTO PREDICTIVO"
  },
  {
    id: "reparacion",
    title: "ASISTENCIA Y REPARACIÓN",
    subtitle: "SOPORTE CRÍTICO DE CAMPO",
    description: "Intervenciones correctivas urgentes en sitio, alineación láser de transmisiones, balanceo de turbinas e intercambio de rodamientos.",
    badge: "INGENIERÍA DE CAMPO 24/7"
  }
];

export interface EnvironmentInfo {
  id: string;
  name: string;
  renewalRange: string;
  description: string;
}

export const ENVIRONMENTS: EnvironmentInfo[] = [
  {
    id: "heavy_plant",
    name: "Planta Metalúrgica / Fundición Pesada (Siderúrgica)",
    renewalRange: "30 - 45 renovaciones/hora",
    description: "Ambientes expuestos a altas temperaturas, gases pesados o polvos abrasivos que exigen extracción forzada continua."
  },
  {
    id: "data_center",
    name: "Centro de Carga y Datos de Alta Densidad (Data Center Tier III/IV)",
    renewalRange: "20 - 30 renovaciones/hora",
    description: "Instalaciones críticas con disipación térmica severa y exigencia estricta de filtración de micropartículas."
  },
  {
    id: "warehouse",
    name: "Centro de Distribución Logística Masiva (Hub de Carga)",
    renewalRange: "10 - 15 renovaciones/hora",
    description: "Naves industriales de gran volumen que requieren barrido de aire y control de confort térmico y humedad."
  },
  {
    id: "mining",
    name: "Galería de Extracción Minera Subterránea (Socavón)",
    renewalRange: "45 - 60 renovaciones/hora",
    description: "Operaciones mineras de alta profundidad con ventilación por soplado o aspiración para dilución de gases explosivos."
  }
];

export interface SymptomInfo {
  id: string;
  label: string;
  description: string;
}

export const MAINTENANCE_SYMPTOMS: SymptomInfo[] = [
  { id: "preventivo", label: "Mantenimiento rutinario de intervalo", description: "Inspección planificada por horas de operación transcurridas." },
  { id: "eficiencia", label: "Pérdida de eficiencia volumétrica", description: "Disminución gradual del caudal o renovación de aire en el recinto." },
  { id: "desgaste", label: "Signos leves de desgaste mecánico", description: "Desgaste menor observado en rodamientos, bandas o poleas de transmisión." },
  { id: "vibracion_sutil", label: "Vibraciones mecánicas sutiles", description: "Vibración de baja amplitud registrada dentro de rangos tolerables de alarma inicial." },
  { id: "consumo", label: "Incremento del consumo energético", description: "Elevación menor de amperaje o caída sutil del factor de potencia en vacío." },
  { id: "monitoreo", label: "Instalación de monitoreo predictivo", description: "Requerimiento de instrumentación con sensores de vibración/temperatura continuos." }
];

export const REPAIR_SYMPTOMS: SymptomInfo[] = [
  { id: "falla_critica", label: "Falla catastrófica / Parada de planta", description: "Interrupción total del proceso productivo por inoperabilidad del extractor." },
  { id: "no_enciende", label: "El extractor/motor no enciende", description: "El arrancador o variador de frecuencia reporta falla y bloquea el arranque." },
  { id: "humo", label: "Presencia de humo u olor a quemado", description: "Evidencia de sobrecalentamiento extremo en el devanado del motor o chumaceras." },
  { id: "falla_electrica", label: "Fluctuaciones o cortocircuitos eléctricos", description: "Disparos recurrentes de protecciones térmicas o fallas de aislamiento a tierra." },
  { id: "ruido_severo", label: "Ruido severo o golpeteo mecánico extremo", description: "Ruido metálico o golpeteo de alta intensidad por desbalance dinámico de aspas." },
  { id: "danos_estructurales", label: "Daños estructurales visibles", description: "Fracturas en álabes, deformación de la voluta o fisuras en soldaduras de soporte." }
];
