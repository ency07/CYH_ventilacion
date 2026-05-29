import React from "react";

export default function CotizadorLoading() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-border-subtle border-t-accent-cyan animate-spin" />
        <span className="font-mono text-[10px] text-text-secondary tracking-widest uppercase animate-pulse">
          CARGANDO SISTEMA...
        </span>
      </div>
    </div>
  );
}
