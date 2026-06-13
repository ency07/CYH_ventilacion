import postgres from "postgres";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
const env = readFileSync(envPath, "utf8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  process.env[key] = val;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function run() {
  try {
    console.log("1. Creating crm_production_orders table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.crm_production_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
        invoice_id uuid REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
        order_number character varying(100) UNIQUE NOT NULL,
        status character varying(50) NOT NULL DEFAULT 'pago_confirmado',
        approved_by uuid REFERENCES public.crm_users(id) ON DELETE SET NULL,
        approved_at timestamp without time zone,
        details text,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `;

    console.log("2. Enabling Row Level Security...");
    await sql`ALTER TABLE public.crm_production_orders ENABLE ROW LEVEL SECURITY;`;

    console.log("3. Creating RLS policies...");
    await sql`DROP POLICY IF EXISTS select_production_orders ON public.crm_production_orders;`;
    await sql`
      CREATE POLICY select_production_orders ON public.crm_production_orders 
      FOR SELECT USING (
        customer_id = public.get_current_user_customer_id() OR
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    await sql`DROP POLICY IF EXISTS all_staff_production_orders ON public.crm_production_orders;`;
    await sql`
      CREATE POLICY all_staff_production_orders ON public.crm_production_orders 
      FOR ALL USING (
        (SELECT role FROM public.crm_users WHERE id = auth.uid()) IN ('admin', 'root_dev', 'vendedor', 'comercial', 'tecnico', 'ingeniero')
      );
    `;

    console.log("4. Seeding some initial production orders for test data if empty...");
    const existing = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'crm_production_orders'
      );
    `;
    
    // Check row count
    const rows = await sql`SELECT id FROM public.crm_production_orders LIMIT 1;`;
    if (rows.length === 0) {
      // Find a customer and a paid invoice to link
      const paidInvoices = await sql`
        SELECT i.id as invoice_id, i.customer_id, i.invoice_number 
        FROM public.crm_invoices i 
        WHERE i.status = 'paid' 
        LIMIT 3;
      `;

      for (let i = 0; i < paidInvoices.length; i++) {
        const inv = paidInvoices[i];
        const ofNumber = `OF-2026-${(i + 1).toString().padStart(4, "0")}`;
        const statuses = ["pago_confirmado", "listo_produccion", "generar_of", "produccion", "despacho"];
        const status = statuses[i % statuses.length];
        
        await sql`
          INSERT INTO public.crm_production_orders (customer_id, invoice_id, order_number, status, details)
          VALUES (
            ${inv.customer_id}, 
            ${inv.invoice_id}, 
            ${ofNumber}, 
            ${status}, 
            ${`Fabricación del sistema de ventilación mecánica industrial asociado a la Factura #${inv.invoice_number}.`}
          );
        `;
      }
      console.log(`Seeded ${paidInvoices.length} production orders.`);
    }

    console.log("Migration executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
