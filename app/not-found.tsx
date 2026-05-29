import React from "react";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* HUD-like grid texture inside 404 */}
      <div className="absolute inset-0 z-0 industrial-grid opacity-10" />

      <div className="relative z-10 glass-panel p-12 max-w-md w-full text-center space-y-6 rounded-sm border border-border-subtle bg-bg-secondary/40">
        
        <div className="p-4 bg-bg-primary/50 w-fit mx-auto border border-border-subtle rounded-sm">
          <Construction className="h-10 w-10 text-accent-cyan" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-accent-cyan tracking-widest uppercase font-semibold">
            ERROR 404 • RECURSO INACCESIBLE
          </span>
          <h1 className="font-display text-4xl tracking-wide text-text-primary uppercase">
            Ruta No Mapeada
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            El módulo al que intenta acceder no forma parte del alcance operativo actual del sistema o está en mantenimiento.
          </p>
        </div>

        <div className="pt-4 border-t border-border-subtle/50">
          <Link
            href="/"
            className="w-full px-6 py-3 bg-accent-cyan hover:bg-accent-cyan/95 text-background font-semibold text-xs tracking-wider uppercase rounded-sm transition-all inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            REGRESAR A LA ESTACIÓN BASE
          </Link>
        </div>

      </div>
    </div>
  );
}
