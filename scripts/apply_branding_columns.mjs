import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Altering crm_tenant_branding table to add new branding columns...");
    await sql`
      ALTER TABLE public.crm_tenant_branding
      ADD COLUMN IF NOT EXISTS logo_dark_url text,
      ADD COLUMN IF NOT EXISTS favicon_url text,
      ADD COLUMN IF NOT EXISTS login_bg_url text,
      ADD COLUMN IF NOT EXISTS portal_bg_url text,
      ADD COLUMN IF NOT EXISTS btn_color character varying(50) NOT NULL DEFAULT '#0ea5e9',
      ADD COLUMN IF NOT EXISTS sidebar_color character varying(50) NOT NULL DEFAULT '#0f172a',
      ADD COLUMN IF NOT EXISTS login_color character varying(50) NOT NULL DEFAULT '#0f172a',
      ADD COLUMN IF NOT EXISTS portal_color character varying(50) NOT NULL DEFAULT '#0f172a',
      ADD COLUMN IF NOT EXISTS crm_config jsonb,
      ADD COLUMN IF NOT EXISTS pipeline_stages jsonb,
      ADD COLUMN IF NOT EXISTS portal_config jsonb;
    `;
    console.log("Migration columns applied successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
