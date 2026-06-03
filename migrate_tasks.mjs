import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_tasks table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
        assigned_to character varying(255) NOT NULL DEFAULT 'Admin',
        task_type character varying(100) NOT NULL,
        due_date timestamp without time zone NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'pendiente',
        notes text,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;
    console.log("Success! crm_tasks table created.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await sql.end();
  }
}

run();
