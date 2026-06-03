"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Building, 
  Target, 
  Award, 
  Users, 
  History, 
  Wrench, 
  CheckCircle2,
  ChevronRight,
  MapPin,
  FileCheck
} from "lucide-react";
import Link from "next/link";

interface TimelineItem {
  year: string;
  title: string;
  desc: string;
}

const TIMELINE_DATA: TimelineItem[] = [
  {
    year: "2015",
    title: "Fundación y Taller Local",
    desc: "Apertura del primer centro de mantenimiento de rotores y ventiladores en Barranquilla, atendiendo la zona franca y puertos locales."
  },
  {
    year: "2018",
    title: "Expansión Metalmecánica B2B",
    desc: "Inversión en maquinaria de corte láser CNC de gran escala y hornos de forja, permitiendo iniciar la fabricación de volutas y extractores centrífugos propios."
  },
  {
    year: "2021",
    title: "Certificación HSEQ & Acreditación Nacional",
    desc: "Obtención de la certificación ISO 9001 de gestión de calidad e ISO 45001 de seguridad en el trabajo, consolidando la operación con cementeras y mineras."
  },
  {
    year: "2024",
    title: "Lanzamiento de CYH OS",
    desc: "Digitalización de la preingeniería termodinámica y el dimensionamiento de ventilación, permitiendo cotizaciones computacionales de alta velocidad y diagnósticos B2B."
  }
];

