import postgres from "postgres";
import fs from "fs";

// Read DATABASE_URL from .env
let connectionString = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) {
    connectionString = match[1];
  }
} catch (e) {
  console.log("Error reading .env file:", e);
}

if (!connectionString) {
  connectionString = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
}

const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Starting DB Sync & Backfill...");

    // 1. Get all leads
    const allLeads = await sql`SELECT * FROM leads;`;
    console.log(`Found ${allLeads.length} leads in database.`);

    const oppStageMap = {
      "nuevo": "analisis",
      "contacto": "analisis",
      "reunion": "analisis",
      "diagnostico": "analisis",
      "propuesta_prep": "propuesta",
      "propuesta_entregada": "propuesta",
      "negociacion": "negociacion",
      "ganado": "cerrado_ganado",
      "perdido": "cerrado_perdido",
    };

    const oppProbMap = {
      "analisis": 20,
      "propuesta": 50,
      "negociacion": 70,
      "cerrado_ganado": 100,
      "cerrado_perdido": 0,
    };

    const pipelineProbMap = {
      "nuevo": 10,
      "contacto": 20,
      "diagnostico": 40,
      "reunion": 50,
      "propuesta_prep": 60,
      "propuesta_entregada": 70,
      "negociacion": 80,
      "ganado": 100,
      "perdido": 0,
    };

    // Distribute assignments: 6 leads to comercial@cyh.com, 4 to admin@cyh.com
    for (let i = 0; i < allLeads.length; i++) {
      const lead = allLeads[i];
      const assignedTo = i < 6 ? "comercial@cyh.com" : "admin@cyh.com";
      const leadStatus = lead.status || "nuevo";
      const budget = lead.estimated_budget_max || 10000000;

      console.log(`Processing lead: ${lead.full_name} (${lead.company_name}) - status: ${leadStatus}, budget: ${budget}`);

      // Sync Pipeline
      const [existingPipeline] = await sql`SELECT id FROM crm_pipeline WHERE lead_id = ${lead.id};`;
      const pipeProb = pipelineProbMap[leadStatus] || 10;
      if (existingPipeline) {
        await sql`
          UPDATE crm_pipeline 
          SET stage = ${leadStatus}, 
              assigned_to = ${assignedTo}, 
              probability = ${pipeProb},
              updated_at = NOW() 
          WHERE id = ${existingPipeline.id};
        `;
        console.log(`  Updated pipeline entry.`);
      } else {
        await sql`
          INSERT INTO crm_pipeline (lead_id, stage, priority, assigned_to, probability, created_at, updated_at)
          VALUES (${lead.id}, ${leadStatus}, 'media', ${assignedTo}, ${pipeProb}, NOW(), NOW());
        `;
        console.log(`  Created new pipeline entry.`);
      }

      // Sync Opportunities
      const targetOppStage = oppStageMap[leadStatus] || "analisis";
      const targetOppProb = oppProbMap[targetOppStage] || 50;
      const weighted = Math.round((budget * targetOppProb) / 100);

      const [existingOpp] = await sql`SELECT id FROM crm_opportunities WHERE lead_id = ${lead.id};`;
      if (existingOpp) {
        await sql`
          UPDATE crm_opportunities 
          SET stage = ${targetOppStage}, 
              assigned_to = ${assignedTo}, 
              estimated_value = ${budget}, 
              probability = ${targetOppProb}, 
              weighted_value = ${weighted},
              updated_at = NOW()
          WHERE id = ${existingOpp.id};
        `;
        console.log(`  Updated opportunity entry.`);
      } else {
        const title = `Proyecto ${lead.service_type.toUpperCase()} - ${lead.company_name}`;
        await sql`
          INSERT INTO crm_opportunities (lead_id, service_type, title, estimated_value, probability, weighted_value, expected_close_date, stage, assigned_to, created_at, updated_at)
          VALUES (${lead.id}, ${lead.service_type}, ${title}, ${budget}, ${targetOppProb}, ${weighted}, NOW() + INTERVAL '30 days', ${targetOppStage}, ${assignedTo}, NOW(), NOW());
        `;
        console.log(`  Created new opportunity entry.`);
      }
    }

    console.log("Sync & Backfill completed successfully!");

  } catch (err) {
    console.error("Error running Sync & Backfill:", err);
  } finally {
    await sql.end();
  }
}

run();
