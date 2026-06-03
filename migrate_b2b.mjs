import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_companies table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name character varying(255) NOT NULL,
        industry character varying(100),
        city character varying(100),
        website character varying(255),
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_contacts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
        full_name character varying(255) NOT NULL,
        cargo character varying(100),
        email character varying(255),
        phone character varying(50),
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_documents table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
        file_name character varying(255) NOT NULL,
        file_url text NOT NULL,
        file_type character varying(50) NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Altering leads table...");
    await sql`
      ALTER TABLE public.leads 
      ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
    `;

    console.log("Success! B2B schema migration completed.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await sql.end();
  }
}

run();
