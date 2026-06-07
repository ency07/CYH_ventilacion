import React from "react";

export default function LeadsLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none animate-pulse">
      {/* HEADER PRINCIPAL PLACEHOLDER */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-6 w-40 bg-slate-200 rounded"></div>
          <div className="h-4 w-24 bg-slate-100 rounded border border-slate-200"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-8 w-64 bg-slate-100 rounded border border-slate-200 hidden md:block"></div>
          <div className="h-8 w-28 bg-slate-100 rounded border border-slate-200"></div>
          <div className="h-8 w-24 bg-slate-100 rounded border border-slate-200"></div>
          <div className="h-8 w-28 bg-slate-200 rounded"></div>
        </div>
      </div>

      {/* TABLE PLACEHOLDER */}
      <div className="flex-1 overflow-auto w-full bg-white relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
            <tr>
              <th className="p-4 pl-6 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200">Empresa / Cliente</th>
              <th className="p-4 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200">Contacto principal</th>
              <th className="p-4 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200">Ubicación Planta</th>
              <th className="p-4 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200">Servicio Solicitado</th>
              <th className="p-4 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200 text-center">Temperatura</th>
              <th className="p-4 text-xs font-bold text-slate-350 uppercase tracking-widest border-b border-slate-200">Fecha de Ingreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...Array(6)].map((_, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="p-4 pl-6">
                  <div className="flex flex-col gap-2">
                    <div className="h-3.5 w-36 bg-slate-200 rounded"></div>
                    <div className="h-2 w-16 bg-slate-100 rounded"></div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-28 bg-slate-200 rounded"></div>
                    <div className="h-2 w-16 bg-slate-100 rounded"></div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="h-3 w-20 bg-slate-100 rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
                </td>
                <td className="p-4 flex justify-center">
                  <div className="h-5 w-12 bg-slate-100 rounded-full border border-slate-200"></div>
                </td>
                <td className="p-4">
                  <div className="h-3 w-16 bg-slate-100 rounded font-mono"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
