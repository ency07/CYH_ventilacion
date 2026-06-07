import { db } from "../lib/db/index";
import { leads, diagnosticReports, crmProposals } from "../lib/db/schema";

async function main() {
  try {
    console.log("=== LEADS IN DATABASE ===");
    const allLeads = await db.select().from(leads);
    console.log(`Total Leads: ${allLeads.length}`);
    for (const lead of allLeads) {
      console.log(`Lead ID: ${lead.id}, Name: ${lead.fullName}, Company: ${lead.companyName}`);
    }

    console.log("\n=== DIAGNOSTICS IN DATABASE ===");
    const allDiags = await db.select().from(diagnosticReports);
    console.log(`Total Diagnostics: ${allDiags.length}`);
    for (const diag of allDiags) {
      console.log(`Diag ID: ${diag.id}, LeadID: ${diag.leadId}, Airflow: ${diag.airflow}, Status: ${diag.status}`);
    }

    console.log("\n=== PROPOSALS IN DATABASE ===");
    const allProps = await db.select().from(crmProposals);
    console.log(`Total Proposals: ${allProps.length}`);
    for (const prop of allProps) {
      console.log(`Prop ID: ${prop.id}, LeadID: ${prop.leadId}, Title: ${prop.title}, Status: ${prop.status}`);
    }
  } catch (err) {
    console.error("Error inspecting database:", err);
  }
}

main();
