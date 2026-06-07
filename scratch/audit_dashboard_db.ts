import { db } from "../lib/db/index";
import { 
  leads, 
  crmPipeline, 
  crmProposals, 
  crmOpportunities, 
  crmCompanies, 
  crmContacts, 
  crmUsers,
  crmActivityLogs
} from "../lib/db/schema";
import { eq, ne } from "drizzle-orm";

async function main() {
  try {
    console.log("=== DB AUDIT FOR DASHBOARD INTEGRITY ===");

    // Fetch all records
    const allLeads = await db.select().from(leads);
    const allPipelines = await db.select().from(crmPipeline);
    const allProposals = await db.select().from(crmProposals);
    const allOpportunities = await db.select().from(crmOpportunities);
    const allCompanies = await db.select().from(crmCompanies);
    const allContacts = await db.select().from(crmContacts);
    const allUsers = await db.select().from(crmUsers);
    const allLogs = await db.select().from(crmActivityLogs);

    console.log(`Leads: ${allLeads.length}`);
    console.log(`Pipeline entries: ${allPipelines.length}`);
    console.log(`Proposals: ${allProposals.length}`);
    console.log(`Opportunities (Forecast): ${allOpportunities.length}`);
    console.log(`Companies (Clientes): ${allCompanies.length}`);
    console.log(`Contacts: ${allContacts.length}`);
    console.log(`Users (crm_users): ${allUsers.length}`);
    console.log(`Activity Logs: ${allLogs.length}`);

    console.log("\n=== ORPHANS & INTEGRITY CHECKS ===");

    // 1. Leads without a pipeline entry (Dashboard metrics will ignore pipeline details or stage mismatch)
    const leadsWithoutPipeline = allLeads.filter(l => !allPipelines.some(p => p.leadId === l.id));
    console.log(`- Leads sin registro en crm_pipeline: ${leadsWithoutPipeline.length}`);
    for (const l of leadsWithoutPipeline) {
      console.log(`  > ID: ${l.id}, Empresa: ${l.companyName}, Creado: ${l.createdAt}`);
    }

    // 2. Pipeline entries without corresponding leads
    const pipelinesWithoutLead = allPipelines.filter(p => !allLeads.some(l => l.id === p.leadId));
    console.log(`- Registros de crm_pipeline sin Lead (Huérfanos): ${pipelinesWithoutLead.length}`);
    for (const p of pipelinesWithoutLead) {
      console.log(`  > Pipeline ID: ${p.id}, LeadId: ${p.leadId}, Etapa: ${p.stage}`);
    }

    // 3. Opportunities without matching Leads
    const oppsWithoutLead = allOpportunities.filter(o => !allLeads.some(l => l.id === o.leadId));
    console.log(`- Oportunidades (Forecast) sin Lead (Huérfanos): ${oppsWithoutLead.length}`);
    for (const o of oppsWithoutLead) {
      console.log(`  > Opp ID: ${o.id}, Titulo: ${o.title}, LeadId: ${o.leadId}`);
    }

    // 4. Proposals without matching Leads
    const propsWithoutLead = allProposals.filter(p => !allLeads.some(l => l.id === p.leadId));
    console.log(`- Propuestas sin Lead (Huérfanos): ${propsWithoutLead.length}`);
    for (const p of propsWithoutLead) {
      console.log(`  > Prop ID: ${p.id}, Titulo: ${p.title}, LeadId: ${p.leadId}`);
    }

    // 5. Leads with missing Company relations
    const leadsWithoutCompany = allLeads.filter(l => !l.companyId);
    console.log(`- Leads sin relacion de Empresa (companyId is null): ${leadsWithoutCompany.length}`);
    
    // 6. Leads with companyId that doesn't exist in crmCompanies
    const leadsWithInvalidCompanyId = allLeads.filter(l => l.companyId && !allCompanies.some(c => c.id === l.companyId));
    console.log(`- Leads con companyId invalido (no existe en crm_companies): ${leadsWithInvalidCompanyId.length}`);
    for (const l of leadsWithInvalidCompanyId) {
      console.log(`  > Lead ID: ${l.id}, Nombre: ${l.fullName}, companyId: ${l.companyId}`);
    }

    // 7. Verify stage consistency between leads.status and crm_pipeline.stage
    console.log("\n=== CONSISTENCY CHECKS ===");
    let stageMismatches = 0;
    allPipelines.forEach(p => {
      const lead = allLeads.find(l => l.id === p.leadId);
      if (lead && lead.status !== p.stage) {
        stageMismatches++;
        console.log(`  > Mismatch: Lead ${lead.id} status is '${lead.status}' but crm_pipeline.stage is '${p.stage}'`);
      }
    });
    console.log(`- Desajustes de etapa entre leads.status y crm_pipeline.stage: ${stageMismatches}`);

    // 8. Verify Assigned Advisors in crm_pipeline against crm_users
    console.log("\n=== ASSIGNED ADVISORS VERIFICATION ===");
    const uniquePipelineAssignees = Array.from(new Set(allPipelines.map(p => p.assignedTo).filter(Boolean)));
    console.log(`Asesores en crm_pipeline: ${JSON.stringify(uniquePipelineAssignees)}`);
    console.log(`Usuarios registrados en crm_users:`);
    for (const u of allUsers) {
      console.log(`  > Nombre: ${u.fullName}, Email: ${u.email}, Rol: ${u.role}`);
    }
    
    const invalidAssignees = uniquePipelineAssignees.filter(email => !allUsers.some(u => u.email === email));
    console.log(`- Asesores asignados que NO existen en crm_users: ${JSON.stringify(invalidAssignees)}`);

  } catch (err) {
    console.error("Error during audit:", err);
  }
}

main();
