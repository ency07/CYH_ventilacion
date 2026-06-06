import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkLead() {
  const sql = postgres(url);
  console.log("=== TRAZABILIDAD FORENSE QUERY ===");

  try {
    // 1. Leads Table
    const queryLeads = `SELECT * FROM "leads" WHERE "email" = 'trazabilidad@cyh-test.com'`;
    const leads = await sql`SELECT * FROM "leads" WHERE "email" = 'trazabilidad@cyh-test.com'`;
    console.log("\n--- LEADS ---");
    console.log("Query:", queryLeads);
    console.log("Count:", leads.length);
    if (leads.length > 0) {
      const lead = leads[0];
      console.log("Lead ID:", lead.id);
      console.log("Lead Name:", lead.full_name);
      console.log("Company Name:", lead.company_name);
      console.log("Email:", lead.email);
      console.log("Phone:", lead.phone);
      console.log("Service Type:", lead.service_type);
      console.log("Status:", lead.status);
      console.log("Company ID:", lead.company_id);
      console.log("Contact ID:", lead.contact_id);

      const leadId = lead.id;

      // 2. Pipeline Table
      const queryPipeline = `SELECT * FROM "crm_pipeline" WHERE "lead_id" = '${leadId}'`;
      const pipeline = await sql`SELECT * FROM "crm_pipeline" WHERE "lead_id" = ${leadId}`;
      console.log("\n--- PIPELINE ---");
      console.log("Query:", queryPipeline);
      console.log("Record:", JSON.stringify(pipeline[0] || null, null, 2));

      // 3. Clientes (crm_companies)
      const companyId = lead.company_id;
      const queryCompany = `SELECT * FROM "crm_companies" WHERE "id" = '${companyId}'`;
      const company = companyId ? await sql`SELECT * FROM "crm_companies" WHERE "id" = ${companyId}` : [];
      console.log("\n--- CLIENTES (crm_companies) ---");
      console.log("Query:", queryCompany);
      console.log("Record:", JSON.stringify(company[0] || null, null, 2));

      // 4. Diagnósticos (diagnostic_reports)
      const queryDiag = `SELECT * FROM "diagnostic_reports" WHERE "lead_id" = '${leadId}'`;
      const diagnostics = await sql`SELECT * FROM "diagnostic_reports" WHERE "lead_id" = ${leadId}`;
      console.log("\n--- DIAGNÓSTICOS (diagnostic_reports) ---");
      console.log("Query:", queryDiag);
      console.log("Record:", JSON.stringify(diagnostics[0] || null, null, 2));

      // 5. Actividades (crm_activity_logs)
      const queryActivities = `SELECT * FROM "crm_activity_logs" WHERE "lead_id" = '${leadId}'`;
      const activities = await sql`SELECT * FROM "crm_activity_logs" WHERE "lead_id" = ${leadId}`;
      console.log("\n--- ACTIVIDADES (crm_activity_logs) ---");
      console.log("Query:", queryActivities);
      console.log("Records Count:", activities.length);
      console.log("Record Sample:", JSON.stringify(activities[0] || null, null, 2));

      // 6. Tareas (crm_tasks - normal tasks)
      const queryTasks = `SELECT * FROM "crm_tasks" WHERE "lead_id" = '${leadId}' AND "task_type" NOT IN ('reunion', 'visita_tecnica')`;
      const tasks = await sql`SELECT * FROM "crm_tasks" WHERE "lead_id" = ${leadId} AND "task_type" NOT IN ('reunion', 'visita_tecnica')`;
      console.log("\n--- TAREAS (crm_tasks) ---");
      console.log("Query:", queryTasks);
      console.log("Records Count:", tasks.length);
      console.log("Record Sample:", JSON.stringify(tasks[0] || null, null, 2));

      // 7. Reuniones (crm_tasks - reunions)
      const queryMeetings = `SELECT * FROM "crm_tasks" WHERE "lead_id" = '${leadId}' AND "task_type" IN ('reunion', 'visita_tecnica')`;
      const meetings = await sql`SELECT * FROM "crm_tasks" WHERE "lead_id" = ${leadId} AND "task_type" IN ('reunion', 'visita_tecnica')`;
      console.log("\n--- REUNIONES (crm_tasks filtered) ---");
      console.log("Query:", queryMeetings);
      console.log("Records Count:", meetings.length);
      console.log("Record Sample:", JSON.stringify(meetings[0] || null, null, 2));

      // 8. Oportunidades (crm_opportunities)
      const queryOpps = `SELECT * FROM "crm_opportunities" WHERE "lead_id" = '${leadId}'`;
      const opportunities = await sql`SELECT * FROM "crm_opportunities" WHERE "lead_id" = ${leadId}`;
      console.log("\n--- OPORTUNIDADES (crm_opportunities) ---");
      console.log("Query:", queryOpps);
      console.log("Record:", JSON.stringify(opportunities[0] || null, null, 2));

      // 9. Propuestas (crm_proposals)
      const queryProposals = `SELECT * FROM "crm_proposals" WHERE "lead_id" = '${leadId}'`;
      const proposals = await sql`SELECT * FROM "crm_proposals" WHERE "lead_id" = ${leadId}`;
      console.log("\n--- PROPUESTAS (crm_proposals) ---");
      console.log("Query:", queryProposals);
      console.log("Record:", JSON.stringify(proposals[0] || null, null, 2));

      // 10. Alertas (calculated alerts from alerts page query)
      console.log("\n--- ALERTAS ---");
      const overdueTasks = await sql`SELECT * FROM "crm_tasks" WHERE "due_date" < NOW() AND "status" != 'completada' AND "lead_id" = ${leadId}`;
      const expiredProposals = await sql`SELECT * FROM "crm_proposals" WHERE "valid_until" < NOW() AND "status" = 'enviada' AND "lead_id" = ${leadId}`;
      const noContactLeads = await sql`
        SELECT l.* FROM "leads" l
        LEFT JOIN "crm_activity_logs" a ON l.id = a.lead_id
        WHERE l.status = 'nuevo' AND l.id = ${leadId} AND a.id IS NULL
      `;
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const stalledOpps = await sql`SELECT * FROM "crm_opportunities" WHERE "updated_at" < ${fifteenDaysAgo} AND "stage" NOT IN ('cerrado_ganado', 'cerrado_perdido') AND "lead_id" = ${leadId}`;

      console.log("Calculated Overdue Tasks for Lead:", overdueTasks.length);
      console.log("Calculated Expired Proposals for Lead:", expiredProposals.length);
      console.log("Calculated No Contact Leads for Lead:", noContactLeads.length);
      console.log("Calculated Stalled Opportunities for Lead:", stalledOpps.length);
      console.log("Total Active Alerts count for this lead:", overdueTasks.length + expiredProposals.length + noContactLeads.length + stalledOpps.length);

    } else {
      console.log("No test lead found for trazabilidad@cyh-test.com");
    }
  } catch (error) {
    console.error("Query execution error:", error);
  } finally {
    await sql.end();
  }
}

checkLead();
