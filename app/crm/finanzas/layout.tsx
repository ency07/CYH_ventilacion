"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, DollarSign, BookOpen, CheckCircle2, Download } from "lucide-react";

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "CxC", href: "/crm/finanzas/cxc", icon: Landmark },
    { name: "Recaudos", href: "/crm/finanzas/recaudos", icon: DollarSign },
    { name: "Ledger", href: "/crm/finanzas/ledger", icon: BookOpen },
    { name: "Conciliación", href: "/crm/finanzas/conciliacion", icon: CheckCircle2 },
    { name: "Exportaciones", href: "/crm/finanzas/exportaciones", icon: Download },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-bg-primary border-b border-border-subtle px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary tracking-tight font-display">Módulo de Finanzas & Contabilidad</h1>
        <p className="text-xs text-text-secondary mt-1">Gestión de cartera B2B, recaudos, conciliación bancaria y libro mayor de VentiTech.</p>
      </div>

      {/* Tabs */}
      <div className="bg-bg-primary border-b border-border-subtle px-6 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? "border-accent-cyan text-accent-cyan bg-accent-cyan/5"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
