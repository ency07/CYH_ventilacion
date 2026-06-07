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
  console.log("Error reading .env file, using default connection string:", e);
}

if (!connectionString) {
  connectionString = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
}

const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("=== USERS ===");
    const users = await sql`SELECT id, email, full_name, role FROM crm_users;`;
    console.log(users);

    console.log("=== LEADS ===");
    const dbLeads = await sql`SELECT id, full_name, company_name, email, status, estimated_budget_max, created_at FROM leads;`;
    console.log(dbLeads);

    console.log("=== PIPELINE ===");
    const pipelines = await sql`SELECT id, lead_id, stage, assigned_to, probability FROM crm_pipeline;`;
    console.log(pipelines);

    console.log("=== OPPORTUNITIES ===");
    const opportunities = await sql`SELECT id, lead_id, title, estimated_value, probability, stage, assigned_to FROM crm_opportunities;`;
    console.log(opportunities);

  } catch (err) {
    console.error("Error inspecting database:", err);
  } finally {
    await sql.end();
  }
}

run();
