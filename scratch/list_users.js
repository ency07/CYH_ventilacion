import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("=== LISTING CRM USERS ===");

  try {
    const users = await sql`
      SELECT id, full_name, email, role, created_at
      FROM "crm_users"
      ORDER BY role;
    `;
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Listing failed:", error);
  } finally {
    await sql.end();
  }
}

main();
