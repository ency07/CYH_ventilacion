import { db } from "../lib/db";
import { leads, crmPipeline, crmOpportunities, diagnosticReports } from "../lib/db/schema";

async function main() {
  const allLeads = await db.select().from(leads);
  const pipelines = await db.select().from(crmPipeline);
  const opps = await db.select().from(crmOpportunities);
  const diags = await db.select().from(diagnosticReports);

  console.log("LEADS COUNT:", allLeads.length);
  console.log("PIPELINE ASSIGNEES:", pipelines.map(p => ({ leadId: p.leadId, assignedTo: p.assignedTo, stage: p.stage })));
  console.log("OPPORTUNITIES:", opps.map(o => ({ leadId: o.leadId, title: o.title, stage: o.stage, val: o.estimatedValue })));
  console.log("DIAGNOSTICS:", diags.map(d => ({ leadId: d.leadId, status: d.status, airflow: d.airflow })));
}

main().catch(console.error);
