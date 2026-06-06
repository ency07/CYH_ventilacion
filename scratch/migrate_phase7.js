import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("Altering tables...");
  try {
    await sql`
      ALTER TABLE "crm_opportunities" 
      ADD COLUMN IF NOT EXISTS "diagnostic_id" uuid REFERENCES "diagnostic_reports"("id") ON DELETE SET NULL;
    `;
    console.log("Added diagnostic_id to crm_opportunities");

    await sql`
      ALTER TABLE "crm_opportunities" 
      ADD COLUMN IF NOT EXISTS "service_type" varchar(50);
    `;
    console.log("Added service_type to crm_opportunities");

    await sql`
      ALTER TABLE "crm_proposals" 
      ADD COLUMN IF NOT EXISTS "diagnostic_id" uuid REFERENCES "diagnostic_reports"("id") ON DELETE SET NULL;
    `;
    console.log("Added diagnostic_id to crm_proposals");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

main();
