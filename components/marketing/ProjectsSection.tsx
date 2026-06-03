"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, Wind, ShieldCheck } from "lucide-react";

export default function ProjectsSection() {
  const projects = [
    {
      title: "EXTRACCIÓN FORZADA EN SOCAVÓN COBRE",
      category: "MINERÍA SUBTERRÁNEA - NORTE DE CHILE",
      description: "Implementación de un sistema de inyección y extracción forzada con ventiladores axiales de álabes orientables AMCA 210 en socavones de gran profundidad para dilución rápida de gases nocivos.",
      image: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?q=80&w=800&auto=format&fit=crop",
      stat: "420,000 M³/H CAUDAL ACTIVO",
      badge: "CONDICIÓN CRÍTICA DE PROCESO",
      icon: <Building2 className="h-5 w-5 text-accent-cyan" />
    },
    {
      title: "TERMOREGULACIÓN LAMINAR EN DATA CENTER",
      category: "CENTRO DE DATOS TIER III - SAO PAULO, BRASIL",
      description: "Diseño y despliegue de sistema de ventilación de precisión tipo Plenum con control dinámico de presión positiva y disipación térmica dirigida para pasillos fríos en racks de alta densidad.",
      image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=800&auto=format&fit=crop",
      stat: "ΔT DE -12°C OPTIMIZADO EN CARGA",
      badge: "CONTINUIDAD OPERATIVA H24",
      icon: <Wind className="h-5 w-5 text-accent-cyan" />
    },
    {
      title: "FILTRACIÓN ABSOLUTA EN PLANTA DE CEMENTO",
      category: "PLANTA DE MOLIENDA - SIBATÉ, COLOMBIA",
      description: "Instalación de unidades centrífugas airfoil de alta presión de junta soldada continua acopladas a sistemas de captación de polvo mediante filtros de mangas y cámaras plenum de descarga.",
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop",
      stat: "99.99% EFICIENCIA DE RETENCIÓN",
      badge: "CUMPLIMIENTO DE EMISIONES ISO 14001",
      icon: <ShieldCheck className="h-5 w-5 text-accent-cyan" />
    }
  ];

  return (
    <section id="proyectos" className="py-24 bg-bg-secondary/40 relative z-10 border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Title Block */}
        <div className="text-center mb-16 space-y-4">
          <span className="font-mono text-xs text-accent-cyan tracking-[0.2em] uppercase font-semibold">
            ESTUDIOS DE CASO INDUSTRIALES LATAM
          </span>
          <h2 className="font-display text-4xl md:text-6xl tracking-wide text-text-primary uppercase">
            Sistemas en Operación Real
          </h2>
          <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Consulte nuestros despliegues más exigentes, donde la preingeniería de precisión y el cumplimiento estricto de normas garantizan la continuidad operativa.
          </p>
        </div>

        {/* Dynamic Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group h-[520px] overflow-hidden rounded-sm border border-border-subtle bg-bg-primary"
            >
              
              {/* Project Image */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center grayscale brightness-[0.28] transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-[0.4]"
                style={{ backgroundImage: `url('${project.image}')` }}
              />

              {/* Grid HUD Overlay */}
              <div className="absolute inset-0 z-0 industrial-grid opacity-15" />
              
              {/* Cinematic Shadow Gradient */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />

              {/* Content Panel */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
                
                {/* Header Labels */}
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm text-accent-cyan tracking-widest uppercase border border-accent-cyan/30 px-3 py-1 rounded-sm bg-accent-cyan-soft">
                    {project.badge}
                  </span>
                  <div className="p-2 bg-bg-secondary/80 border border-border-subtle rounded-sm">
                    {project.icon}
                  </div>
                </div>

                {/* Main Descriptions */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="font-mono text-sm text-text-secondary tracking-widest uppercase">
                      {project.category}
                    </span>
                    <h3 className="font-display text-3xl tracking-wide text-text-primary uppercase group-hover:text-accent-cyan transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                    {project.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle/50">
                    <span className="font-mono text-sm text-text-muted uppercase">CAPACIDAD INSTALADA</span>
                    <span className="font-mono text-sm font-semibold text-accent-cyan">{project.stat}</span>
                  </div>
                </div>

              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
