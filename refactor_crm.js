const fs = require('fs');

let content = fs.readFileSync('app/crm/page.tsx', 'utf8');

// 1. Imports
content = content.replace(
  'FileText\n} from "lucide-react";',
  'FileText,\n  BriefcaseBusiness\n} from "lucide-react";'
);

// 2. KPIs Redesign
const oldKPIs = `      {/* 4 ADVANCED KPIs Requeridos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-bg-primary border border-border-subtle p-3 rounded-md shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Clock className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Leads sin contacto</h3>
          </div>
          <p className="text-lg font-bold text-text-primary">{leads.filter(l => l.status === "nuevo").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-3 rounded-md shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Target className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Tareas Vencidas</h3>
          </div>
          <p className="text-lg font-bold text-text-primary">{leads.filter(l => l.status !== "ganado" && l.status !== "perdido" && new Date(l.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000).length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-3 rounded-md shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Reuniones Próximas</h3>
          </div>
          <p className="text-lg font-bold text-text-primary">{leads.filter(l => l.status === "reunion").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-3 rounded-md shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Forecast Comercial</h3>
          </div>
          <p className="text-lg font-bold text-text-primary">\${(weightedPipelineValue / 1000000).toFixed(1)}M</p>
        </div>
      </div>`;

const newKPIs = `      {/* 4 ADVANCED KPIs Requeridos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-amber-500/10 rounded-md">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Leads sin contacto</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status === "nuevo").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-red-500/10 rounded-md">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Tareas Vencidas</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status !== "ganado" && l.status !== "perdido" && new Date(l.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000).length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-accent-cyan/10 rounded-md">
              <FolderKanban className="w-4 h-4 text-accent-cyan" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Reuniones Próximas</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status === "reunion").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-md">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Forecast Comercial</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">\${(weightedPipelineValue / 1000000).toFixed(1)}M</p>
        </div>
      </div>`;

content = content.replace(oldKPIs, newKPIs);

// 3. Kanban Rewrite
const oldKanban = `              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={\`w-[180px] flex-shrink-0 bg-bg-tertiary border rounded-md flex flex-col transition-all \${
                  isDraggedOver ? "border-blue-400 bg-blue-50" : "border-border-subtle"
                }\`}
              >
                {/* Column Header */}
                <div className={\`p-2 border-b \${stage.border} \${stage.bg} rounded-t-md h-12 flex flex-col justify-center\`}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={\`text-[10px] font-bold \${stage.text} leading-tight pr-1\`}>{stage.name}</h3>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 bg-bg-primary rounded-md border border-border-subtle text-text-secondary flex-shrink-0">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-text-muted">
                    \${(colValue / 1000000).toFixed(1)}M
                  </p>
                </div>

                {/* Cards Container */}
                <div className="p-1.5 flex-1 overflow-y-auto space-y-1.5 max-h-[calc(100vh-280px)]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-bg-primary border border-border-subtle p-2 rounded-sm shadow-sm hover:shadow hover:border-border-medium cursor-grab active:cursor-grabbing transition-all group flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-text-primary uppercase tracking-wide leading-tight line-clamp-2 pr-1" title={lead.companyName}>
                          {lead.companyName}
                        </span>
                        
                        <span className={\`text-[7px] px-1 py-0.5 rounded-sm font-bold tracking-tight whitespace-nowrap \${
                          lead.riskLevel === "HOT" ? "bg-red-100 text-red-700" :
                          lead.riskLevel === "WARM" ? "bg-amber-100 text-amber-700" :
                          lead.riskLevel === "SPAM" ? "bg-bg-tertiary text-text-muted" :
                          "bg-bg-tertiary text-text-secondary"
                        }\`}>
                          {lead.riskLevel === "HOT" ? "ALTO INTERÉS" :
                           lead.riskLevel === "WARM" ? "INTERÉS MEDIO" :
                           lead.riskLevel === "SPAM" ? "DESCARTADO" : 
                           "BAJA PRIORIDAD"}
                        </span>
                      </div>

                      <div className="space-y-0.5 border-l-2 border-border-subtle pl-1.5">
                        <p className="text-[9px] text-text-secondary font-medium truncate" title={lead.fullName}>
                          {lead.fullName}
                        </p>
                        <p className="text-[8px] text-text-muted truncate" title={lead.city}>
                          {lead.city}
                        </p>
                      </div>

                      <div className="bg-bg-secondary rounded px-1.5 py-1 space-y-0.5">
                        <p className="text-[8px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Servicio:</span>
                          <span className="capitalize font-medium truncate max-w-[70px]">{lead.serviceType}</span>
                        </p>
                        <p className="text-[8px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Valor:</span>
                          <span className="font-bold text-text-primary">\${((lead.estimatedBudgetMax || 0) / 1000000).toFixed(1)}M</span>
                        </p>
                        <p className="text-[8px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Asesor:</span>
                          <span className={\`truncate max-w-[70px] \${!lead.assignedTo ? "text-text-muted italic" : "font-medium text-text-secondary"}\`}>
                            {lead.assignedTo || "Sin asignar"}
                          </span>
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-border-subtle">
                        <span className="text-[7px] text-text-muted font-medium">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        <Link 
                          href={\`/crm/\${lead.id}\`}
                          className="text-[8px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ABRIR
                        </Link>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-10 border-2 border-dashed border-border-subtle rounded-sm flex items-center justify-center text-[8px] text-text-muted">
                      Arrastrar aquí
                    </div>
                  )}
                </div>
              </div>`;

