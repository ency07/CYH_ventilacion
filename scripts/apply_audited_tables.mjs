import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("1. Creating crm_notifications table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        customer_id uuid REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        title character varying(255) NOT NULL,
        message text NOT NULL,
        channel character varying(50) NOT NULL,
        severity character varying(20) NOT NULL DEFAULT 'info',
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("2. Creating crm_sla_policies table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_sla_policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        priority character varying(20) UNIQUE NOT NULL,
        response_time_hours integer NOT NULL,
        resolution_time_hours integer NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("3. Creating crm_sla_events table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_sla_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES public.crm_service_requests(id) ON DELETE CASCADE,
        policy_id uuid REFERENCES public.crm_sla_policies(id) ON DELETE RESTRICT,
        response_deadline timestamp without time zone NOT NULL,
        resolution_deadline timestamp without time zone NOT NULL,
        first_responded_at timestamp without time zone,
        resolved_at timestamp without time zone,
        response_sla_status character varying(50) NOT NULL DEFAULT 'pending',
        resolution_sla_status character varying(50) NOT NULL DEFAULT 'pending',
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("4. Creating crm_escalation_rules table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_escalation_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id uuid NOT NULL REFERENCES public.crm_sla_policies(id) ON DELETE CASCADE,
        trigger_after_hours integer NOT NULL,
        escalate_to_role character varying(50) NOT NULL,
        action_type character varying(50) NOT NULL DEFAULT 'telegram',
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("5. Creating crm_contracts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_contracts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        title character varying(255) NOT NULL,
        value integer NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'active',
        start_date timestamp without time zone,
        end_date timestamp without time zone,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("6. Creating crm_invoices table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        contract_id uuid REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
        invoice_number character varying(100) UNIQUE NOT NULL,
        amount integer NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'pending',
        due_date timestamp without time zone NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("7. Creating crm_accounts_receivable table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_accounts_receivable (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        invoice_id uuid UNIQUE NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
        outstanding_balance integer NOT NULL,
        days_past_due integer NOT NULL DEFAULT 0,
        collection_status character varying(50) NOT NULL DEFAULT 'normal',
        last_reminder_sent timestamp without time zone,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("8. Creating crm_payments table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
        amount integer NOT NULL,
        payment_method character varying(50) NOT NULL,
        transaction_id character varying(255),
        status character varying(50) NOT NULL DEFAULT 'approved',
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Seeding SLA Policies default rows...");
    await sql`
      INSERT INTO public.crm_sla_policies (priority, response_time_hours, resolution_time_hours)
      VALUES 
        ('critica', 4, 24),
        ('alta', 12, 48),
        ('media', 24, 72),
        ('baja', 72, 144)
      ON CONFLICT (priority) DO UPDATE 
      SET response_time_hours = EXCLUDED.response_time_hours, 
          resolution_time_hours = EXCLUDED.resolution_time_hours;
    `;

    console.log("Enabling RLS on new tables...");
    await sql`ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_sla_policies ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_sla_events ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_escalation_rules ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_contracts ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_invoices ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_accounts_receivable ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;`;

    console.log("Applying RLS policies...");

    // crm_notifications
    await sql`DROP POLICY IF EXISTS select_notifications ON public.crm_notifications;`;
    await sql`
      CREATE POLICY select_notifications ON public.crm_notifications 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id() OR
        user_id = auth.uid() OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS insert_notifications ON public.crm_notifications;`;
    await sql`
      CREATE POLICY insert_notifications ON public.crm_notifications 
      FOR INSERT WITH CHECK (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_sla_policies
    await sql`DROP POLICY IF EXISTS select_sla_policies ON public.crm_sla_policies;`;
    await sql`
      CREATE POLICY select_sla_policies ON public.crm_sla_policies 
      FOR SELECT USING (true);
    `;
    await sql`DROP POLICY IF EXISTS all_staff_sla_policies ON public.crm_sla_policies;`;
    await sql`
      CREATE POLICY all_staff_sla_policies ON public.crm_sla_policies 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_sla_events
    await sql`DROP POLICY IF EXISTS select_sla_events ON public.crm_sla_events;`;
    await sql`
      CREATE POLICY select_sla_events ON public.crm_sla_events 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_service_requests r 
          WHERE r.id = request_id AND r.customer_id = public.get_current_user_customer_id()
        ) OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS all_staff_sla_events ON public.crm_sla_events;`;
    await sql`
      CREATE POLICY all_staff_sla_events ON public.crm_sla_events 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_contracts
    await sql`DROP POLICY IF EXISTS select_contracts ON public.crm_contracts;`;
    await sql`
      CREATE POLICY select_contracts ON public.crm_contracts 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id() OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS all_staff_contracts ON public.crm_contracts;`;
    await sql`
      CREATE POLICY all_staff_contracts ON public.crm_contracts 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_invoices
    await sql`DROP POLICY IF EXISTS select_invoices ON public.crm_invoices;`;
    await sql`
      CREATE POLICY select_invoices ON public.crm_invoices 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id() OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS all_staff_invoices ON public.crm_invoices;`;
    await sql`
      CREATE POLICY all_staff_invoices ON public.crm_invoices 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_accounts_receivable
    await sql`DROP POLICY IF EXISTS select_accounts_receivable ON public.crm_accounts_receivable;`;
    await sql`
      CREATE POLICY select_accounts_receivable ON public.crm_accounts_receivable 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id() OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS all_staff_accounts_receivable ON public.crm_accounts_receivable;`;
    await sql`
      CREATE POLICY all_staff_accounts_receivable ON public.crm_accounts_receivable 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_payments
    await sql`DROP POLICY IF EXISTS select_payments ON public.crm_payments;`;
    await sql`
      CREATE POLICY select_payments ON public.crm_payments 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_invoices i
          WHERE i.id = invoice_id AND i.customer_id = public.get_current_user_customer_id()
        ) OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`DROP POLICY IF EXISTS all_staff_payments ON public.crm_payments;`;
    await sql`
      CREATE POLICY all_staff_payments ON public.crm_payments 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
