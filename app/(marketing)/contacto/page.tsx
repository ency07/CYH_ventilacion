"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Globe
} from "lucide-react";
import Link from "next/link";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    mensaje: "",
    urgencia: "baja"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating a real premium B2B submission feel
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormData({
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      mensaje: "",
      urgencia: "baja"
    });
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pt-24 pb-16 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-12">
        
        {/* Hero Header */}
        <div className="pt-8 pb-4">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display text-5xl md:text-7xl tracking-wide  leading-tight">
              Hable con un <br />
              <span className="text-accent-cyan">Ingeniero Especialista</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
              Respuesta inmediata a cotizaciones, solicitudes de visita técnica y emergencias mecánicas 24/7 en silos, cementeras, puertos y plantas del Caribe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Left Column: Form capture (3/5) */}
          <form 
            onSubmit={handleSubmit}
            className="lg:col-span-3 border border-border-subtle bg-bg-secondary/10 p-6 md:p-8 rounded-sm space-y-6"
          >
            <span className="font-mono text-[10px] text-accent-cyan tracking-wider uppercase font-semibold block border-b border-border-subtle/50 pb-2">
              [+] FORMULARIO DE REQUERIMIENTO TÉCNICO
            </span>

            {submitSuccess && (
              <div className="flex items-start gap-2.5 p-4 bg-success/10 border border-success/30 rounded-sm text-success animate-fadeIn font-mono text-[11px] leading-relaxed">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block uppercase">Registro Sincronizado</span>
                  Hemos recibido su solicitud de ingeniería. Un especialista de CYH residente en Barranquilla se comunicará con usted en menos de 2 horas hábiles.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Ing. Juan Gómez"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                />
              </div>

              {/* Empresa */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Razón Social / Empresa
                </label>
                <input
                  type="text"
                  required
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Ej. Cementos del Norte"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej. j.gomez@empresa.com"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej. +57 300 987 6543"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                />
              </div>

              {/* Urgencia */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Urgencia Operativa
                </label>
                <select
                  value={formData.urgencia}
                  onChange={(e) => setFormData({ ...formData, urgencia: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all"
                >
                  <option value="baja">Planificación Futura (Baja)</option>
                  <option value="media">Mantenimiento Programado Trimestral (Media)</option>
                  <option value="alta">Falla crítica en planta / Asistencia Urgente (Alta)</option>
                </select>
              </div>

              {/* Mensaje */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-mono text-[9px] text-text-secondary uppercase tracking-widest font-bold">
                  Detalle del Requerimiento / Síntomas del Sistema
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Describa el diámetro, caudal estimado, vibración excesiva o requerimiento de balanceo..."
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-base text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-semibold text-base tracking-wider uppercase rounded-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,212,255,0.15)] disabled:opacity-50"
            >
              {isSubmitting ? (
                "TRANSMITIENDO DATOS..."
              ) : (
                <>
                  ENVIAR SOLICITUD DE INGENIERÍA B2B <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Right Column: Office Info & Custom SCADA map (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Specs Card */}
            <div className="border border-border-subtle bg-bg-secondary/20 p-6 rounded-sm space-y-6">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest block border-b border-border-subtle/50 pb-2">
                OFICINA CORPORATIVA CARIBE
              </span>
              
              <ul className="space-y-4 font-mono text-[11px] text-text-secondary">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-primary font-bold uppercase block">Dirección de Taller</span>
                    <p className="normal-case text-text-muted leading-normal mt-0.5">
                      Vía 40 # 73-290, Zona Industrial, Barranquilla, Atlántico, Colombia
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-primary font-bold uppercase block">Líneas de Atención</span>
                    <p className="text-text-muted mt-0.5">
                      Fijo: +57 (605) 309-4567 <br />
                      WhatsApp B2B: +57 300 123 4567
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-primary font-bold uppercase block">Correo de Ingeniería</span>
                    <p className="text-accent-cyan mt-0.5">
                      contacto@cyh-ingenieria.com
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-text-primary font-bold uppercase block">Horarios de Planta</span>
                    <p className="text-text-muted mt-0.5">
                      Lunes a Viernes: 7:30 AM - 5:30 PM <br />
                      Sábados: 8:00 AM - 12:00 PM <br />
                      <span className="text-success font-bold">EMERGENCIAS TÉCNICAS: 24/7</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Ubi Geográfica B2B */}
            <div className="border border-border-subtle bg-bg-secondary/20 p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-text-muted uppercase">UBICACIÓN GEOGRÁFICA</span>
                <span className="text-text-muted font-bold flex items-center gap-1">
                  SEDE CARIBE
                </span>
              </div>

              {/* Interactive Grayscale Map */}
              <div className="h-44 w-full bg-bg-primary border border-border-subtle/80 rounded-sm relative overflow-hidden">
                <iframe
                  src="https://maps.google.com/maps?q=V%C3%ADa%2040%20%23%2073-290%2C%20Zona%20Industrial%2C%20Barranquilla%2C%20Colombia&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 grayscale opacity-85 contrast-[1.1] dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Sede Principal Vía 40"
                />
              </div>

              {/* Cobertura list */}
              <div className="space-y-1.5">
                <span className="font-mono text-[8px] text-text-muted uppercase block">ÁREA DE COBERTURA DIRECTA CARIBE:</span>
                <p className="font-mono text-[9px] text-text-secondary leading-normal">
                  Barranquilla • Cartagena • Santa Marta • Valledupar • Sincelejo • Montería • La Guajira (Cobertura nacional Colombia).
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
