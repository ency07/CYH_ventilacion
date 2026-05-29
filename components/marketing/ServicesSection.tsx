"use client";

import React from "react";
import { motion } from "framer-motion";
import { Factory, ShoppingCart, ShieldAlert, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      id: "fabricacion",
      icon: <Factory className="h-8 w-8 text-accent-cyan" />,
      title: "FABRICACIÓN",
      description: "Desarrollo a medida de unidades centrífugas, axiales y helicoidales. Forjadas con aleaciones aeroespaciales resistentes a la corrosión para entornos abrasivos.",
      linkText: "ESPECIFICACIONES DE DISEÑO",
      ref: "ISO 16890 COMPLIANT"
    },
    {
      id: "venta",
      icon: <ShoppingCart className="h-8 w-8 text-accent-cyan" />,
      title: "DISTRIBUCIÓN",
      description: "Suministro directo de motores premium de alta eficiencia, aspas y componentes certificados. Stock permanente con garantías extendidas de fabricante.",
      linkText: "CONSULTAR CATÁLOGO",
      ref: "OEM CERTIFIED PARTS"
    },
    {
      id: "mantenimiento",
      icon: <ShieldAlert className="h-8 w-8 text-accent-cyan" />,
      title: "MONITOREO",
      description: "Programas avanzados de mantenimiento basados en telemetría de vibración, temperatura y flujo. Prevención proactiva de fallas catastróficas.",
      linkText: "PLANES PREVENTIVOS",
      ref: "TELEMETRÍA PREDICTIVA"
    },
    {
      id: "reparacion",
      icon: <Wrench className="h-8 w-8 text-accent-cyan" />,
      title: "ASISTENCIA",
      description: "Servicio de reparación crítica y comisionamiento en sitio disponible 24/7. Equipos de ingeniería certificados para intervenciones en entornos de alto riesgo.",
      linkText: "ASISTENCIA CRÍTICA",
      ref: "SOPORTE 24/7 DE CAMPO"
    }
  ];

  return (
    <section id="servicios" className="py-24 bg-bg-primary relative z-10 border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Title Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="font-mono text-xs text-accent-cyan tracking-[0.2em] uppercase font-semibold">
              CAPACIDADES DE INGENIERÍA
            </span>
            <h2 className="font-display text-4xl md:text-6xl tracking-wide text-text-primary uppercase">
              Soluciones Técnicas Integrales
            </h2>
          </div>
          <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed">
            Nuestros servicios abarcan el ciclo de vida completo de la infraestructura de ventilación industrial, garantizando máxima continuidad operativa y eficiencia de consumo.
          </p>
        </div>

        {/* Dynamic Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link 
              key={service.title}
              href={`/cotizador?servicio=${service.id}`}
              className="flex w-full group/card"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-panel p-8 rounded-sm border border-border-subtle bg-bg-secondary/20 hover:border-accent-cyan/30 hover:bg-bg-secondary/40 hover:shadow-[0_4px_24px_rgba(0,212,255,0.06)] flex flex-col justify-between min-h-[360px] w-full transition-all duration-300 animate-fadeIn cursor-pointer"
              >
                <div className="space-y-6">
                  <div className="p-3 bg-bg-secondary/60 w-fit border border-border-subtle rounded-sm group-hover/card:border-accent-cyan/30 group-hover/card:bg-bg-secondary transition-all">
                    {service.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl tracking-wide text-text-primary uppercase group-hover/card:text-accent-cyan transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border-subtle/50 space-y-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-cyan group-hover/card:gap-3 transition-all">
                    {service.linkText}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <div className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
                    Ref: {service.ref}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
