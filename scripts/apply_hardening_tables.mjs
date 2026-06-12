import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("1. Modifying crm_service_requests to add asset_id...");
    await sql`
      ALTER TABLE public.crm_service_requests 
      ADD COLUMN IF NOT EXISTS asset_id uuid REFERENCES public.crm_assets(id) ON DELETE SET NULL;
    `;

    console.log("2. Modifying crm_notification_events to add delivery columns...");
    await sql`
      ALTER TABLE public.crm_notification_events 
      ADD COLUMN IF NOT EXISTS error text,
      ADD COLUMN IF NOT EXISTS retries integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS message_text text;
    `;

    console.log("3. Modifying crm_users and crm_customers to add tenant_id...");
    await sql`
      ALTER TABLE public.crm_users 
      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.crm_tenant_config(id) ON DELETE SET NULL;
    `;
    await sql`
      ALTER TABLE public.crm_customers 
      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.crm_tenant_config(id) ON DELETE SET NULL;
    `;

    console.log("4. Creating tenant RLS helper functions...");
    await sql`
      CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
      RETURNS uuid AS $$
        SELECT tenant_id 
        FROM public.crm_users 
        WHERE id = auth.uid()
        LIMIT 1;
      $$ LANGUAGE sql SECURITY DEFINER;
    `;
    await sql`
      CREATE OR REPLACE FUNCTION public.get_current_user_role()
      RETURNS text AS $$
        SELECT role::text 
        FROM public.crm_users 
        WHERE id = auth.uid()
        LIMIT 1;
      $$ LANGUAGE sql SECURITY DEFINER;
    `;

    console.log("5. Rebuilding RLS policies...");
    
    // Enable RLS
    await sql`ALTER TABLE public.crm_users ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;`;

    // Drop conflicting policies
    const policiesToDrop = [
      { table: "crm_users", name: "select_crm_users" },
      { table: "crm_users", name: "all_crm_staff_users" },
      { table: "crm_customers", name: "select_customers" },
      { table: "crm_customers", name: "all_crm_staff_customers" }
    ];

    for (const p of policiesToDrop) {
      try {
        await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON public.${sql(p.table)};`;
      } catch (e) {
        console.warn(`Policy drop warning for ${p.name}:`, e.message);
      }
    }

    // Apply crm_users policies
    await sql`
      CREATE POLICY select_crm_users ON public.crm_users 
      FOR SELECT USING (
        id = auth.uid() OR 
        tenant_id = public.get_current_user_tenant_id() OR
        public.get_current_user_role() = 'root_dev'
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_users ON public.crm_users 
      FOR ALL USING (
        public.get_current_user_role() = 'root_dev' OR (
          public.get_current_user_role() IN ('admin') AND
          tenant_id = public.get_current_user_tenant_id()
        )
      );
    `;

    // Apply crm_customers policies
    await sql`
      CREATE POLICY select_customers ON public.crm_customers 
      FOR SELECT USING (
        id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_customers ON public.crm_customers 
      FOR ALL USING (
        public.get_current_user_role() = 'root_dev' OR (
          public.get_current_user_role() IN ('admin', 'vendedor', 'comercial', 'tecnico', 'ingeniero') AND
          tenant_id = public.get_current_user_tenant_id()
        )
      );
    `;

    console.log("Hardening migration executed successfully!");
  } catch (err) {
    console.error("Hardening migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
