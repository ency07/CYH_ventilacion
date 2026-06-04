import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating indexes for crm_activity_logs...");

    await sql`CREATE INDEX IF NOT EXISTS activity_lead_id_idx ON public.crm_activity_logs (lead_id);`;
    await sql`CREATE INDEX IF NOT EXISTS activity_created_at_idx ON public.crm_activity_logs (created_at DESC);`;

    console.log("Activity log indexes created successfully!");
  } catch (err) {
    console.error("Error executing index creation:", err);
  } finally {
    await sql.end();
  }
}

run();
