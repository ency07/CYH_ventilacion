import React from "react";
import { AlertCircle } from "lucide-react";

export default function UsuariosPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-bg-secondary p-8 font-sans items-center justify-center">
      <div className="bg-bg-primary p-8 rounded-lg shadow-sm border border-border-subtle max-w-md text-center">
        <div className="w-12 h-12 bg-accent-cyan/10 text-accent-cyan rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">Módulo en Construcción</h1>
        <p className="text-sm text-text-secondary">Este módulo está programado para la siguiente fase de desarrollo.</p>
      </div>
    </div>
  );
}
