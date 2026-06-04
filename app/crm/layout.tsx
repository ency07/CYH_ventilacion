"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, Database, Server, LogOut, LayoutDashboard, Settings, FileText, FolderKanban, Menu, X, Users, PanelLeft, Calendar, Inbox, ClipboardList, Wrench, DollarSign, PhoneCall, CheckSquare, Handshake, BellRing, TrendingUp, UsersRound } from "lucide-react";
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("");

  React.useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario");
        setUserEmail(user.email || "");
      }
    }
    fetchUser();
  }, []);

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
    { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard, ready: true },
    { name: 'Leads', href: '/crm/leads', icon: Inbox, ready: true },
    { name: 'Pipeline', href: '/crm/pipeline', icon: FolderKanban, ready: true },
    { name: 'Clientes', href: '/crm/clientes', icon: Users, ready: true },
    
    { name: 'Diagnósticos', href: '/crm/diagnosticos', icon: ClipboardList, ready: true },
    { name: 'Revisiones Técnicas', href: '/crm/revisiones', icon: Wrench, ready: true },
    
    { name: 'Oportunidades', href: '/crm/oportunidades', icon: DollarSign, ready: true },
    { name: 'Propuestas', href: '/crm/propuestas', icon: FileText, ready: true },
    
    { name: 'Actividades', href: '/crm/actividades', icon: PhoneCall, ready: true },
    { name: 'Tareas', href: '/crm/tareas', icon: CheckSquare, ready: true },
    
    { name: 'Calendario', href: '/crm/calendario', icon: Calendar, ready: true },
    { name: 'Reuniones', href: '/crm/reuniones', icon: Handshake, ready: true },
    
    { name: 'Alertas', href: '/crm/alertas', icon: BellRing, ready: true },
    { name: 'Reportes', href: '/crm/reportes', icon: TrendingUp, ready: true },
    
    { name: 'Equipo Comercial', href: '/crm/equipo', icon: UsersRound, ready: true },
    { name: 'Ajustes', href: '/crm/ajustes', icon: Settings, ready: true },
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
        <div className={`flex items-center border-b border-border-subtle h-16 ${sidebarOpen ? 'px-6 justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${!sidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <ShieldCheck className="h-6 w-6 text-accent-cyan flex-shrink-0" />
            <span className="font-mono text-sm font-bold tracking-widest text-text-primary uppercase whitespace-nowrap">CYH ADMIN</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-1.5 rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all flex-shrink-0 hidden md:block"
            title={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <button className="md:hidden text-text-muted hover:text-text-primary flex-shrink-0" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = item.ready && (pathname === item.href || (item.href !== '/crm' && item.href !== '/crm/dashboard' && pathname.startsWith(item.href)));
            const Icon = item.icon;
            
            if (!item.ready) {
              return (
                <div
                  key={item.name}
                  className={`flex items-center rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-not-allowed opacity-50 ${
                    sidebarOpen ? 'gap-3 px-3 py-2.5 mx-0' : 'w-10 h-10 justify-center mx-auto'
                  } text-text-secondary hover:bg-bg-tertiary border border-transparent`}
                  title={!sidebarOpen ? `${item.name} (Próximamente)` : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-text-muted" />
                  <div className={`transition-all duration-300 flex items-center justify-between ${sidebarOpen ? 'opacity-100 w-full ml-3' : 'opacity-0 w-0 overflow-hidden'}`}>
                    <span>{item.name}</span>
                    <span className="text-[9px] font-bold uppercase bg-bg-tertiary px-1.5 py-0.5 rounded text-text-muted">Pronto</span>
                  </div>
                </div>
              );
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  sidebarOpen ? 'gap-3 px-3 py-2.5 mx-0' : 'w-10 h-10 justify-center mx-auto'
                } ${
                  isActive 
                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" 
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-transparent"
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-accent-cyan" : "text-text-muted"}`} />
                <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0 overflow-hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle overflow-hidden flex justify-center">
          <button 
            onClick={handleLogout}
            className={`flex items-center rounded-md text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors whitespace-nowrap ${
              sidebarOpen ? 'w-full gap-3 px-3 py-2' : 'w-10 h-10 justify-center'
            }`}
            title={!sidebarOpen ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" /> 
            <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0 overflow-hidden'}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col w-full relative transition-all duration-300 ${sidebarOpen ? 'md:w-[calc(100%-16rem)]' : 'md:w-[calc(100%-4rem)]'}`}>
        
        <div className="hidden md:flex p-4 border-b border-border-subtle bg-bg-secondary items-center justify-between h-16">
          <span className="font-mono text-sm font-bold tracking-widest text-text-primary uppercase">Pipeline Ejecutivo</span>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors">
              <BellRing className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-secondary"></span>
            </button>
            
            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 hover:bg-bg-tertiary p-1.5 rounded-md transition-colors"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-text-primary leading-tight">{userName}</p>
                  <p className="text-[10px] text-text-muted">Conectado</p>
                </div>
                <div className="w-8 h-8 bg-accent-cyan/20 rounded-full border border-accent-cyan flex items-center justify-center uppercase font-bold text-accent-cyan text-sm">
                  {userName.charAt(0)}
                </div>
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-bg-primary border border-border-subtle rounded-md shadow-lg z-50 py-2">
                    <div className="px-4 py-3 border-b border-border-subtle mb-1">
                      <p className="text-sm font-bold text-text-primary">{userName}</p>
                      <p className="text-xs text-text-muted truncate">{userEmail}</p>
                    </div>
                    <Link href="/crm/ajustes" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                      <Settings className="w-4 h-4" /> Configuración
                    </Link>
                    <Link href="/crm/ajustes" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                      <Users className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <div className="border-t border-border-subtle my-1"></div>
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden p-4 border-b border-border-subtle bg-bg-secondary flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="p-1 text-text-secondary hover:text-text-primary">
              <Menu className="h-6 w-6" />
            </button>
            <span className="ml-3 font-mono text-sm font-bold tracking-widest text-text-primary uppercase">Pipeline Ejecutivo</span>
          </div>
          <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors">
            <BellRing className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-secondary"></span>
          </button>
        </div>
        
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
