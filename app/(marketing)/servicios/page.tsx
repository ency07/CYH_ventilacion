"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ArrowRight, 
  Settings, 
  Factory, 
  Wrench, 
  Activity, 
  Maximize, 
  Cpu, 
  Gauge, 
  Zap, 
  ClipboardCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface ServiceDetail {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  alcance: string[];
  proceso: string[];
  industrias: string[];
  tiempos: string;
  entregables: string[];
  normativa: string;
}

const SERVICES_DATA: ServiceDetail[] = [
  {
    id: "fabricacion",
    icon: <Factory className="h-7 w-7 text-accent-cyan" />,
    title: "Fabricación de Ventiladores y Extractores a Medida",
    subtitle: "INGENIERÍA ESTRUCTURAL Y DE FLUIDOS",
    description: "Cálculo aerodinámico y fabricación a medida de unidades de flujo de aire (centrífugas, axiales y helicoidales) adaptadas a entornos de alta exigencia química y mecánica.",
    alcance: [
      "Unidades centrífugas de simple y doble aspiración hasta 80,000 m³/h.",
      "Ventiladores axiales de álabes orientables en aluminio fundido.",
      "Aleaciones resistentes: Acero ASTM A514, Inoxidable AISI 316, Titanio.",
      "Recubrimientos anticorrosivos C5-M para resistir la brisa salina del Caribe."
    ],
    proceso: [
      "1. Simulación Termodinámica: Modelado CFD del comportamiento de aire y presiones.",
      "2. Análisis por Elementos Finitos (FEA): Verificación de cargas mecánicas y frecuencias naturales del impulsor.",
      "3. Corte y Forja de Taller: Procesos bajo estándares de precisión controlados por láser.",
      "4. Ensamble, QA/QC y Comisionamiento final bajo protocolos AMCA."
    ],
    industrias: [
      "Puertos industriales, Cementeras del Atlántico, Minería de Carbón, Plantas químicas."
    ],
    tiempos: "15 a 30 días hábiles (dependiendo de la escala estructural y materiales)",
    entregables: [
      "Planos estructurales y de conjunto firmados por Ingeniero Mecánico.",
      "Reporte de simulación fluidodinámica computacional (CFD).",
      "Certificado oficial de balanceo estático y dinámico ISO 1940."
    ],
    normativa: "AMCA 210, AMCA 300, ISO 1940, ASTM A36/A514"
  },
  {
    id: "mantenimiento",
    icon: <Wrench className="h-7 w-7 text-accent-cyan" />,
    title: "Mantenimiento Industrial y Rehabilitación",
    subtitle: "EXTENSIÓN DE VIDA ÚTIL DE INFRAESTRUCTURA",
    description: "Servicios integrales de mantenimiento preventivo, correctivo y de emergencia para turbinas de ventilación pesada, variadores y redes de ductería.",
    alcance: [
      "Rehabilitación total de volutas y carcasas con metalizado de refuerzo.",
      "Cambio preventivo de chumaceras, rodamientos SKF/FAG y retenedores.",
      "Ajuste y tensión de transmisiones por bandas y poleas trapezoidales.",
      "Comprobación de aislamiento y megado de devanados de motores trifásicos."
    ],
    proceso: [
      "1. Desenergización e Inspección: Bloqueo de seguridad LOTO en sitio.",
      "2. Limpieza Técnica: Remoción criogénica o por chorro de arena en aspas.",
      "3. Inspección por Ensayos No Destructivos (NDT): Tintas penetrantes en álabes.",
      "4. Corrección e Instrumentación de parámetros de arranque."
    ],
    industrias: [
      "Plantas avícolas, Agroindustria del Magdalena, Procesamiento de alimentos."
    ],
    tiempos: "2 a 5 días hábiles para paradas programadas de planta (Disponibilidad 24/7 emergencias)",
    entregables: [
      "Bitácora detallada de tolerancias de montaje de rodamientos.",
      "Certificado de integridad estructural de aspas por NDT.",
      "Protocolo de puesta en marcha seguro y firma de aceptación técnica."
    ],
    normativa: "Resolución 5018 Colombia, ISO 10816, OSHA 1910"
  },
  {
    id: "balanceo",
    icon: <Activity className="h-7 w-7 text-accent-cyan" />,
    title: "Balanceo Dinámico Vibracional In-Situ",
    subtitle: "MINIMIZACIÓN DE VIBRACIONES MECÁNICAS",
    description: "Corrección analítica del desbalance de masa en rotores, turbinas y poleas directamente en la planta del cliente, reduciendo significativamente el desgaste prematuro de rodamientos.",
    alcance: [
      "Balanceo estático y dinámico en 1 y 2 planos para rotores industriales.",
      "Compensación de desbalance hasta grado G2.5 según norma ISO 1940.",
      "Rango operativo: Rotores desde 5 kg hasta 5,000 kg a revoluciones de trabajo.",
      "Instrumentación de precisión portátil con analizadores triaxiales calibrados."
    ],
    proceso: [
      "1. Medición de Vibración Base: Análisis espectral FFT para aislar el desbalance.",
      "2. Masa de Prueba: Cálculo vectorial y soldadura de pesas calibradas temporales.",
      "3. Adición de Masa Definitiva: Aplicación de contrapesos estructurales mediante soldadura clasificada.",
      "4. Verificación de Tolerancia: Confirmación de caída de vibración dentro de rangos ISO."
    ],
    industrias: [
      "Cementeras, Data Centers Tier III/IV, Siderúrgicas, Extractores portuarios."
    ],
    tiempos: "6 a 12 horas en sitio por unidad turbina",
    entregables: [
      "Reporte vectorial pre y post balanceo.",
      "Espectro FFT de amplitud vs frecuencia para certificación de vibración.",
      "Garantía operativa de balanceo estructural."
    ],
    normativa: "ISO 1940-1 Grado G2.5 / G1.0, ISO 10816-3"
  },
  {
    id: "alineacion",
    icon: <Maximize className="h-7 w-7 text-accent-cyan" />,
    title: "Alineación Láser de Transmisiones",
    subtitle: "COHERENCIA GEOMÉTRICA DE EJE Y ACOPLAMIENTO",
    description: "Corrección de desalineación angular y paralela entre ejes de motor y turbina con precisión de centésimas de milímetro para optimizar el consumo de energía.",
    alcance: [
      "Alineación de acoplamientos directos (flexibles, rígidos, engranajes).",
      "Alineación de poleas en sistemas de transmisión por bandas por emisor láser doble.",
      "Compensación por dilatación térmica para máquinas operativas calientes.",
      "Eliminación del fenómeno de 'pata coja' (soft foot) en anclajes base."
    ],
    proceso: [
      "1. Verificación Inicial: Inspección de pernos de base y planicidad.",
      "2. Telemetría Láser: Montaje de sensores en ejes y rotación manual 180°.",
      "3. Cálculo Computacional: El sistema portátil computa las calzas necesarias.",
      "4. Ajuste de Micrómetro: Movimiento físico controlado del motor y reapriete torque."
    ],
    industrias: [
      "Agroindustria pesada, Centros logísticos, Puertos, Extracción de humos."
    ],
    tiempos: "4 a 8 horas en sitio por tren de transmisión",
    entregables: [
      "Reporte digital del alineador láser mostrando tolerancias angulares finales.",
      "Gráfico 3D de geometría de ejes.",
      "Recomendación de torque y calzas de acero inoxidable utilizadas."
    ],
    normativa: "ISO 10816, Tolerancias estándar del fabricante (OEM)"
  },
  {
    id: "hvac",
    icon: <Cpu className="h-7 w-7 text-accent-cyan" />,
    title: "Sistemas HVAC Industrial y Salas de Carga",
    subtitle: "CLIMATIZACIÓN INDUSTRIAL Y CONTROL TÉRMICO",
    description: "Diseño, dimensionamiento e instalación de sistemas de climatización tipo paquete, chillers y filtrado absoluto para centros de datos de alta densidad y salas críticas.",
    alcance: [
      "Diseño de ciclos termodinámicos de refrigeración de alta capacidad.",
      "Sistemas de presurización de salas eléctricas y cuartos de control.",
      "Etapas de filtración HEPA, MERV 13/14 con control microbiológico.",
      "Integración de variadores de velocidad para optimización de flujo parcial."
    ],
    proceso: [
      "1. Balance Térmico: Cálculo de cargas térmicas internas en Watts/BTU.",
      "2. Diseño de Ductos: Dimensionamiento hidrodinámico por fricción constante.",
      "3. Montaje de Envolvente: Fijación sismorresistente bajo especificaciones NSR-10.",
      "4. Puesta en marcha, calibración del caudal e inyección de aire estéril."
    ],
    industrias: [
      "Data Centers en Zona Franca Barranquilla, Laboratorios farmacéuticos, Salas eléctricas."
    ],
    tiempos: "20 a 45 días hábiles para proyectos de mediana/alta escala",
    entregables: [
      "Memoria de cálculo de carga térmica firmada por Ingeniero de HVAC.",
      "Isométricos de ductería en formato 3D/CAD.",
      "Plan de comisionamiento de caudal y balances de presión en salas."
    ],
    normativa: "ASHRAE 62.1, ASHRAE 90.1, NTC 2050, NSR-10"
  },
  {
    id: "automatizacion",
    icon: <Gauge className="h-7 w-7 text-accent-cyan" />,
    title: "Automatización y Tableros de Control",
    subtitle: "INTEGRACIÓN ELÉCTRICA Y COMUNICACIÓN SCADA",
    description: "Diseño y armado de tableros eléctricos de fuerza y control automatizados con PLC y variadores de frecuencia, con protocolos de comunicación SCADA.",
    alcance: [
      "Armado de tableros de arranque suave y variadores de velocidad hasta 150 HP.",
      "Integración de PLCs (Siemens S7-1200, Schneider Electric).",
      "Tableros con protección marina IP66 en acero inoxidable.",
      "Integración de pantallas HMI locales para telemetría directa."
    ],
    proceso: [
      "1. Diseño del Esquema: Modelado de planos eléctricos unifilares en EPLAN.",
      "2. Armado de Gabinete: Distribución física interna, cableado bajo norma RETIE.",
      "3. Programación de Lógica: Lógica de lazo cerrado PLC y comunicación Modbus/Ethernet.",
      "4. FAT Tests (Pruebas de aceptación en fábrica) y energización controlada."
    ],
    industrias: [
      "Procesamiento industrial en Vía 40, Cementeras, Minería, Puertos."
    ],
    tiempos: "10 a 20 días hábiles",
    entregables: [
      "Plano eléctrico multifilar unifilar completo (AutoCAD/EPLAN).",
      "Código fuente de lógica de PLC documentado.",
      "Certificado de conformidad RETIE firmado por inspector acreditado."
    ],
    normativa: "RETIE, NTC 2050, IEC 61439, IEC 60204"
  },
  {
    id: "predictivo",
    icon: <Zap className="h-7 w-7 text-accent-cyan" />,
    title: "Mantenimiento Predictivo Integrado",
    subtitle: "MÁXIMA DISPONIBILIDAD SIN PARADAS INESPERADAS",
    description: "Monitoreo tecnológico proactivo mediante termografía infrarroja, análisis triaxial de vibraciones FFT y análisis de firmas de corriente de motor.",
    alcance: [
      "Rutas de monitoreo periódico de vibración en chumaceras y carcasas de ventilador.",
      "Inspecciones termográficas en uniones de fuerza de arrancadores y motores.",
      "Análisis espectral FFT de fallas electromecánicas (holguras, excentricidades).",
      "Integración de sensores de vibración inalámbricos con visualización SCADA remota."
    ],
    proceso: [
      "1. Planificación de Rutas: Mapeo de trenes de máquinas críticas de la planta.",
      "2. Toma de Datos en Sitio: Captura de espectros de vibración y termogramas.",
      "3. Análisis Computacional: Comparación de firmas espectrales con estándares ISO.",
      "4. Diagnóstico Técnico detallado alertando fallas en etapa inicial."
    ],
    industrias: [
      "Siderúrgica pesada, Puertos del Caribe, Centros logísticos, Minería de Carbón."
    ],
    tiempos: "Ruta periódica mensual / Reporte en 48hs post medición",
    entregables: [
      "Reporte analítico de vibraciones por máquina con firmas FFT y diagnósticos.",
      "Termograma de puntos calientes con cuantificación de severidad térmica.",
      "Plan de acción preventivo con prioridades (Baja, Alarma, Crítica)."
    ],
    normativa: "ISO 10816-3, ISO 18436, ISO 20816, NTC 2050"
  }
];

