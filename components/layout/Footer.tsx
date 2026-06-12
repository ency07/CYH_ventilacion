import React from "react";
import Link from "next/link";
import { Shield, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-primary border-t border-border-subtle relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo-sphere.jpg" alt="" className="h-12 w-12 object-cover rounded-full" />
              <span className="font-bold text-xl leading-none select-none">
                <span className="brand-venti">VENTI</span><span className="brand-tech">TECH</span>
              </span>
            </div>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Diseño, desarrollo y optimización de sistemas de flujo de aire de alta capacidad y ventilación forzada para minería, plantas industriales de manufactura pesada y centros de datos en América Latina.
            </p>
            {/* Certifications Row */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <span className="text-[10px] font-mono tracking-wider border border-border-subtle bg-bg-secondary/40 px-2 py-1 text-text-secondary rounded-sm">
                ISO 9001 CERTIFIED
              </span>
              <span className="text-[10px] font-mono tracking-wider border border-border-subtle bg-bg-secondary/40 px-2 py-1 text-text-secondary rounded-sm">
                AMCA COMPLIANT
              </span>
              <span className="text-[10px] font-mono tracking-wider border border-border-subtle bg-bg-secondary/40 px-2 py-1 text-text-secondary rounded-sm">
                RETIE / NTC 2050
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-wide text-text-primary uppercase mb-2">
              Sistemas
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/servicios#fabricacion" className="text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                  Ingeniería de Flujo
                </Link>
              </li>
              <li>
                <Link href="/servicios#predictivo" className="text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                  Mantenimiento Predictivo
                </Link>
              </li>
              <li>
                <Link href="/proyectos" className="text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                  Proyectos Clave
                </Link>
              </li>
              <li>
                <Link href="/cotizador" className="text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                  Cotizador Computacional
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-wide text-text-primary uppercase mb-2">
              Asistencia Industrial
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Mail className="h-4 w-4 text-accent-cyan" />
                <span>contacto@ventitech.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Phone className="h-4 w-4 text-accent-cyan" />
                <span>+57 (605) 309-4567</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 text-accent-cyan mt-0.5" />
                <span>Vía 40 # 73-290, Zona Industrial, Barranquilla, Colombia</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-mono text-[10px] text-text-muted tracking-widest uppercase">
            © {currentYear} VENTITECH. TODOS LOS DERECHOS RESERVADOS.
          </span>
          <div className="flex gap-6 items-center">
            <span className="text-[10px] font-mono text-text-muted hover:text-accent-cyan cursor-pointer transition-colors flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              POLÍTICA DE CONFIDENCIALIDAD INDUSTRIAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
