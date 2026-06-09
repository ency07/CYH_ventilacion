import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_customers table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name character varying(255) NOT NULL,
        nit character varying(50),
        status character varying(50) NOT NULL DEFAULT 'activo',
        ltv integer NOT NULL DEFAULT 0,
        assigned_to character varying(255),
        recurrence_index integer NOT NULL DEFAULT 0,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_customer_plants table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_customer_plants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        name character varying(255) NOT NULL,
        city character varying(100) NOT NULL,
        address character varying(255),
        airflow_cfm integer NOT NULL DEFAULT 0,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_customer_contacts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_customer_contacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        full_name character varying(255) NOT NULL,
        cargo character varying(100),
        phone character varying(50),
        email character varying(255),
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Altering diagnostic_reports table...");
    await sql`
      ALTER TABLE public.diagnostic_reports 
      ADD COLUMN IF NOT EXISTS plant_id uuid REFERENCES public.crm_customer_plants(id) ON DELETE SET NULL;
    `;

    console.log("Success! B2B Customers module schema migration completed.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await sql.end();
  }
}

run();
