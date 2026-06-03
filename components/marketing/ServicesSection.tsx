"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Factory, ShoppingCart, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      id: "fabricacion",
      icon: <Factory className="h-8 w-8 text-accent-cyan" />,
      title: "Fabricacion de equipos",
      description:
        "Diseno y construccion de extractores, ventiladores y sistemas de aire para condiciones reales de planta.",
      linkText: "Ver fabricacion",
    },
    {
      id: "venta",
      icon: <ShoppingCart className="h-8 w-8 text-accent-cyan" />,
      title: "Suministro industrial",
      description:
        "Seleccion de equipos, motores, repuestos y componentes adecuados para caudal, presion y ambiente de trabajo.",
      linkText: "Ver catalogo",
    },
    {
      id: "mantenimiento",
      icon: <ShieldCheck className="h-8 w-8 text-accent-cyan" />,
      title: "Mantenimiento preventivo",
      description:
        "Inspeccion, balanceo, revision mecanica y seguimiento para reducir paradas no programadas.",
      linkText: "Ver mantenimiento",
    },
    {
      id: "reparacion",
      icon: <Wrench className="h-8 w-8 text-accent-cyan" />,
      title: "Reparacion en campo",
      description:
        "Atencion tecnica para fallas, vibraciones, danos estructurales, motores y equipos detenidos.",
      linkText: "Ver soporte",
    },
  ];

  return (
    <section id="servicios" className="py-24 bg-bg-primary relative z-10 border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 mb-14 items-end">
          <div className="space-y-5">
            <span className="text-base text-accent-cyan font-semibold">
              Servicios principales
            </span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              Soluciones para todo el ciclo de vida de su sistema de ventilacion.
            </h2>
          </div>
          <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
            Acompanamos desde el diagnostico inicial hasta la instalacion,
            mantenimiento y reparacion. La idea es simple: que su planta respire
            bien y siga operando con confianza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link key={service.title} href={`/servicios#${service.id}`} className="flex w-full group/card">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="p-7 md:p-8 rounded-md border border-border-subtle bg-bg-secondary hover:border-border-medium flex flex-col justify-between min-h-[330px] w-full transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="space-y-6">
                  <div className="p-3 bg-bg-primary w-fit border border-border-subtle rounded-md">
                    {service.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-sans text-2xl font-bold text-text-primary group-hover/card:text-accent-cyan transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <span className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-accent-cyan group-hover/card:gap-3 transition-all">
                  {service.linkText}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