const newKanban = `              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={\`w-[340px] flex-shrink-0 bg-bg-tertiary border rounded-md flex flex-col transition-all \${
                  isDraggedOver ? "border-accent-cyan/50 bg-accent-cyan/5" : "border-border-subtle"
                }\`}
              >
                {/* Column Header */}
                <div className={\`p-4 border-b \${stage.border} \${stage.bg} rounded-t-md flex flex-col gap-1\`}>
                  <div className="flex justify-between items-center">
                    <h3 className={\`text-sm font-bold \${stage.text} tracking-wide uppercase\`}>{stage.name}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-bg-primary rounded-md border border-border-subtle text-text-secondary flex-shrink-0 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-text-muted">
                    \${(colValue / 1000000).toFixed(1)}M USD
                  </p>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-border-subtle">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-bg-primary border border-border-subtle p-4 rounded-md shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-border-medium cursor-grab active:cursor-grabbing transition-all group flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 overflow-hidden">
                          <div className="mt-0.5 p-1.5 bg-bg-secondary border border-border-subtle rounded-md flex-shrink-0">
                            <BriefcaseBusiness className="w-4 h-4 text-text-muted" />
                          </div>
                          <span className="text-sm font-bold text-text-primary tracking-wide leading-tight line-clamp-2" title={lead.companyName}>
                            {lead.companyName}
                          </span>
                        </div>
                        
                        <span className={\`text-[10px] px-2 py-1 rounded-sm font-bold tracking-wider uppercase whitespace-nowrap border \${
                          lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
                          lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          lead.riskLevel === "SPAM" ? "bg-bg-tertiary text-text-muted border-border-subtle" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }\`}>
                          {lead.riskLevel === "HOT" ? "HOT" :
                           lead.riskLevel === "WARM" ? "WARM" :
                           lead.riskLevel === "SPAM" ? "SPAM" : 
                           "COLD"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-text-secondary font-medium truncate" title={lead.fullName}>
                          {lead.fullName}
                        </p>
                        <p className="text-xs text-text-muted truncate flex items-center gap-1" title={lead.city}>
                           {lead.city}
                        </p>
                      </div>

                      <div className="bg-bg-secondary rounded-md px-3 py-2 space-y-1 border border-border-subtle/50">
                        <p className="text-xs text-text-secondary flex justify-between">
                          <span className="text-text-muted">Servicio:</span>
                          <span className="capitalize font-medium truncate max-w-[120px]">{lead.serviceType}</span>
                        </p>
                        <p className="text-xs text-text-secondary flex justify-between">
                          <span className="text-text-muted">Valor:</span>
                          <span className="font-bold text-text-primary">\${((lead.estimatedBudgetMax || 0) / 1000000).toFixed(1)}M</span>
                        </p>
                        <p className="text-xs text-text-secondary flex justify-between">
                          <span className="text-text-muted">Asesor:</span>
                          <span className={\`truncate max-w-[120px] \${!lead.assignedTo ? "text-text-muted italic" : "font-medium text-text-secondary"}\`}>
                            {lead.assignedTo || "Sin asignar"}
                          </span>
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                        <span className="text-[10px] text-text-muted font-mono">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        <Link 
                          href={\`/crm/\${lead.id}\`}
                          className="text-xs font-bold text-accent-cyan hover:text-accent-cyan/80 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ABRIR <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-border-subtle rounded-md flex items-center justify-center text-xs font-medium text-text-muted bg-bg-primary/50">
                      Soltar Lead Aquí
                    </div>
                  )}
                </div>
              </div>`;

// Replace all instances (just in case map is weird, but it's only once)
content = content.replace(oldKanban, newKanban);

fs.writeFileSync('app/crm/page.tsx', content, 'utf8');
console.log('CRM refactored successfully.');
