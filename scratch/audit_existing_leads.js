import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("=== AUDITING EXISTING LEADS & RELATIONSHIPS ===");

  try {
    // Fetch all leads
    const leads = await sql`
      SELECT id, full_name, company_name, email, phone, created_at
      FROM "leads"
      ORDER BY created_at DESC;
    `;

    console.log(`Total leads found: ${leads.length}\n`);

    const results = [];

    for (const lead of leads) {
      // Check diagnostics
      const diags = await sql`SELECT id FROM "diagnostic_reports" WHERE lead_id = ${lead.id}`;
      // Check activities
      const acts = await sql`SELECT id FROM "crm_activity_logs" WHERE lead_id = ${lead.id}`;
      // Check tasks (normal tasks)
      const tasks = await sql`SELECT id FROM "crm_tasks" WHERE lead_id = ${lead.id} AND task_type NOT IN ('reunion', 'visita_tecnica')`;
      // Check meetings (tasks of type reunion/visita_tecnica)
      const meetings = await sql`SELECT id FROM "crm_tasks" WHERE lead_id = ${lead.id} AND task_type IN ('reunion', 'visita_tecnica')`;
      // Check opportunities
      const opps = await sql`SELECT id FROM "crm_opportunities" WHERE lead_id = ${lead.id}`;
      // Check proposals
      const props = await sql`SELECT id FROM "crm_proposals" WHERE lead_id = ${lead.id}`;

      results.push({
        id: lead.id,
        name: lead.full_name,
        company: lead.company_name,
        email: lead.email,
        phone: lead.phone,
        createdAt: lead.created_at,
        hasDiag: diags.length > 0,
        hasActs: acts.length > 0,
        hasTasks: tasks.length > 0,
        hasMeetings: meetings.length > 0,
        hasOpps: opps.length > 0,
        hasProps: props.length > 0
      });
    }

    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error("Auditing failed:", error);
  } finally {
    await sql.end();
  }
}

main();
