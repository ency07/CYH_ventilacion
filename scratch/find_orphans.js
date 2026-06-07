import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("=== SCANNING FOR ORPHAN RECORDS ===");

  try {
    // 1. diagnostic_reports sin lead
    const diagOrphans = await sql`
      SELECT count(*) FROM "diagnostic_reports" d
      LEFT JOIN "leads" l ON d.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Diagnostic reports without valid lead: ${diagOrphans[0].count}`);

    // 2. crm_opportunities sin lead
    const oppOrphans = await sql`
      SELECT count(*) FROM "crm_opportunities" o
      LEFT JOIN "leads" l ON o.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Opportunities without valid lead: ${oppOrphans[0].count}`);

    // 3. crm_proposals sin lead
    const propOrphans = await sql`
      SELECT count(*) FROM "crm_proposals" p
      LEFT JOIN "leads" l ON p.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Proposals without valid lead: ${propOrphans[0].count}`);

    // 4. crm_tasks sin lead
    const taskOrphans = await sql`
      SELECT count(*) FROM "crm_tasks" t
      LEFT JOIN "leads" l ON t.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Tasks without valid lead: ${taskOrphans[0].count}`);

    // 5. crm_activity_logs sin lead
    const actOrphans = await sql`
      SELECT count(*) FROM "crm_activity_logs" a
      LEFT JOIN "leads" l ON a.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Activity logs without valid lead: ${actOrphans[0].count}`);

    // 6. crm_pipeline sin lead
    const pipeOrphans = await sql`
      SELECT count(*) FROM "crm_pipeline" p
      LEFT JOIN "leads" l ON p.lead_id = l.id
      WHERE l.id IS NULL;
    `;
    console.log(`Pipeline entries without valid lead: ${pipeOrphans[0].count}`);

    // 7. crm_contacts sin company
    const contactOrphans = await sql`
      SELECT count(*) FROM "crm_contacts" c
      LEFT JOIN "crm_companies" co ON c.company_id = co.id
      WHERE co.id IS NULL AND c.company_id IS NOT NULL;
    `;
    console.log(`Contacts with invalid company reference: ${contactOrphans[0].count}`);

    // 8. crm_users sin auth.users id
    const userOrphans = await sql`
      SELECT count(*) FROM "crm_users" cu
      LEFT JOIN auth.users au ON cu.id = au.id
      WHERE au.id IS NULL;
    `;
    console.log(`CRM Users without valid auth.users: ${userOrphans[0].count}`);

  } catch (error) {
    console.error("Orphan scan failed:", error);
  } finally {
    await sql.end();
  }
}

main();
