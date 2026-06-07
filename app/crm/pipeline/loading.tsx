import React from "react";

export default function PipelineLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none animate-pulse">
      
      {/* HEADER PLACEHOLDER */}
      <div className="px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-slate-200 shrink-0">
        <div>
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-60 bg-slate-100 rounded mt-2"></div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="h-8 w-60 bg-slate-100 rounded border border-slate-200"></div>
          <div className="h-8 w-44 bg-slate-100 rounded border border-slate-200"></div>
          <div className="h-8 w-40 bg-slate-100 rounded border border-slate-200"></div>
          <div className="h-8 w-24 bg-slate-100 rounded border border-slate-200"></div>
        </div>
      </div>

      {/* STATS PLACEHOLDER */}
      <div className="px-6 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-slate-100 rounded"></div>
              <div className="h-3 w-28 bg-slate-150 rounded"></div>
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* KANBAN COLUMNS PLACEHOLDER */}
      <div className="flex-1 px-6 py-6 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {[...Array(6)].map((_, colIdx) => (
            <div
              key={colIdx}
              className="w-[290px] flex-shrink-0 bg-slate-100/50 border border-slate-200 rounded flex flex-col h-full max-h-[calc(100vh-22rem)]"
            >
              {/* Header Placeholder */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t flex justify-between items-center shrink-0">
                <div className="h-4.5 w-32 bg-slate-200 rounded"></div>
                <div className="h-4 w-6 bg-slate-150 rounded-sm"></div>
              </div>

              {/* Cards Container Placeholder */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {[...Array(2)].map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-white border border-slate-200 p-4 rounded shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="h-4 w-28 bg-slate-200 rounded"></div>
                      <div className="h-3.5 w-10 bg-slate-150 rounded-sm"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="h-3 w-36 bg-slate-100 rounded"></div>
                      <div className="h-2.5 w-20 bg-slate-100 rounded"></div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded p-2.5 space-y-2">
                      <div className="h-2 w-full bg-slate-150 rounded"></div>
                      <div className="h-2 w-3/4 bg-slate-150 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
