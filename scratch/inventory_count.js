import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("=== COUNTING DATABASE INVENTORY ===");

  try {
    const [leads] = await sql`SELECT count(*) FROM "leads"`;
    const [diags] = await sql`SELECT count(*) FROM "diagnostic_reports"`;
    const [acts] = await sql`SELECT count(*) FROM "crm_activity_logs"`;
    const [tasks] = await sql`SELECT count(*) FROM "crm_tasks"`;
    const [props] = await sql`SELECT count(*) FROM "crm_proposals"`;
    const [opps] = await sql`SELECT count(*) FROM "crm_opportunities"`;

    console.log(`Leads: ${leads.count}`);
    console.log(`Diagnostics: ${diags.count}`);
    console.log(`Activities: ${acts.count}`);
    console.log(`Tasks: ${tasks.count}`);
    console.log(`Proposals: ${props.count}`);
    console.log(`Opportunities: ${opps.count}`);

  } catch (error) {
    console.error("Count failed:", error);
  } finally {
    await sql.end();
  }
}

main();
