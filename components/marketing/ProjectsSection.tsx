"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Wind } from "lucide-react";

export default function ProjectsSection() {
  const projects = [
    {
      title: "Ventilacion para operacion minera",
      category: "Mineria subterranea",
      description:
        "Sistema de inyeccion y extraccion forzada para renovar aire, controlar gases y mantener condiciones seguras de trabajo.",
      image:
        "https://images.unsplash.com/photo-1535813547-99c456a41d4a?q=80&w=900&auto=format&fit=crop",
      stat: "420.000 m3/h",
      icon: <Building2 className="h-5 w-5 text-accent-cyan" />,
    },
    {
      title: "Control termico en centro de datos",
      category: "Infraestructura critica",
      description:
        "Solucion de ventilacion y presion positiva para ayudar a estabilizar temperatura en zonas de alta carga.",
      image:
        "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=900&auto=format&fit=crop",
      stat: "Operacion 24/7",
      icon: <Wind className="h-5 w-5 text-accent-cyan" />,
    },
    {
      title: "Extraccion de polvo en planta",
      category: "Industria pesada",
      description:
        "Equipos centrifugos y captacion de particulas para mejorar ambiente, seguridad y cumplimiento operativo.",
      image:
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=900&auto=format&fit=crop",
      stat: "Alta retencion",
      icon: <ShieldCheck className="h-5 w-5 text-accent-cyan" />,
    },
  ];

  return (
    <section id="proyectos" className="py-24 bg-bg-secondary relative z-10 border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-14 space-y-5">
          <span className="text-base text-accent-cyan font-semibold">
            Experiencia aplicada
          </span>
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-text-primary leading-tight">
            Proyectos pensados para ambientes industriales exigentes.
          </h2>
          <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
            Cada planta tiene restricciones distintas: calor, polvo, humedad,
            gases, ruido, espacio o urgencia. Por eso el trabajo empieza con
            diagnostico y termina con una solucion que se pueda sostener en campo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              className="overflow-hidden rounded-md border border-border-subtle bg-bg-primary shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-shadow"
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url('${project.image}')` }}
              />
              <div className="p-7 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold text-accent-cyan">
                    {project.category}
                  </span>
                  <div className="p-2 bg-bg-secondary border border-border-subtle rounded-md">
                    {project.icon}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-sans text-2xl font-bold text-text-primary">
                    {project.title}
                  </h3>
                  <p className="text-base text-text-secondary leading-relaxed">
                    {project.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-border-subtle">
                  <p className="text-base font-semibold text-text-primary">
                    Resultado destacado:{" "}
                    <span className="text-accent-cyan">{project.stat}</span>
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
