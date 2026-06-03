"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, Database, Server, LogOut, LayoutDashboard, Settings, FileText, FolderKanban, Menu, X, Users, PanelLeft, Calendar } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/crm', icon: FolderKanban },
    { name: 'Clientes', href: '/crm#clientes', icon: Users },
    { name: 'Calendario', href: '/crm/calendario', icon: Calendar },
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
      <aside className={`fixed md:sticky top-20 left-0 z-50 h-[calc(100vh-5rem)] bg-bg-secondary border-r border-border-subtle transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-16'}`}>
        <div className={`p-6 border-b border-border-subtle flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center p-4'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="h-6 w-6 text-accent-cyan flex-shrink-0" />
            <span className={`font-mono text-sm font-bold tracking-widest text-text-primary uppercase transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden hidden md:block'}`}>CYH ADMIN</span>
          </div>
          <button className="md:hidden text-text-muted hover:text-text-primary flex-shrink-0" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
          {navItems.map((item) => {
            // Fix active logic to separate Dashboard from Pipeline
            const isActive = pathname === item.href || (item.href !== '/crm' && item.href !== '/crm/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  sidebarOpen ? 'px-3' : 'px-0 justify-center'
                } ${
                  isActive 
                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" 
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-accent-cyan" : "text-text-muted"}`} />
                <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden hidden md:block'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle overflow-hidden">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-2 rounded-md text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors whitespace-nowrap ${
              sidebarOpen ? 'px-3' : 'px-0 justify-center'
            }`}
            title={!sidebarOpen ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" /> 
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden hidden md:block'}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col w-full relative transition-all duration-300 ${sidebarOpen ? 'md:w-[calc(100%-16rem)]' : 'md:w-[calc(100%-4rem)]'}`}>
        
        <div className="hidden md:flex p-4 border-b border-border-subtle bg-bg-secondary items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium transition-all shadow-sm">
            <PanelLeft className="h-5 w-5" />
          </button>
          <span className="ml-3 font-mono text-sm font-bold tracking-widest text-text-primary uppercase">Pipeline Ejecutivo</span>
        </div>
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
