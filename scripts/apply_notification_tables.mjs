import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Creating crm_notification_events table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_notification_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        event_type character varying(100) NOT NULL,
        entity_type character varying(50) NOT NULL,
        entity_id uuid NOT NULL,
        priority character varying(20) NOT NULL DEFAULT 'P4',
        channel character varying(50) NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'pending',
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        sent_at timestamp without time zone
      );
    `;

    console.log("Creating crm_ticket_comments table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_ticket_comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES public.crm_service_requests(id) ON DELETE CASCADE,
        actor_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        actor_role character varying(50) NOT NULL,
        comment text NOT NULL,
        attachment_url text,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Enabling RLS on new tables...");
    await sql`ALTER TABLE public.crm_notification_events ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_ticket_comments ENABLE ROW LEVEL SECURITY;`;

    console.log("Dropping existing policies on new tables to avoid conflicts...");
    const policies = [
      { table: 'crm_notification_events', name: 'select_notification_events' },
      { table: 'crm_notification_events', name: 'all_crm_staff_notification_events' },
      { table: 'crm_ticket_comments', name: 'select_ticket_comments' },
      { table: 'crm_ticket_comments', name: 'insert_ticket_comments' },
      { table: 'crm_ticket_comments', name: 'all_crm_staff_ticket_comments' }
    ];

    for (const p of policies) {
      try {
        await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON public.${sql(p.table)};`;
      } catch (e) {
        console.warn(`Policy drop warning for ${p.name}:`, e.message);
      }
    }

    console.log("Applying RLS policies...");

    // crm_notification_events
    await sql`
      CREATE POLICY select_notification_events ON public.crm_notification_events 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_notification_events ON public.crm_notification_events 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_ticket_comments
    await sql`
      CREATE POLICY select_ticket_comments ON public.crm_ticket_comments 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_service_requests r 
          WHERE r.id = request_id AND r.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY insert_ticket_comments ON public.crm_ticket_comments 
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.crm_service_requests r 
          WHERE r.id = request_id AND r.customer_id = public.get_current_user_customer_id()
        ) AND actor_id = auth.uid()
      );
    `;
    await sql`
      CREATE POLICY all_crm_staff_ticket_comments ON public.crm_ticket_comments 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    console.log("Notification & Comments tables migration successfully applied!");
  } catch (err) {
    console.error("Error executing database migration SQL:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
