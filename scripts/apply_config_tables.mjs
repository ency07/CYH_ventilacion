import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_tenant_config table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_tenant_config (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name character varying(255) NOT NULL,
        nit character varying(50) NOT NULL,
        email character varying(255) NOT NULL,
        phone character varying(50),
        address text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_tenant_branding table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_tenant_branding (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES public.crm_tenant_config(id) ON DELETE CASCADE,
        logo_url text,
        primary_color character varying(50) NOT NULL DEFAULT '#0f172a',
        secondary_color character varying(50) NOT NULL DEFAULT '#0ea5e9',
        custom_css text,
        portal_name character varying(255) NOT NULL DEFAULT 'Portal Cliente',
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_tenant_integrations table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_tenant_integrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES public.crm_tenant_config(id) ON DELETE CASCADE,
        telegram_bot_token text,
        telegram_chat_id_ventas character varying(100),
        telegram_chat_id_servicio character varying(100),
        telegram_chat_id_ingenieria character varying(100),
        telegram_chat_id_direccion character varying(100),
        telegram_chat_id_postventa character varying(100),
        resend_api_key text,
        twilio_account_sid text,
        twilio_auth_token text,
        twilio_whatsapp_from character varying(100),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_media_library table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_media_library (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name character varying(255) NOT NULL,
        file_url text NOT NULL,
        file_size integer,
        mime_type character varying(100),
        uploaded_by uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Enabling RLS...");
    await sql`ALTER TABLE public.crm_tenant_config ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_tenant_branding ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_tenant_integrations ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_media_library ENABLE ROW LEVEL SECURITY;`;

    console.log("Dropping existing policies on these tables to avoid conflicts...");
    const policies = [
      { table: 'crm_tenant_config', name: 'select_tenant_config' },
      { table: 'crm_tenant_config', name: 'all_crm_staff_tenant_config' },
      { table: 'crm_tenant_branding', name: 'select_tenant_branding' },
      { table: 'crm_tenant_branding', name: 'all_crm_staff_tenant_branding' },
      { table: 'crm_tenant_integrations', name: 'all_crm_staff_tenant_integrations' },
      { table: 'crm_media_library', name: 'select_media_library' },
      { table: 'crm_media_library', name: 'insert_media_library' },
      { table: 'crm_media_library', name: 'manage_media_library' },
      { table: 'crm_electronic_signatures', name: 'select_electronic_signatures' }
    ];

    for (const p of policies) {
      try {
        await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON public.${sql(p.table)};`;
      } catch (e) {
        console.warn(`Policy drop warning for ${p.name}:`, e.message);
      }
    }

    console.log("Applying RLS policies...");

    // crm_tenant_config
    await sql`
      CREATE POLICY select_tenant_config ON public.crm_tenant_config
      FOR SELECT USING (auth.uid() IS NOT NULL);
    `;
    await sql`
      CREATE POLICY all_crm_staff_tenant_config ON public.crm_tenant_config
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev')
      );
    `;

    // crm_tenant_branding
    await sql`
      CREATE POLICY select_tenant_branding ON public.crm_tenant_branding
      FOR SELECT USING (true);
    `;
    await sql`
      CREATE POLICY all_crm_staff_tenant_branding ON public.crm_tenant_branding
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev')
      );
    `;

    // crm_tenant_integrations
    await sql`
      CREATE POLICY all_crm_staff_tenant_integrations ON public.crm_tenant_integrations
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev')
      );
    `;

    // crm_media_library
    await sql`
      CREATE POLICY select_media_library ON public.crm_media_library
      FOR SELECT USING (auth.uid() IS NOT NULL);
    `;
    await sql`
      CREATE POLICY insert_media_library ON public.crm_media_library
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    `;
    await sql`
      CREATE POLICY manage_media_library ON public.crm_media_library
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev') OR uploaded_by = auth.uid()
      );
    `;

    // crm_electronic_signatures (Secure rebuild mapping UUIDs instead of text strings)
    console.log("Rebuilding select_electronic_signatures policy...");
    await sql`
      CREATE POLICY select_electronic_signatures ON public.crm_electronic_signatures 
      FOR SELECT USING (
        (
          entity_type = 'proposal' AND EXISTS (
            SELECT 1 FROM public.crm_proposals prop
            JOIN public.leads l ON l.id = prop.lead_id
            WHERE prop.id = entity_id AND l.customer_id = public.get_current_user_customer_id()
          )
        ) OR (
          entity_type = 'contract' AND EXISTS (
            SELECT 1 FROM public.crm_contracts con
            WHERE con.id = entity_id AND con.customer_id = public.get_current_user_customer_id()
          )
        )
      );
    `;

    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
