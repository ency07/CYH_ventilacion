"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, ShieldCheck, LogOut, LayoutDashboard, Settings, FileSignature, Kanban, Menu, X, Building2, Calendar, 
  Target, ClipboardList, Wrench, DollarSign, PhoneCall, CheckSquare, BellRing, LineChart, UsersRound, Users, Lock, User, ChevronDown, Moon, Sun
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { logoutAction } from "@/lib/server-actions/auth";

const menuGroups = [
  {
    group: "COMERCIAL",
    items: [
      { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'tecnico', 'ingeniero'] },
      { name: 'Leads', href: '/crm/leads', icon: Target, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'] },
      { name: 'Pipeline', href: '/crm/pipeline', icon: Kanban, roles: ['admin', 'super_admin', 'director_comercial', 'comercial'] },
      { name: 'Clientes', href: '/crm/clientes', icon: Building2, roles: ['admin', 'super_admin', 'director_comercial', 'comercial'] },
      { name: 'Oportunidades', href: '/crm/oportunidades', icon: DollarSign, roles: ['admin', 'super_admin', 'director_comercial', 'comercial'] },
      { name: 'Propuestas', href: '/crm/propuestas', icon: FileSignature, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'] },
    ]
  },
  {
    group: "OPERACIONES",
    items: [
      { name: 'Diagnósticos', href: '/crm/diagnosticos', icon: Activity, roles: ['admin', 'super_admin', 'director_comercial', 'ingeniero'] },
      { name: 'Revisiones', href: '/crm/revisiones', icon: Wrench, roles: ['admin', 'super_admin', 'director_comercial', 'ingeniero'] },
      { name: 'Calendario', href: '/crm/calendario', icon: Calendar, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'] },
      { name: 'Reuniones', href: '/crm/reuniones', icon: Users, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'] },
    ]
  },
  {
    group: "GESTIÓN",
    items: [
      { name: 'Actividades', href: '/crm/actividades', icon: PhoneCall, roles: ['admin', 'super_admin', 'director_comercial', 'comercial'] },
      { name: 'Tareas', href: '/crm/tareas', icon: CheckSquare, roles: ['admin', 'super_admin', 'director_comercial', 'comercial'] },
      { name: 'Alertas', href: '/crm/alertas', icon: BellRing, roles: ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'] },
      { name: 'Reportes', href: '/crm/reportes', icon: LineChart, roles: ['admin', 'super_admin', 'director_comercial'] },
    ]
  },
  {
    group: "ADMINISTRACIÓN",
    items: [
      { name: 'Usuarios', href: '/crm/usuarios', icon: UsersRound, roles: ['admin', 'super_admin'] },
      { name: 'Roles', href: '/crm/roles', icon: ShieldCheck, roles: ['admin', 'super_admin'] },
      { name: 'Permisos', href: '/crm/permisos', icon: Lock, roles: ['admin', 'super_admin'] },
      { name: 'Equipo', href: '/crm/equipo', icon: UsersRound, roles: ['admin', 'super_admin', 'director_comercial'] },
      { name: 'Configuración', href: '/crm/ajustes', icon: Settings, roles: ['admin', 'super_admin'] },
    ]
  }
];

interface CrmShellProps {
  userName: string;
  userEmail: string;
  userRole: string;
  children: React.ReactNode;
}

export default function CrmShell({ userName, userEmail, userRole, children }: CrmShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["COMERCIAL", "OPERACIONES", "GESTIÓN", "ADMINISTRACIÓN"]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Redirect technical users from dashboard to technical dashboard page
  useEffect(() => {
    if (pathname === "/crm/dashboard" && (userRole === "tecnico" || userRole === "ingeniero")) {
      router.push("/crm/dashboard/tecnico");
    }
  }, [pathname, userRole, router]);

  // Authorization check
  const allItems = menuGroups.flatMap(g => g.items);
  const currentItem = allItems.find(item => 
    pathname === item.href || 
    (item.href !== '/crm' && item.href !== '/crm/dashboard' && pathname.startsWith(item.href))
  );

  const isDetailRoute = pathname.match(/^\/crm\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  let allowedRoles = currentItem ? currentItem.roles : null;
  if (isDetailRoute) {
    allowedRoles = ['admin', 'super_admin', 'director_comercial', 'comercial', 'ingeniero'];
  }

  const isAuthorized = !allowedRoles || userRole === 'admin' || userRole === 'super_admin' || allowedRoles.includes(userRole);

  const handleLogout = async () => {
    await logoutAction();
  };

  // Admin ve todo, otros filtran por rol
  const filteredGroups = userRole === 'admin' || userRole === 'super_admin'
    ? menuGroups
    : menuGroups.map(g => ({
        ...g,
        items: g.items.filter(item => item.roles.includes(userRole))
      })).filter(g => g.items.length > 0);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  return (
    <div className="bg-bg-secondary min-h-screen text-text-primary flex transition-colors duration-300">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen bg-bg-primary transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'w-64 translate-x-0 border-r border-border-subtle' : 'w-64 -translate-x-full border-r-0 md:w-16 md:translate-x-0 md:border-r md:border-border-subtle'}`}>
        {/* Sidebar Header */}
        <div className={`flex items-center border-b border-border-subtle h-16 flex-shrink-0 ${isSidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-2 overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
            <ShieldCheck className="h-5 w-5 text-accent-cyan flex-shrink-0" />
            <span className="font-mono text-xs font-bold tracking-widest text-text-primary uppercase whitespace-nowrap">CYH OS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md text-text-secondary hover:bg-bg-tertiary transition-all flex-shrink-0 hidden md:block" aria-label="Toggle sidebar">
            <Menu className="h-4 w-4" />
          </button>
          <button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-3">
          {filteredGroups.map((group) => {
            const isOpen = openGroups.includes(group.group);
            return (
              <div key={group.group} className="space-y-0.5">
                {isSidebarOpen ? (
                  <button onClick={() => toggleGroup(group.group)} className="w-full flex items-center justify-between px-2 py-1 hover:bg-bg-tertiary rounded transition-colors group">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider group-hover:text-text-secondary transition-colors">
                      {group.group}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : <div className="h-3" />}

                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${!isSidebarOpen || isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map((item) => {
                    let itemHref = item.href;
                    if (item.name === 'Dashboard' && (userRole === 'tecnico' || userRole === 'ingeniero')) {
                      itemHref = '/crm/dashboard/tecnico';
                    }
                    const isActive = pathname === itemHref || (itemHref !== '/crm' && itemHref !== '/crm/dashboard' && pathname.startsWith(itemHref));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={itemHref}
                        title={!isSidebarOpen ? item.name : undefined}
                        className={`flex items-center rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                          isSidebarOpen ? 'gap-2.5 px-3 py-2' : 'w-10 h-10 justify-center mx-auto'
                        } ${isActive ? "bg-accent-cyan/10 text-accent-cyan" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"}`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-accent-cyan" : ""}`} />
                        {isSidebarOpen && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border-subtle flex flex-col gap-1 flex-shrink-0">
          <Link href="/crm/perfil" title={!isSidebarOpen ? "Mi Perfil" : undefined}
            className={`flex items-center rounded-md text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors ${isSidebarOpen ? 'gap-2.5 px-3 py-2' : 'w-10 h-10 justify-center mx-auto'}`}>
            <User className="h-4 w-4 flex-shrink-0" />
            {isSidebarOpen && <span>Mi Perfil</span>}
          </Link>
          <button onClick={handleLogout} title={!isSidebarOpen ? "Cerrar Sesión" : undefined}
            className={`flex items-center rounded-md text-sm font-medium text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors ${isSidebarOpen ? 'gap-2.5 px-3 py-2 w-full' : 'w-10 h-10 justify-center mx-auto'}`}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-bg-primary border-b border-border-subtle flex items-center justify-between px-4 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md text-text-secondary hover:bg-bg-tertiary transition-all md:hidden" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-text-primary">Hola, {userName}</span>
              <span className="px-2 py-0.5 bg-bg-tertiary text-text-muted text-[9px] font-black uppercase tracking-wider rounded border border-border-subtle select-none">
                {userRole === 'super_admin' ? 'SUPER ADMIN' : userRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors bg-bg-secondary rounded-full border border-border-subtle"
                aria-label="Alternar tema">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors bg-bg-secondary rounded-full border border-border-subtle" aria-label="Notificaciones">
              <BellRing className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full border border-bg-primary" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 hover:bg-bg-tertiary p-1.5 pr-3 rounded-full border border-transparent hover:border-border-subtle transition-colors">
                <div className="w-7 h-7 bg-accent-cyan rounded-full flex items-center justify-center uppercase font-bold text-white text-xs flex-shrink-0">
                  {userName.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-text-primary leading-none">{userName}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-text-secondary hidden lg:block" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-bg-primary border border-border-subtle rounded-md shadow-lg z-50 py-1">
                    <div className="px-3 py-2.5 border-b border-border-subtle">
                      <p className="text-sm font-bold text-text-primary">{userName}</p>
                      <p className="text-xs text-text-secondary truncate">{userEmail}</p>
                    </div>
                    <Link href="/crm/perfil" onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                      <User className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10">
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {isAuthorized ? children : (
            <div className="flex-grow p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="bg-bg-primary p-12 rounded-lg border border-border-subtle shadow-md max-w-md flex flex-col items-center">
                <Lock className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                <h2 className="text-xl font-display font-bold text-text-primary uppercase tracking-wider">Acceso Restringido</h2>
                <p className="text-sm text-text-secondary mt-2">No tienes permisos para visualizar este módulo comercial o financiero.</p>
                <button onClick={() => router.push(userRole === 'ingeniero' || userRole === 'tecnico' ? '/crm/diagnosticos' : '/crm/dashboard')} className="mt-6 px-4 py-2 bg-text-primary text-bg-primary rounded text-xs font-bold uppercase hover:bg-opacity-90 transition-all">
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
