"use client";

import { useState } from "react";
import { loginAction, signupAction, recoverPasswordAction } from "@/lib/server-actions/auth";
import { ArrowRight, Loader2, Mail, Lock, User, Building, Briefcase } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

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
      setError(err.message || "Ha ocurrido un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-sm shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider font-display">
            CYH <span className="text-slate-400">OS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono uppercase tracking-widest">
            {mode === "login" ? "Acceso Corporativo" : mode === "register" ? "Registro de Cuenta" : "Recuperación"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
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
            className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs tracking-wider uppercase py-3 rounded-sm transition-colors flex items-center justify-center gap-2 mt-6"
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
