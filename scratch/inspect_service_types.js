import postgres from "postgres";
import fs from "fs";

let connectionString = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) connectionString = match[1];
} catch (e) {}

if (!connectionString) {
  connectionString = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
}

const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    const dbLeads = await sql`SELECT id, company_name, service_type, risk_level, lead_score, urgency_level FROM leads;`;
    console.log("=== COLUMNS ===");
    console.log(dbLeads);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
