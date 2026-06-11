import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Altering crm_customer_contacts to add user_id column...");
    await sql`
      ALTER TABLE public.crm_customer_contacts 
      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;

    console.log("Altering crm_documents to add customer_id column...");
    await sql`
      ALTER TABLE public.crm_documents 
      ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.crm_customers(id) ON DELETE SET NULL;
    `;

    console.log("Creating crm_service_requests table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_service_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        plant_id uuid REFERENCES public.crm_customer_plants(id) ON DELETE SET NULL,
        title character varying(255) NOT NULL,
        description text NOT NULL,
        urgency character varying(50) NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'abierta',
        created_by uuid NOT NULL REFERENCES public.crm_users(id),
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating public.get_current_user_customer_id() helper function...");
    await sql`
      CREATE OR REPLACE FUNCTION public.get_current_user_customer_id()
      RETURNS uuid AS $$
        SELECT customer_id 
        FROM public.crm_customer_contacts 
        WHERE user_id = auth.uid()
        LIMIT 1;
      $$ LANGUAGE sql SECURITY DEFINER;
    `;

    console.log("Enabling RLS on B2B customer and portal tables...");
    await sql`ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_customer_plants ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_customer_contacts ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_service_requests ENABLE ROW LEVEL SECURITY;`;

    console.log("Dropping existing policies to avoid conflicts...");
    const tables = ['crm_customers', 'crm_customer_plants', 'crm_customer_contacts', 'crm_documents', 'crm_service_requests'];
    const policies = [
      { table: 'crm_customers', name: 'select_customers' },
      { table: 'crm_customers', name: 'all_crm_staff_customers' },
      { table: 'crm_customer_plants', name: 'select_plants' },
      { table: 'crm_customer_plants', name: 'all_crm_staff_plants' },
      { table: 'crm_customer_contacts', name: 'select_contacts' },
      { table: 'crm_customer_contacts', name: 'all_crm_staff_contacts' },
      { table: 'crm_documents', name: 'select_documents' },
      { table: 'crm_documents', name: 'all_crm_staff_documents' },
      { table: 'crm_service_requests', name: 'select_requests' },
      { table: 'crm_service_requests', name: 'insert_requests' },
      { table: 'crm_service_requests', name: 'manage_requests' }
    ];

    for (const p of policies) {
      try {
        await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON public.${sql(p.table)};`;
      } catch (e) {
        console.warn(`Policy drop warning for ${p.name}:`, e.message);
      }
    }

    console.log("Applying RLS policies...");

    // CRM Customers
    await sql`
      CREATE POLICY select_customers ON public.crm_customers 
      FOR SELECT USING (
        id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_customers ON public.crm_customers 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // CRM Customer Plants
    await sql`
      CREATE POLICY select_plants ON public.crm_customer_plants 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_plants ON public.crm_customer_plants 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // CRM Customer Contacts
    await sql`
      CREATE POLICY select_contacts ON public.crm_customer_contacts 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_contacts ON public.crm_customer_contacts 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // CRM Documents
    await sql`
      CREATE POLICY select_documents ON public.crm_documents 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_documents ON public.crm_documents 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // CRM Service Requests
    await sql`
      CREATE POLICY select_requests ON public.crm_service_requests 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY insert_requests ON public.crm_service_requests 
      FOR INSERT WITH CHECK (
        customer_id = public.get_current_user_customer_id() AND created_by = auth.uid()
      );
    `;
    await sql`
      CREATE POLICY manage_requests ON public.crm_service_requests 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    console.log("Database changes and RLS policies successfully applied!");
  } catch (err) {
    console.error("Error executing database migration SQL:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
