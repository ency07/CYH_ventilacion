"use client";

import { useState, useEffect, Suspense } from "react";
import { loginAction, signupAction, recoverPasswordAction } from "@/lib/server-actions/auth";
import { ArrowRight, Loader2, Mail, Lock, User, Building, Briefcase } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getTenantBrandingAction } from "@/lib/server-actions/config";

function AuthForm() {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [brandingConfig, setBrandingConfig] = useState<{
    companyName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");

  useEffect(() => {
    async function loadBranding() {
      const res = await getTenantBrandingAction();
      if (res.success && res.data) {
        setBrandingConfig({
          companyName: res.data.config.companyName,
          logoUrl: res.data.branding.logoUrl,
          primaryColor: res.data.branding.primaryColor,
          secondaryColor: res.data.branding.secondaryColor,
        });
      }
    }
    loadBranding();
  }, []);

  async function formAction(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const res = await loginAction(formData);
        if (res?.error) setError(res.error);
      } else if (mode === "register") {
        const res = await signupAction(formData);
        if (res?.error) setError(res.error);
        else if (res?.success) setSuccess(res.success);
      } else if (mode === "recover") {
        const res = await recoverPasswordAction(formData);
        if (res?.error) setError(res.error);
        else if (res?.success) setSuccess(res.success);
      }
    } catch (err: any) {
      if (err?.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(err.message || "Ha ocurrido un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  // Configure theme variations based on portal origin
  const isPortal = fromParam === "portal";
  const isCrm = fromParam === "crm";

  let title = "CYH OS";
  let subtitle = "Acceso Corporativo";
  let subtitleColor = "text-slate-400 border-slate-700/50 bg-slate-900/45";
  let cardClass = "border-slate-700 shadow-2xl bg-slate-800";
  let buttonClass = "bg-white hover:bg-slate-200 text-slate-900";
  let IconComponent = null;

  if (mode === "login") {
    if (isPortal) {
      title = "CYH PORTAL";
      subtitle = "Acceso Clientes B2B";
      subtitleColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/30";
      cardClass = "border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.08)] bg-slate-800/95";
      buttonClass = "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20";
      IconComponent = Building;
    } else if (isCrm) {
      title = "CYH CRM";
      subtitle = "CRM Operativo Interno";
      subtitleColor = "text-blue-400 border-blue-500/30 bg-blue-950/30";
      cardClass = "border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.08)] bg-slate-800/95";
      buttonClass = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20";
      IconComponent = Briefcase;
    }
  } else if (mode === "register") {
    subtitle = "Registro de Cuenta";
  } else {
    subtitle = "Recuperación";
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {brandingConfig && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary-color: ${brandingConfig.primaryColor};
            --secondary-color: ${brandingConfig.secondaryColor};
          }
        `}} />
      )}
      <div className={`w-full max-w-md border rounded-sm p-8 transition-all duration-500 ${cardClass}`}>
        
        <div className="text-center mb-8 flex flex-col items-center">
          {brandingConfig?.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={brandingConfig.logoUrl} alt="Logo" className="h-12 object-contain mb-4" />
          ) : (
            IconComponent && (
              <div className={`mb-3 p-3 rounded-full border transition-all duration-500 ${isPortal ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' : 'border-blue-500/20 bg-blue-950/20 text-blue-400'}`}>
                <IconComponent className="h-6 w-6" />
              </div>
            )
          )}
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider font-display transition-all duration-500">
            {brandingConfig ? brandingConfig.companyName : (title.split(' ')[0])} <span className="text-slate-400">{brandingConfig ? (isPortal ? "PORTAL" : isCrm ? "CRM" : "") : (title.split(' ').slice(1).join(' ') || 'OS')}</span>
          </h1>
          <p className={`text-xs mt-2 font-mono uppercase tracking-widest border py-1 px-3 rounded inline-block transition-all duration-500 ${subtitleColor}`}>
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-sm text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-900/50 border border-emerald-500/50 rounded-sm text-emerald-200 text-sm text-center">
            {success}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          
          {mode === "register" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input name="fullName" required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-slate-400 focus:ring-0" placeholder="Ej. Carlos Mendoza" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Empresa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input name="company" required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-slate-400 focus:ring-0" placeholder="Ej. Industria ABC" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase">Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input name="position" required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-slate-400 focus:ring-0" placeholder="Ej. Gerente de Planta" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input name="email" required type="email" className="w-full bg-slate-900 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-slate-400 focus:ring-0" placeholder="correo@empresa.com" />
            </div>
          </div>

          {mode !== "recover" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input name="password" required type="password" minLength={6} className="w-full bg-slate-900 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-slate-400 focus:ring-0" placeholder="••••••••" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold text-xs tracking-wider uppercase py-3 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 mt-6 ${buttonClass}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <>Ingresar <ArrowRight className="h-4 w-4" /></>
            ) : mode === "register" ? (
              <>Crear Cuenta <User className="h-4 w-4" /></>
            ) : (
              <>Enviar Instrucciones <Mail className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center space-y-3">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("recover")} className="text-xs text-slate-400 hover:text-white transition-colors block w-full">
                ¿Olvidaste tu contraseña?
              </button>
              <button onClick={() => setMode("register")} className="text-xs text-slate-400 hover:text-white transition-colors block w-full">
                ¿No tienes cuenta? <span className="font-bold underline">Regístrate</span>
              </button>
            </>
          )}
          
          {mode !== "login" && (
            <button onClick={() => setMode("login")} className="text-xs text-slate-400 hover:text-white transition-colors block w-full">
              Volver al inicio de sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