export default function ServiciosPage() {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    SERVICES_DATA.forEach((srv) => {
      const el = document.getElementById(srv.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-16 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-12">
        
        {/* Hero Header */}
        <div className="pt-8 pb-4">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display text-5xl md:text-7xl tracking-wide uppercase leading-tight">
              Ingeniería y Servicios <br className="hidden md:inline" />
              de <span className="text-accent-cyan">Flujo de Aire</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
              Ejecutamos proyectos integrales de diseño mecánico, comisionamiento, balanceo in-situ, control eléctrico y predictivo para optimizar el flujo aerodinámico bajo estrictas normativas nacionales colombianas.
            </p>
          </div>
        </div>

        {/* Services Navigation Sidebar / Anchor Menu */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
          
          {/* Left Anchor Navigation Panel */}
          <div className="lg:sticky lg:top-24 space-y-4 font-mono text-sm uppercase tracking-widest lg:col-span-1">
            <div className="border border-border-subtle bg-bg-secondary/30 p-4 rounded-sm">
              <span className="text-text-muted block mb-3 border-b border-border-subtle pb-1.5 font-bold">MENÚ DE CAPACIDADES:</span>
              <ul className="space-y-2 text-text-secondary font-semibold">
                {SERVICES_DATA.map((srv) => (
                  <li key={srv.id}>
                    <a 
                      href={`#${srv.id}`} 
                      className={`flex items-center justify-between group transition-colors px-3 py-2 rounded-sm ${
                        activeSection === srv.id 
                          ? "bg-accent-cyan/10 text-accent-cyan font-bold border-l-2 border-accent-cyan" 
                          : "hover:text-accent-cyan hover:bg-bg-secondary border-l-2 border-transparent"
                      }`}
                    >
                      <span>{srv.id.replace("_", " ")}</span>
                      <ChevronRight className={`h-4 w-4 transition-all ${activeSection === srv.id ? "text-accent-cyan translate-x-0.5" : "text-text-muted group-hover:text-accent-cyan group-hover:translate-x-0.5"}`} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-border-subtle bg-bg-secondary/30 p-4 rounded-sm space-y-4 text-center">
              <span className="text-accent-cyan block font-bold text-sm">ASISTENCIA CARIBE</span>
              <p className="text-sm text-text-secondary normal-case leading-relaxed">
                Ingenieros residentes en Barranquilla con disponibilidad inmediata de campo para puertos, cementeras y data centers.
              </p>
              <Link 
                href="/cotizador"
                className="w-full inline-block py-2 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-bold tracking-wider uppercase rounded-sm transition-all text-sm"
              >
                COTIZAR REQUERIMIENTO
              </Link>
            </div>
          </div>

          {/* Right Detailed Cards List */}
          <div className="lg:col-span-3 space-y-16">
            {SERVICES_DATA.map((service) => (
              <div 
                id={service.id} 
                key={service.id}
                className="scroll-mt-24 border border-border-subtle bg-bg-secondary/10 p-6 md:p-8 rounded-sm relative overflow-hidden space-y-6 hover:border-accent-cyan/20 transition-colors"
              >
                {/* Visual anchor bar */}
                <div className="absolute left-0 top-0 h-full w-[4px] bg-accent-cyan" />
                
                {/* Header info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-bg-secondary border border-border-subtle rounded-sm text-accent-cyan">
                    {service.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-text-muted tracking-widest font-bold block">
                      {service.subtitle}
                    </span>
                    <h2 className="font-display text-2xl md:text-3xl tracking-wide uppercase text-text-primary">
                      {service.title}
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed border-b border-border-subtle/50 pb-4">
                  {service.description}
                </p>

                {/* Grid Technical Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base leading-relaxed">
                  
                  {/* Scope */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm text-accent-cyan tracking-widest uppercase font-bold flex items-center gap-1.5">
                      <span className="h-1 w-1 bg-accent-cyan rounded-full"></span> Alcance Técnico
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-4 text-text-secondary">
                      {service.alcance.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Proceso */}
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm text-accent-cyan tracking-widest uppercase font-bold flex items-center gap-1.5">
                      <span className="h-1 w-1 bg-accent-cyan rounded-full"></span> Proceso de Ingeniería
                    </h4>
                    <ul className="space-y-1.5 text-text-secondary">
                      {service.proceso.map((item, idx) => (
                        <li key={idx} className="font-semibold">{item}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Foot Technical Metadata block */}
                <div className="pt-6 border-t border-border-subtle/50 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm text-text-secondary">
                  <div className="space-y-1 border-r border-border-subtle/30 pr-4">
                    <span className="text-text-muted uppercase block">INDUSTRIAS OBJETIVO:</span>
                    <span className="text-text-primary font-bold block">{service.industrias[0]}</span>
                  </div>
                  <div className="space-y-1 border-r border-border-subtle/30 pr-4">
                    <span className="text-text-muted uppercase block">PLAZO ESTIMADO:</span>
                    <span className="text-text-primary font-bold block">{service.tiempos}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted uppercase block">COMPLIANCE NORMATIVO:</span>
                    <span className="text-accent-cyan font-bold block">{service.normativa}</span>
                  </div>
                </div>

                {/* Engineering Deliverables Block */}
                <div className="bg-bg-primary/40 border border-border-subtle/50 p-4 rounded-sm space-y-2">
                  <h4 className="font-mono text-sm text-text-primary uppercase tracking-wider font-bold">
                    Entregables de Ingeniería del Servicio:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-sm text-text-secondary mt-3">
                    {service.entregables.map((ent, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-success mt-0.5">[✓]</span> <span>{ent}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical CTA row */}
                <div className="flex justify-end pt-2">
                  <Link 
                    href={`/cotizador?servicio=${service.id === 'balanceo' || service.id === 'alineacion' || service.id === 'predictivo' ? 'mantenimiento' : service.id === 'automatizacion' ? 'venta' : service.id}`}
                    className="px-5 py-2.5 bg-bg-tertiary hover:bg-bg-secondary border border-border-subtle hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-mono text-sm font-bold tracking-wider uppercase rounded-sm transition-all flex items-center gap-1.5"
                  >
                    Cotizar este Servicio <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
