import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://soqjlmnphdubaxvhfvpj.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWpsbW5waGR1YmF4dmhmdnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2ODkzNCwiZXhwIjoyMDk1NjQ0OTM0fQ.BAZ0P3zRYfYDBBLv06l-WNWVLmukSiQfnHL5OC9kGQ4";
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
export const sql = postgres(dbUrl, { prepare: false });

export async function ensureTestUser(email: string, role: string, fullName: string) {
  const password = "CYH123456!";
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let existingUser = users.find(u => u.email === email);
  let userId;

  if (existingUser) {
    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
    userId = existingUser.id;
  } else {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (error || !user) throw error || new Error("No se pudo crear el usuario");
    userId = user.id;
  }

  // Upsert profile in crm_users table
  const exists = await sql`SELECT * FROM crm_users WHERE id = ${userId}`;
  if (exists.length === 0) {
    await sql`INSERT INTO crm_users (id, email, full_name, role) VALUES (${userId}, ${email}, ${fullName}, ${role})`;
  } else {
    await sql`UPDATE crm_users SET email = ${email}, full_name = ${fullName}, role = ${role} WHERE id = ${userId}`;
  }

  return userId;
}

export async function cleanupTestLeadsByEmail(email: string) {
  // Delete references in pipeline, opportunities, diagnostics, and proposals first
  const leadsList = await sql`SELECT id FROM leads WHERE email = ${email}`;
  for (const l of leadsList) {
    await sql`DELETE FROM crm_pipeline WHERE lead_id = ${l.id}`;
    await sql`DELETE FROM crm_opportunities WHERE lead_id = ${l.id}`;
    await sql`DELETE FROM diagnostic_reports WHERE lead_id = ${l.id}`;
    await sql`DELETE FROM crm_proposals WHERE lead_id = ${l.id}`;
    await sql`DELETE FROM crm_tasks WHERE lead_id = ${l.id}`;
  }
  if (leadsList.length > 0) {
    const ids = leadsList.map(l => l.id);
    await sql`DELETE FROM leads WHERE id = ANY(${ids})`;
  }
}
