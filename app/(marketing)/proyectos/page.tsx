"use client";

import React from "react";
import { 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Gauge, 
  Building, 
  CheckCircle,
  FileText,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface ProyectoCase {
  id: string;
  title: string;
  cliente: string;
  ubicacion: string;
  caudal: string;
  presion: string;
  ahorro: string;
  tiempo: string;
  problema: string;
  solucion: string;
  imagenUrl: string;
  normas: string;
}

const PROYECTOS_DATA: ProyectoCase[] = [
  {
    id: "cementera-atlantico",
    title: "Optimización de Molienda de Clinker y Extracción Abrasiva",
    cliente: "Planta Cementera del Atlántico",
    ubicacion: "Barranquilla, Colombia",
    caudal: "65,000 m³/h",
    presion: "1,800 Pa",
    ahorro: "22% de Consumo Eléctrico",
    tiempo: "25 Días Hábiles",
    problema: "Alta acumulación de polvo abrasivo de clinker en el intercambiador de calor de la línea de molienda. Causaba desgastes severos en las aspas de ventiladores previos, recalentamientos recurrentes del motor y paradas de producción imprevistas (costos de USD $45,000/hora de inactividad).",
    solucion: "Diseño aerodinámico y fabricación de dos extractores centrífugos CN-630 con álabes curvos hacia atrás de alta resistencia, forjados en Acero de Aleación ASTM A514 con blindaje adicional al cromo antidesgaste. Acoplados a motores trifásicos Super Premium IE4 controlados por variadores de frecuencia integrados con lógica PLC en lazo cerrado por sensores de presión diferencial.",
    imagenUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop",
    normas: "AMCA 210, RETIE, ISO 1940 (G2.5), ASTM A514"
  },
  {
    id: "puerto-barranquilla",
    title: "Presurización y Barrido de Humedad en Silos Portuarios",
    cliente: "Terminal Portuaria de Barranquilla (Vía 40)",
    ubicacion: "Vía 40, Barranquilla, Colombia",
    caudal: "48,000 m³/h",
    presion: "300 Pa",
    ahorro: "18% de Eficiencia Térmica",
    tiempo: "18 Días Hábiles",
    problema: "Humedad relativa extrema (superior al 85%) dentro de silos verticales metálicos de almacenamiento de granos para exportación. La falta de flujo forzado continuo generaba condensación, arriesgando la pérdida de la carga por proliferación de hongos térmicos.",
    solucion: "Instalación de un tren de ventiladores axiales de alta potencia AX-1200 Heavy Duty provistos de aspas en aluminio fundido con tratamiento galvánico por inmersión en caliente (HDG) resistente a la corrosión salina extrema C5. Conectados a compuertas de gravedad automáticas y controlados por humedad relativa para barridos cíclicos.",
    imagenUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    normas: "AMCA 300, RETIE, NTC 2050, RAS"
  },
  {
    id: "planta-alimentos",
    title: "Extracción y Control de Humedad en Línea Avícola",
    cliente: "Procesadora de Alimentos Sabanalarga",
    ubicacion: "Sabanalarga, Atlántico, Colombia",
    caudal: "22,000 m³/h",
    presion: "450 Pa",
    ahorro: "15% Ahorro Energético",
    tiempo: "12 Días Hábiles",
    problema: "Alta saturación de vapor graso caliente y condensación de humedad excesiva en la zona de faenado y escaldado, lo que comprometía los estrictos estándares sanitarios (decreto de MinSalud) y ponía en riesgo la salud de los trabajadores por estrés térmico.",
    solucion: "Rediseño completo de la red de ductos en Acero Inoxidable sanitario AISI 304 (campanas y derivaciones), instalando tres extractores helicoidales de tejado EXT-900 con domo de fibra de vidrio resistente a la intemperie. Comandados por un tablero variador IP66 con transductores de temperatura.",
    imagenUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
    normas: "MinTrabajo Resolución 2400, RETIE, ICONTEC"
  },
  {
    id: "mineria-guajira",
    title: "Ventilación Crítica y Dilución de Metano en Carbón",
    cliente: "Complejo Minero de Carbón La Guajira",
    ubicacion: "La Guajira, Colombia",
    caudal: "80,000 m³/h",
    presion: "2,800 Pa",
    ahorro: "25% de Confiabilidad de Operación",
    tiempo: "35 Días Hábiles",
    problema: "Presencia constante de gases tóxicos e inflamables (metano) acumulados en galerías profundas de socavón horizontal a más de 200 metros bajo tierra, amenazando la vida de los operadores y violando la normatividad nacional de minas.",
    solucion: "Desarrollo y montaje de un sistema de ventilación principal compuesto por dos sopladores axiales blindados con certificación ATEX Clase I División II a prueba de explosiones. Acoplados a una red de ductería flexible helicoidal de alta presión con monitoreo continuo de gas y parada de emergencia automatizada.",
    imagenUrl: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=800&auto=format&fit=crop",
    normas: "RETIE, AMCA 210, MinTrabajo, ATEX directiva"
  },
  {
    id: "hvac-data-center",
    title: "Disipación Térmica de Data Center Tier IV",
    cliente: "Centro Tecnológico Zona Franca Las Flores",
    ubicacion: "Zona Franca, Barranquilla, Colombia",
    caudal: "30,000 m³/h",
    presion: "550 Pa",
    ahorro: "30% en Climatización PUE",
    tiempo: "40 Días Hábiles",
    problema: "Inestabilidad térmica y puntos calientes localizados en salas de servidores debido a la disipación extrema bajo las temperaturas costeras de Barranquilla (superiores a 35°C), arriesgando caídas de servicio intermitentes y desgaste de componentes microprocesadores.",
    solucion: "Instalación de unidades manejadoras de aire duales de alta precisión PKG-20 con etapas de filtración MERV 14 absoluta. Programadas bajo control PID e integradas a la plataforma SCADA de la planta mediante protocolos BACnet/Modbus para modular la inyección de aire frío según la carga del rack en tiempo real.",
    imagenUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
    normas: "ASHRAE 90.1, ASHRAE 62.1, NTC 2050, ISO 16890"
  }
];

export default function ProyectosPage() {
  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-16 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-12">
        
        {/* Hero Header */}
        <div className="pt-8 pb-4">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display text-5xl md:text-7xl tracking-wide uppercase leading-tight">
              Casos de Éxito y <br className="hidden md:inline" />
              <span className="text-accent-cyan">Proyectos Clave</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
              Consulte nuestra trayectoria en el Caribe. Diseñamos soluciones estructurales, de flujo aerodinámico y disipación térmica severa con resultados medibles de ahorro de energía y cumplimiento normativo.
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-16">
          {PROYECTOS_DATA.map((proy, idx) => (
            <div 
              key={proy.id}
              className="border border-border-subtle bg-bg-secondary/10 p-6 md:p-8 rounded-sm relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 hover:border-accent-cyan/20 transition-all duration-300"
            >
              {/* Decorative side block */}
              <div className="absolute left-0 top-0 h-full w-[4px] bg-accent-cyan" />

              {/* Photo Mockup (Left Column 4/12) */}
              <div className="lg:col-span-4 relative h-64 lg:h-auto rounded-sm overflow-hidden border border-border-subtle group">
                <div 
                  className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  style={{ backgroundImage: `url('${proy.imagenUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 font-mono text-[9px] text-accent-cyan tracking-wider uppercase font-bold border border-accent-cyan/30 bg-bg-secondary/80 px-2 py-1 rounded-sm">
                  {proy.cliente}
                </div>
              </div>

              {/* Detail block (Right Column 8/12) */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
                      Lugar: {proy.ubicacion}
                    </span>
                    <span className="h-1.5 w-1.5 bg-border-medium rounded-full" />
                    <span className="font-mono text-[9px] text-accent-cyan font-bold tracking-wider">
                      CUMPLIMIENTO: {proy.normas}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl tracking-wide uppercase text-text-primary">
                    {proy.title}
                  </h3>
                </div>

                {/* Problem vs Solution Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base leading-relaxed">
                  <div className="space-y-1.5 border-l border-border-subtle/80 pl-3">
                    <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-bold">
                      [+] PROBLEMA TÉCNICO
                    </h4>
                    <p className="text-text-secondary">
                      {proy.problema}
                    </p>
                  </div>
                  <div className="space-y-1.5 border-l border-accent-cyan/50 pl-3">
                    <h4 className="font-mono text-[9px] text-accent-cyan uppercase tracking-widest font-bold">
                      [+] SOLUCIÓN DE INGENIERÍA
                    </h4>
                    <p className="text-text-secondary">
                      {proy.solucion}
                    </p>
                  </div>
                </div>

                {/* Technical telemetry metrics grid */}
                <div className="pt-6 border-t border-border-subtle/50 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[9px] text-text-secondary">
                  <div className="space-y-1">
                    <span className="text-text-muted uppercase block">Caudal Operativo</span>
                    <span className="text-accent-cyan font-bold text-base block flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" /> {proy.caudal}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted uppercase block">Presión de Trabajo</span>
                    <span className="text-text-primary font-bold text-base block">
                      {proy.presion}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted uppercase block">Ahorro Energético</span>
                    <span className="text-success font-bold text-base block flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> {proy.ahorro}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-text-muted uppercase block">Tiempo Ejecución</span>
                    <span className="text-text-primary font-bold text-base block flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {proy.tiempo}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

        {/* Dynamic bottom CTA block */}
        <div className="border border-accent-cyan/20 bg-bg-secondary/40 p-8 rounded-sm text-center relative overflow-hidden space-y-4">
          <h3 className="font-display text-2xl tracking-wide uppercase text-text-primary">
            ¿Busca un comisionamiento similar para su planta?
          </h3>
          <p className="text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
            Agende un análisis de preingeniería asistido en sitio por nuestro equipo residente en Barranquilla para evaluar pérdidas de caudal y desalineaciones mecánicas.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/contacto"
              className="px-5 py-2.5 border border-border-medium hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-mono text-[10px] tracking-wider uppercase rounded-sm transition-colors"
            >
              Agendar Visita en Sitio
            </Link>
            
            <Link 
              href="/cotizador"
              className="px-6 py-2.5 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-mono text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all"
            >
              Dimensionar mi Extractor Ahora
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
