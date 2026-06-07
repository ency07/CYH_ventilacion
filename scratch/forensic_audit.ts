import { db } from "../lib/db/index";
import { 
  leads, 
  crmPipeline, 
  crmProposals, 
  crmOpportunities, 
  crmCompanies, 
  crmContacts, 
  crmUsers,
  crmActivityLogs,
  crmTasks,
  diagnosticReports
} from "../lib/db/schema";
import { eq, ne } from "drizzle-orm";

async function runAudit() {
  console.log("=== INICIANDO AUDITORÍA FORENSE NUCLEAR CYH ===");

  // 1. CARGA DE TABLAS
  const dbLeads = await db.select().from(leads);
  const dbPipelines = await db.select().from(crmPipeline);
  const dbProposals = await db.select().from(crmProposals);
  const dbOpps = await db.select().from(crmOpportunities);
  const dbCompanies = await db.select().from(crmCompanies);
  const dbContacts = await db.select().from(crmContacts);
  const dbUsers = await db.select().from(crmUsers);
  const dbLogs = await db.select().from(crmActivityLogs);
  const dbTasks = await db.select().from(crmTasks);
  const dbDiags = await db.select().from(diagnosticReports);

  console.log(`\n--- CONTEO DE REGISTROS ---`);
  console.log(`Leads: ${dbLeads.length}`);
  console.log(`Pipelines: ${dbPipelines.length}`);
  console.log(`Proposals: ${dbProposals.length}`);
  console.log(`Opportunities: ${dbOpps.length}`);
  console.log(`Companies: ${dbCompanies.length}`);
  console.log(`Contacts: ${dbContacts.length}`);
  console.log(`Users: ${dbUsers.length}`);
  console.log(`Activity Logs: ${dbLogs.length}`);
  console.log(`Tasks: ${dbTasks.length}`);
  console.log(`Diagnostics: ${dbDiags.length}`);

  // FASE 1: INTEGRIDAD RELACIONAL
  console.log(`\n--- FASE 1: AUDITORÍA DE CLAVES Y HUÉRFANOS ---`);
  
  // Claves rotas / Huérfanos
  const pOrphans = dbPipelines.filter(p => !dbLeads.some(l => l.id === p.leadId));
  const propOrphans = dbProposals.filter(p => !dbLeads.some(l => l.id === p.leadId));
  const oppOrphans = dbOpps.filter(o => !dbLeads.some(l => l.id === o.leadId));
  const taskOrphans = dbTasks.filter(t => !dbLeads.some(l => l.id === t.leadId));
  const logOrphans = dbLogs.filter(log => !dbLeads.some(l => l.id === log.leadId));
  const diagOrphans = dbDiags.filter(d => !dbLeads.some(l => l.id === d.leadId));
  const contactOrphans = dbContacts.filter(c => c.companyId && !dbCompanies.some(comp => comp.id === c.companyId));
  const leadCompanyOrphans = dbLeads.filter(l => l.companyId && !dbCompanies.some(c => c.id === l.companyId));

  console.log(`Pipelines huérfanos: ${pOrphans.length}`);
  console.log(`Propuestas huérfanas: ${propOrphans.length}`);
  console.log(`Oportunidades huérfanas: ${oppOrphans.length}`);
  console.log(`Tareas huérfanas: ${taskOrphans.length}`);
  console.log(`Logs huérfanos: ${logOrphans.length}`);
  console.log(`Diagnósticos huérfanos: ${diagOrphans.length}`);
  console.log(`Contactos huérfanos de empresa: ${contactOrphans.length}`);
  console.log(`Leads con empresa inválida: ${leadCompanyOrphans.length}`);

  // Inconsistencias de asignación
  console.log(`\n--- FASE 1: INCONSISTENCIAS DE ASIGNACIÓN ---`);
  const uniquePipelineAssignees = Array.from(new Set(dbPipelines.map(p => p.assignedTo).filter(Boolean)));
  const uniqueTaskAssignees = Array.from(new Set(dbTasks.map(t => t.assignedTo).filter(Boolean)));
  const userEmails = dbUsers.map(u => u.email);
  const userIds = dbUsers.map(u => u.id);

  console.log("Asesores asignados en pipelines:", uniquePipelineAssignees);
  console.log("Asesores asignados en tareas:", uniqueTaskAssignees);
  console.log("Emails de usuarios registrados:", userEmails);

  const invalidPipelineAssignees = uniquePipelineAssignees.filter(a => !userEmails.includes(a as string));
  const invalidTaskAssignees = uniqueTaskAssignees.filter(a => !userEmails.includes(a as string));
  console.log("Asesores inválidos en pipeline (no son emails de crm_users):", invalidPipelineAssignees);
  console.log("Asesores inválidos en tareas (no son emails de crm_users):", invalidTaskAssignees);

  // Duplicados
  const pipelineLeadIds = dbPipelines.map(p => p.leadId);
  const duplicatePipelines = pipelineLeadIds.filter((item, index) => pipelineLeadIds.indexOf(item) !== index);
  console.log(`Pipelines duplicados para el mismo lead: ${duplicatePipelines.length}`, duplicatePipelines);

  // FASE 3: RECONSTRUCCIÓN DE TRAZABILIDAD DE UN LEAD REAL
  console.log(`\n--- FASE 3: TRAZABILIDAD DE LEAD REAL ---`);
  // Buscamos un lead que tenga alguna actividad o propuesta o diagnóstico para reconstruir
  const candidateLead = dbLeads.find(l => 
    dbLogs.some(log => log.leadId === l.id) || 
    dbProposals.some(p => p.leadId === l.id) || 
    dbDiags.some(d => d.leadId === l.id)
  ) || dbLeads[0];

  if (candidateLead) {
    console.log(`Lead seleccionado para traza: ${candidateLead.fullName} (${candidateLead.id})`);
    console.log(`- Lead:`, {
      id: candidateLead.id,
      companyName: candidateLead.companyName,
      status: candidateLead.status,
      estimatedBudgetMax: candidateLead.estimatedBudgetMax,
      createdAt: candidateLead.createdAt,
      createdBy: candidateLead.createdBy
    });

    const pipelineOfLead = dbPipelines.filter(p => p.leadId === candidateLead.id);
    console.log(`- Pipeline entries (${pipelineOfLead.length}):`, pipelineOfLead.map(p => ({
      id: p.id, stage: p.stage, assignedTo: p.assignedTo, updatedAt: p.updatedAt
    })));

    const logsOfLead = dbLogs.filter(log => log.leadId === candidateLead.id);
    console.log(`- Actividades (${logsOfLead.length}):`, logsOfLead.map(l => ({
      id: l.id, type: l.activityType, desc: l.description, createdAt: l.createdAt, userId: l.userId
    })));

    const diagsOfLead = dbDiags.filter(d => d.leadId === candidateLead.id);
    console.log(`- Diagnósticos (${diagsOfLead.length}):`, diagsOfLead.map(d => ({
      id: d.id, airflow: d.airflow, status: d.status, createdAt: d.createdAt, approvedBy: d.approvedBy
    })));

    const tasksOfLead = dbTasks.filter(t => t.leadId === candidateLead.id);
    console.log(`- Tareas (${tasksOfLead.length}):`, tasksOfLead.map(t => ({
      id: t.id, type: t.taskType, status: t.status, assignedTo: t.assignedTo, dueDate: t.dueDate
    })));

    const oppsOfLead = dbOpps.filter(o => o.leadId === candidateLead.id);
    console.log(`- Oportunidades (${oppsOfLead.length}):`, oppsOfLead.map(o => ({
      id: o.id, title: o.title, value: o.estimatedValue, stage: o.stage, assignedTo: o.assignedTo
    })));

    const propsOfLead = dbProposals.filter(p => p.leadId === candidateLead.id);
    console.log(`- Propuestas (${propsOfLead.length}):`, propsOfLead.map(p => ({
      id: p.id, title: p.title, totalValue: p.totalValue, status: p.status, createdAt: p.createdAt
    })));

    const compOfLead = dbCompanies.find(c => c.id === candidateLead.companyId);
    console.log(`- Empresa relacionada:`, compOfLead ? { id: compOfLead.id, name: compOfLead.name } : "Ninguna");
  } else {
    console.log("No se encontró ningún lead candidato con historial.");
  }

  // FASE 4: COHERENCIA FINANCIERA
  console.log(`\n--- FASE 4: COHERENCIA FINANCIERA ---`);
  
  // Valor del Pipeline Total (Leads abiertos/ganados en la tabla leads)
  const totalLeadsValue = dbLeads
    .filter(l => l.status !== "perdido")
    .reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0);

  // Valor Ponderado del Pipeline en memoria (calculado en DashboardClient)
  const getProbability = (stage: string) => {
    switch (stage) {
      case 'nuevo': return 0.10;
      case 'contacto': return 0.20;
      case 'diagnostico': return 0.40;
      case 'reunion': return 0.50;
      case 'propuesta_entregada': return 0.70;
      case 'negociacion': return 0.80;
      case 'ganado': return 1.0;
      case 'perdido': return 0.0;
      default: return 0.0;
    }
  };

  const totalWeightedLeadsValue = dbLeads
    .filter(l => l.status !== "perdido")
    .reduce((sum, l) => sum + (l.estimatedBudgetMax || 0) * getProbability(l.status), 0);

  // Oportunidades (crm_opportunities)
  const totalOppsValue = dbOpps
    .filter(o => o.stage !== "cerrado_perdido")
    .reduce((sum, o) => sum + o.estimatedValue, 0);

  const totalWeightedOppsValue = dbOpps
    .filter(o => o.stage !== "cerrado_perdido")
    .reduce((sum, o) => sum + o.weightedValue, 0);

  // Propuestas (crm_proposals)
  const totalPropsValue = dbProposals
    .filter(p => p.status !== "rechazada")
    .reduce((sum, p) => sum + p.totalValue, 0);

  console.log(`Valor Bruto en Leads (Dashboard / Pipeline): ${totalLeadsValue} COP`);
  console.log(`Valor Ponderado en Leads (Dashboard): ${totalWeightedLeadsValue} COP`);
  console.log(`Valor Bruto en crm_opportunities (Forecast / Oportunidades): ${totalOppsValue} COP`);
  console.log(`Valor Ponderado en crm_opportunities: ${totalWeightedOppsValue} COP`);
  console.log(`Valor Total en crm_proposals (Propuestas): ${totalPropsValue} COP`);

  const rawDiscrepancy = Math.abs(totalLeadsValue - totalOppsValue);
  const pctDiscrepancy = totalLeadsValue > 0 ? (rawDiscrepancy / totalLeadsValue) * 100 : 0;
  console.log(`Diferencia Monetaria Bruta (Leads vs Opportunities): ${rawDiscrepancy} COP (${pctDiscrepancy.toFixed(2)}% de discrepancia)`);
}

runAudit();