export default function EmpresaPage() {
  const [activeTab, setActiveTab] = useState<"capacidades" | "certificaciones" | "hseq">("capacidades");

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-16 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        
        {/* Hero Header */}
        <div className="pt-8 pb-4">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display text-5xl md:text-7xl tracking-wide uppercase leading-tight">
              Ingeniería de Flujo con <br />
              <span className="text-accent-cyan">Confiabilidad Absoluta</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
              En CYH Ventilación Industrial desarrollamos soluciones mecánicas, térmicas y fluidodinámicas forjadas bajo estándares de alta ingeniería en Barranquilla, Colombia, para abastecer infraestructuras críticas en LATAM.
            </p>
          </div>
        </div>

        {/* Misión, Visión and Core stats split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Misión */}
          <div className="border border-border-subtle bg-bg-secondary/10 p-8 rounded-sm space-y-4">
            <div className="flex items-center gap-2.5 text-accent-cyan">
              <Target className="h-6 w-6" />
              <h3 className="font-display text-2xl tracking-wider uppercase">Nuestra Misión B2B</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Asegurar la continuidad operativa de la gran industria del Caribe y el continente latinoamericano a través del suministro, fabricación y diagnóstico predictivo de unidades de flujo de aire de alta capacidad, optimizando el consumo energético y garantizando la total seguridad laboral y ambiental en entornos críticos.
            </p>
          </div>

          {/* Visión */}
          <div className="border border-border-subtle bg-bg-secondary/10 p-8 rounded-sm space-y-4">
            <div className="flex items-center gap-2.5 text-accent-cyan">
              <Award className="h-6 w-6" />
              <h3 className="font-display text-2xl tracking-wider uppercase">Visión de Ingeniería</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Consolidarnos para el 2030 como el principal fabricante y comisionador tecnológico de sistemas de ventilación forzada e inyección en el norte de Sudamérica y Centroamérica, liderando la transición hacia la ventilación inteligente basada en telemetría de vibración computacional en la nube.
            </p>
          </div>

        </div>

        {/* Interactive Tabs for Capacidades, Certificaciones and HSEQ */}
        <div className="border border-border-subtle bg-bg-secondary/20 p-6 rounded-sm space-y-8">
          
          {/* Tabs header list */}
          <div className="flex border-b border-border-subtle pb-3 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("capacidades")}
              className={`font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap ${
                activeTab === "capacidades"
                  ? "text-accent-cyan border-b-2 border-accent-cyan font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              [+] Capacidades Industriales
            </button>
            
            <button
              onClick={() => setActiveTab("certificaciones")}
              className={`font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap ${
                activeTab === "certificaciones"
                  ? "text-accent-cyan border-b-2 border-accent-cyan font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              [+] Certificaciones Colombia
            </button>
            
            <button
              onClick={() => setActiveTab("hseq")}
              className={`font-mono text-xs uppercase tracking-widest pb-2 px-1 transition-all whitespace-nowrap ${
                activeTab === "hseq"
                  ? "text-accent-cyan border-b-2 border-accent-cyan font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              [+] Seguridad Industrial & HSEQ
            </button>
          </div>

          {/* Dynamic Content render */}
          <div className="min-h-[220px]">
            {activeTab === "capacidades" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-4">
                  <h4 className="font-display text-xl tracking-wide uppercase text-text-primary">
                    Taller Mecánico en Vía 40, Barranquilla
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Contamos con una planta industrial propia de 2,400 m² equipada con maquinaria de precisión CNC pesada para el corte y rolado de lámina de acero hasta calibre 3/8”, balanceadoras dinámicas de banco calibradas bajo normas ISO, y laboratorios de pruebas aerodinámicas con túnel de viento instrumentado.
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-accent-cyan uppercase">
                    <MapPin className="h-4 w-4" /> Ubi: Zona Industrial Vía 40, Atlántico
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-mono text-[9px] text-text-muted uppercase tracking-wider font-bold">
                    VECTOR DE CAPACIDADES CLAVE:
                  </h5>
                  <ul className="space-y-1.5 font-mono text-[10px] text-text-secondary">
                    <li className="flex items-center gap-2"><span className="text-success">[✓]</span> Balanceo dinámico in-situ y en banco hasta 5 toneladas.</li>
                    <li className="flex items-center gap-2"><span className="text-success">[✓]</span> Soldadores homologados ASME Sección IX.</li>
                    <li className="flex items-center gap-2"><span className="text-success">[✓]</span> Modelado fluidodinámico computacional CFD interno.</li>
                    <li className="flex items-center gap-2"><span className="text-success">[✓]</span> Comisionamiento y alineación láser portátil.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "certificaciones" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-4">
                  <h4 className="font-display text-xl tracking-wide uppercase text-text-primary">
                    Garantía de Calidad y Cumplimiento Normativo
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Nuestros procesos operativos y de ingeniería están completamente auditados y certificados por organismos reguladores nacionales, garantizando que cada impulsor fabricado cumpla estrictamente con la reglamentación eléctrica y de seguridad nacional.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-[10px] text-text-secondary">
                  <div className="flex items-start gap-2.5 p-3.5 bg-bg-primary/50 border border-border-subtle/50 rounded-sm">
                    <ShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-text-primary font-bold block uppercase">RETIE / NTC 2050 (Colombia)</span>
                      <p className="text-[9px] text-text-muted normal-case leading-normal">
                        Cumplimiento obligatorio en el cableado, megado de motores y acometidas de fuerza de todos nuestros equipos instalados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 bg-bg-primary/50 border border-border-subtle/50 rounded-sm">
                    <FileCheck className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-text-primary font-bold block uppercase">ISO 9001:2015 Certificado</span>
                      <p className="text-[9px] text-text-muted normal-case leading-normal">
                        Certificado internacional de gestión de calidad en los procesos de cálculo de ingeniería, compras de material y soldadura.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hseq" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-4">
                  <h4 className="font-display text-xl tracking-wide uppercase text-text-primary">
                    Cultura de Cero Accidentes HSEQ
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    En CYH Ingeniería priorizamos la vida humana sobre cualquier factor productivo. Toda intervención en sitio de nuestro personal de campo cuenta con protocolos estrictos de bloqueo de energías (LOTO), análisis de trabajo seguro (ATS) y el debido cumplimiento de las resoluciones de seguridad vigentes en Colombia.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-mono text-[9px] text-text-muted uppercase tracking-wider font-bold">
                    POLÍTICA Y NORMAS APLICADAS DE CAMPO:
                  </h5>
                  <ul className="space-y-1.5 font-mono text-[10px] text-text-secondary">
                    <li className="flex items-center gap-2"><span className="text-accent-cyan">[▶]</span> ISO 45001:2018 (Seguridad y Salud en el Trabajo).</li>
                    <li className="flex items-center gap-2"><span className="text-accent-cyan">[▶]</span> Resolución 5018 de MinTrabajo (Seguridad en instalaciones eléctricas).</li>
                    <li className="flex items-center gap-2"><span className="text-accent-cyan">[▶]</span> Coordinadores de alturas certificados bajo Resolución 4272.</li>
                    <li className="flex items-center gap-2"><span className="text-accent-cyan">[▶]</span> Protocolo LOTO de bloqueo mecánico y eléctrico estricto en plantas.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Vertical Interactive Timeline */}
        <div className="space-y-8">
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <span className="font-mono text-[10px] text-accent-cyan tracking-widest uppercase font-bold">HISTORIA COHERENTE</span>
            <h3 className="font-display text-3xl tracking-wide uppercase">Trayectoria del Grupo</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Consistencia absoluta y madurez B2B a lo largo de una década de ingeniería de flujo y mantenimiento predictivo en Colombia.
            </p>
          </div>

          <div className="relative border-l border-border-subtle max-w-2xl mx-auto pl-6 md:pl-8 space-y-12">
            {TIMELINE_DATA.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Visual bullet */}
                <div className="absolute -left-[30px] md:-left-[38px] top-1 h-4 w-4 rounded-full border border-accent-cyan bg-bg-primary flex items-center justify-center">
                  <span className="h-1.5 w-1.5 bg-accent-cyan rounded-full group-hover:scale-125 transition-transform"></span>
                </div>
                
                <div className="space-y-2">
                  <span className="font-mono text-sm font-bold text-accent-cyan bg-accent-cyan-soft border border-accent-cyan/20 px-2 py-0.5 rounded-sm">
                    {item.year}
                  </span>
                  <h4 className="font-display text-xl uppercase tracking-wider text-text-primary">
                    {item.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic bottom CTA block */}
        <div className="border border-border-subtle bg-bg-secondary/20 p-8 rounded-sm text-center space-y-4">
          <h3 className="font-display text-2xl tracking-wide uppercase text-text-primary">
            ¿Requiere consultar nuestra capacidad instalada?
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl mx-auto">
            Descargue nuestro dossier corporativo digital o agende una videoconferencia técnica con un ingeniero especialista de proyectos residiendo en Barranquilla.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/contacto"
              className="px-5 py-2.5 border border-border-medium hover:border-accent-cyan text-text-primary hover:text-accent-cyan font-mono text-[10px] tracking-wider uppercase rounded-sm transition-colors"
            >
              Contactar Oficina B2B
            </Link>
            
            <Link 
              href="/cotizador"
              className="px-6 py-2.5 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-mono text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all"
            >
              Dimensionar mi Proyecto
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
