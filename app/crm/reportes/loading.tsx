import React from "react";

export default function ReportesLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-y-auto select-none p-8 animate-pulse">
      {/* HEADER PRINCIPAL PLACEHOLDER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 shrink-0">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 rounded"></div>
          <div className="h-4 w-96 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-slate-200 rounded"></div>
          <div className="h-10 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>

      {/* TOP KPI CARDS PLACEHOLDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-8 bg-slate-150 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-20 bg-slate-200 rounded"></div>
              <div className="h-3.5 w-32 bg-slate-150 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE CHARTS PLACEHOLDER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm lg:col-span-2 flex flex-col h-96">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded"></div>
              <div className="h-3.5 w-64 bg-slate-100 rounded"></div>
            </div>
            <div className="h-4 w-32 bg-slate-100 rounded"></div>
          </div>
          <div className="flex-1 bg-slate-50 rounded flex items-end justify-between p-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="flex-1 flex flex-col gap-2 items-center">
                <div className="w-full bg-slate-200 rounded-t" style={{ height: `${20 + idx * 10}%` }}></div>
                <div className="h-3 w-8 bg-slate-150 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col h-96">
          <div className="h-5 w-40 bg-slate-200 rounded mb-6"></div>
          <div className="flex-1 flex flex-col gap-6 justify-center">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
                  <div className="h-3.5 w-12 bg-slate-200 rounded"></div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION PLACEHOLDER */}
      <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-8 h-80">
        <div className="lg:w-1/2 flex flex-col">
          <div className="h-5 w-52 bg-slate-200 rounded mb-6"></div>
          <div className="flex-1 bg-slate-50 rounded p-4 flex items-end justify-between gap-6">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex-1 flex flex-col gap-2 items-center">
                <div className="w-full bg-slate-200 rounded-t" style={{ height: `${30 + idx * 12}%` }}></div>
                <div className="h-3 w-8 bg-slate-150 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-1/2 flex flex-col justify-between">
          <div className="h-5 w-40 bg-slate-200 rounded mb-4 self-end"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-200"></div>
                  <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="h-3.5 w-8 bg-slate-150 rounded"></div>
                <div className="h-3.5 w-8 bg-slate-150 rounded"></div>
                <div className="h-3.5 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
