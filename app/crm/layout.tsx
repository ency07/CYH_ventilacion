"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, Database, Server, LogOut, LayoutDashboard, Settings, FileText, FolderKanban, Menu, X, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = "cyh-crm-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/crm#pipeline', icon: FolderKanban },
    { name: 'Clientes', href: '/crm#clientes', icon: Users },
    { name: 'Cotizaciones', href: '/crm#cotizaciones', icon: FileText },
    { name: 'Ajustes', href: '/crm#ajustes', icon: Settings },
  ];

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary flex pt-20">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-20 left-0 z-50 w-64 h-[calc(100vh-5rem)] bg-bg-secondary border-r border-border-subtle transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent-cyan" />
            <span className="font-mono text-sm font-bold tracking-widest text-text-primary uppercase">CYH ADMIN</span>
          </div>
          <button className="md:hidden text-text-muted hover:text-text-primary" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/crm' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" 
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-accent-cyan" : "text-text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] relative">
        <div className="md:hidden p-4 border-b border-border-subtle bg-bg-secondary flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-text-secondary hover:text-text-primary">
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 font-mono text-sm font-bold tracking-widest text-text-primary uppercase">Pipeline Ejecutivo</span>
        </div>
        
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
