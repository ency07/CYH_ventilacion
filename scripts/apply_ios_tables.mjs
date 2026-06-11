import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Applying column alterations to existing tables...");
    
    // crm_customers
    await sql`
      ALTER TABLE public.crm_customers 
      ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;
    await sql`
      ALTER TABLE public.crm_customers 
      ADD COLUMN IF NOT EXISTS backup_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;

    // crm_service_requests
    await sql`
      ALTER TABLE public.crm_service_requests 
      ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;

    // crm_documents
    await sql`
      ALTER TABLE public.crm_documents 
      ADD COLUMN IF NOT EXISTS status character varying(50) NOT NULL DEFAULT 'vigente';
    `;
    await sql`
      ALTER TABLE public.crm_documents 
      ADD COLUMN IF NOT EXISTS revision_number character varying(50) NOT NULL DEFAULT 'Rev.01';
    `;

    // crm_invoices approvals
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS engineering_status character varying(50) NOT NULL DEFAULT 'pending';
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS engineering_approved_by uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS engineering_approved_at timestamp without time zone;
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS procurement_status character varying(50) NOT NULL DEFAULT 'pending';
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS procurement_approved_by uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS procurement_approved_at timestamp without time zone;
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS finance_status character varying(50) NOT NULL DEFAULT 'pending';
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS finance_approved_by uuid REFERENCES public.crm_users(id) ON DELETE SET NULL;
    `;
    await sql`
      ALTER TABLE public.crm_invoices 
      ADD COLUMN IF NOT EXISTS finance_approved_at timestamp without time zone;
    `;

    console.log("Creating crm_skill_matrix table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_skill_matrix (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.crm_users(id) ON DELETE CASCADE,
        skill character varying(100) NOT NULL,
        certification_level character varying(50) NOT NULL DEFAULT 'basico',
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_technician_availability table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_technician_availability (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.crm_users(id) ON DELETE CASCADE,
        city character varying(100) NOT NULL,
        is_available boolean NOT NULL DEFAULT true,
        last_active_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_emergency_war_rooms table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_emergency_war_rooms (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES public.crm_service_requests(id) ON DELETE CASCADE,
        incident_code character varying(100) NOT NULL UNIQUE,
        status character varying(50) NOT NULL DEFAULT 'activo',
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        resolved_at timestamp without time zone,
        leader_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        responsible_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        approver_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        consulted_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        informed_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL
      );
    `;

    console.log("Creating crm_war_room_timeline table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_war_room_timeline (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        war_room_id uuid NOT NULL REFERENCES public.crm_emergency_war_rooms(id) ON DELETE CASCADE,
        actor_id uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        actor_name character varying(255) NOT NULL,
        event_type character varying(50) NOT NULL,
        description text NOT NULL,
        metadata jsonb,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_assets table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_assets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        plant_id uuid NOT NULL REFERENCES public.crm_customer_plants(id) ON DELETE CASCADE,
        name character varying(255) NOT NULL,
        code character varying(100) NOT NULL UNIQUE,
        operating_hours integer NOT NULL DEFAULT 0,
        last_maintenance_at timestamp without time zone,
        status character varying(50) NOT NULL DEFAULT 'operativo',
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_maintenance_plans table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_maintenance_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id uuid NOT NULL REFERENCES public.crm_assets(id) ON DELETE CASCADE,
        title character varying(255) NOT NULL,
        interval_hours integer NOT NULL,
        description text,
        next_maintenance_date timestamp without time zone,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_work_orders table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_work_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id uuid NOT NULL REFERENCES public.crm_assets(id) ON DELETE CASCADE,
        plan_id uuid REFERENCES public.crm_maintenance_plans(id) ON DELETE SET NULL,
        title character varying(255) NOT NULL,
        assigned_to uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        status character varying(50) NOT NULL DEFAULT 'programado',
        scheduled_date timestamp without time zone NOT NULL,
        completed_at timestamp without time zone,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_business_events table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_business_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type character varying(100) NOT NULL,
        entity_type character varying(50) NOT NULL,
        entity_id uuid NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'success',
        metadata jsonb NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("Creating crm_electronic_signatures table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_electronic_signatures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type character varying(50) NOT NULL,
        entity_id uuid NOT NULL,
        signer_email character varying(255) NOT NULL,
        signer_role character varying(100) NOT NULL,
        ip_address character varying(45) NOT NULL,
        user_agent text NOT NULL,
        signed_at timestamp without time zone NOT NULL DEFAULT now(),
        signature_hash character varying(255) NOT NULL
      );
    `;

    console.log("Enabling RLS on new tables...");
    await sql`ALTER TABLE public.crm_skill_matrix ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_technician_availability ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_emergency_war_rooms ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_war_room_timeline ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_assets ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_maintenance_plans ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_work_orders ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_business_events ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.crm_electronic_signatures ENABLE ROW LEVEL SECURITY;`;

    console.log("Dropping existing policies on tables to avoid conflicts...");
    const policies = [
      { table: 'crm_skill_matrix', name: 'staff_skill_matrix' },
      { table: 'crm_technician_availability', name: 'staff_tech_availability' },
      { table: 'crm_emergency_war_rooms', name: 'select_emergency_war_rooms' },
      { table: 'crm_emergency_war_rooms', name: 'staff_emergency_war_rooms' },
      { table: 'crm_war_room_timeline', name: 'select_war_room_timeline' },
      { table: 'crm_war_room_timeline', name: 'staff_war_room_timeline' },
      { table: 'crm_assets', name: 'select_crm_assets' },
      { table: 'crm_assets', name: 'staff_crm_assets' },
      { table: 'crm_maintenance_plans', name: 'select_crm_maintenance_plans' },
      { table: 'crm_maintenance_plans', name: 'staff_crm_maintenance_plans' },
      { table: 'crm_work_orders', name: 'select_crm_work_orders' },
      { table: 'crm_work_orders', name: 'staff_crm_work_orders' },
      { table: 'crm_business_events', name: 'staff_crm_business_events' },
      { table: 'crm_electronic_signatures', name: 'select_electronic_signatures' },
      { table: 'crm_electronic_signatures', name: 'staff_electronic_signatures' }
    ];

    for (const p of policies) {
      try {
        await sql`DROP POLICY IF EXISTS ${sql(p.name)} ON public.${sql(p.table)};`;
      } catch (e) {
        console.warn(`Policy drop warning for ${p.name}:`, e.message);
      }
    }

    console.log("Applying RLS policies...");

    // crm_skill_matrix & crm_technician_availability
    await sql`
      CREATE POLICY staff_skill_matrix ON public.crm_skill_matrix 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`
      CREATE POLICY staff_tech_availability ON public.crm_technician_availability 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_emergency_war_rooms & crm_war_room_timeline
    await sql`
      CREATE POLICY select_emergency_war_rooms ON public.crm_emergency_war_rooms 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_service_requests r 
          WHERE r.id = request_id AND r.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY staff_emergency_war_rooms ON public.crm_emergency_war_rooms 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`
      CREATE POLICY select_war_room_timeline ON public.crm_war_room_timeline 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_emergency_war_rooms wr
          JOIN public.crm_service_requests r ON r.id = wr.request_id
          WHERE wr.id = war_room_id AND r.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY staff_war_room_timeline ON public.crm_war_room_timeline 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_assets, crm_maintenance_plans, crm_work_orders
    await sql`
      CREATE POLICY select_crm_assets ON public.crm_assets 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_customer_plants p
          WHERE p.id = plant_id AND p.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY staff_crm_assets ON public.crm_assets 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`
      CREATE POLICY select_crm_maintenance_plans ON public.crm_maintenance_plans 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_assets a
          JOIN public.crm_customer_plants p ON p.id = a.plant_id
          WHERE a.id = asset_id AND p.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY staff_crm_maintenance_plans ON public.crm_maintenance_plans 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;
    await sql`
      CREATE POLICY select_crm_work_orders ON public.crm_work_orders 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.crm_assets a
          JOIN public.crm_customer_plants p ON p.id = a.plant_id
          WHERE a.id = asset_id AND p.customer_id = public.get_current_user_customer_id()
        )
      );
    `;
    await sql`
      CREATE POLICY staff_crm_work_orders ON public.crm_work_orders 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_business_events
    await sql`
      CREATE POLICY staff_crm_business_events ON public.crm_business_events 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    // crm_electronic_signatures
    await sql`
      CREATE POLICY select_electronic_signatures ON public.crm_electronic_signatures 
      FOR SELECT USING (
        (
          entity_type = 'proposal' AND EXISTS (
            SELECT 1 FROM public.crm_proposals prop
            JOIN public.leads l ON l.id = prop.lead_id
            JOIN public.crm_customers c ON c.name = l.company_name
            WHERE prop.id = entity_id AND c.id = public.get_current_user_customer_id()
          )
        ) OR (
          entity_type = 'contract' AND EXISTS (
            SELECT 1 FROM public.crm_contracts con
            WHERE con.id = entity_id AND con.customer_id = public.get_current_user_customer_id()
          )
        )
      );
    `;
    await sql`
      CREATE POLICY staff_electronic_signatures ON public.crm_electronic_signatures 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    console.log("Database successfully migrated with Phase 12 Industrial Control Room tables & RLS!");
  } catch (err) {
    console.error("Error executing database migration SQL:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
