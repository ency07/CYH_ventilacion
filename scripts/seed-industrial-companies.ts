import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import * as crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://soqjlmnphdubaxvhfvpj.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWpsbW5waGR1YmF4dmhmdnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2ODkzNCwiZXhwIjoyMDk1NjQ0OTM0fQ.BAZ0P3zRYfYDBBLv06l-WNWVLmukSiQfnHL5OC9kGQ4";
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const sql = postgres(dbUrl, { prepare: false });

const companiesToSeed = [
  {
    name: "Acerías de Colombia S.A.S. (Acesco)",
    nit: "860.005.120-1",
    sector: "Manufactura",
    city: "Barranquilla",
    website: "www.acesco.com.co",
    contactName: "Luis Fernando Orozco",
    contactCargo: "Gerente de Planta",
    email: "l.orozco@acesco.com.co",
    phone: "+573154859620",
    plantName: "Planta Central Acesco",
    plantAddress: "Vía 40 No. 85-450",
    airflowCfm: 250000
  },
  {
    name: "Alpina Productos Alimenticios S.A.",
    nit: "860.002.536-3",
    sector: "Alimentos",
    city: "Sopó",
    website: "www.alpina.com",
    contactName: "María Camila Restrepo",
    contactCargo: "Directora de Operaciones",
    email: "m.restrepo@alpina.com",
    phone: "+573173004521",
    plantName: "Planta de Producción Sopó",
    plantAddress: "Km 3 Vía Sopó-Briceño",
    airflowCfm: 180000
  },
  {
    name: "Organización Terpel S.A.",
    nit: "860.009.541-4",
    sector: "Energía",
    city: "Bogotá",
    website: "www.terpel.com",
    contactName: "Carlos Andrés Pinzón",
    contactCargo: "Superintendente de Mantenimiento",
    email: "c.pinzon@terpel.com",
    phone: "+573105559874",
    plantName: "Terminal de Distribución Puente Aranda",
    plantAddress: "Calle 17 No. 54-85",
    airflowCfm: 160000
  },
  {
    name: "Petroquímica de Colombia S.A.S.",
    nit: "890.900.412-5",
    sector: "Petroquímica",
    city: "Cartagena",
    website: "www.petroquimica.co",
    contactName: "Jorge Eliecer Díaz",
    contactCargo: "Jefe de Mantenimiento Estático",
    email: "j.diaz@petroquimica.co",
    phone: "+573004445588",
    plantName: "Complejo Industrial Mamonal",
    plantAddress: "Km 11 Vía Mamonal",
    airflowCfm: 300000
  },
  {
    name: "Cementos Argos S.A.",
    nit: "890.900.203-7",
    sector: "Construcción",
    city: "Medellín",
    website: "www.argos.co",
    contactName: "Alejandro Echeverri",
    contactCargo: "Director de Producción",
    email: "a.echeverri@argos.co",
    phone: "+573127894512",
    plantName: "Planta Argos Yumbo",
    plantAddress: "Zona Industrial Yumbo",
    airflowCfm: 240000
  },
  {
    name: "Tecnoquímicas S.A.",
    nit: "890.300.221-8",
    sector: "Manufactura",
    city: "Cali",
    website: "www.tq.com.co",
    contactName: "Sandra Milena Patiño",
    contactCargo: "Gerente de Facilidades",
    email: "s.patino@tq.com.co",
    phone: "+573164561234",
    plantName: "Planta Farmacéutica Jamundí",
    plantAddress: "Km 2 Vía Panamericana Jamundí",
    airflowCfm: 200000
  },
  {
    name: "Servientrega Industrial S.A.",
    nit: "860.502.990-2",
    sector: "Logística",
    city: "Bogotá",
    website: "www.servientrega.com.co",
    contactName: "Giovanni Alarcón",
    contactCargo: "Director de Operaciones Logísticas",
    email: "g.alarcon@servientrega.com.co",
    phone: "+573156667788",
    plantName: "Hub Logístico Centro Administrativo",
    plantAddress: "Avenida El Dorado No. 103-22",
    airflowCfm: 150000
  },
  {
    name: "Inversiones HVAC del Caribe S.A.S.",
    nit: "900.123.456-1",
    sector: "HVAC",
    city: "Barranquilla",
    website: "www.hvacdelcaribe.com",
    contactName: "Jaime Alberto Mendoza",
    contactCargo: "Director Técnico",
    email: "j.mendoza@hvacdelcaribe.com",
    phone: "+573012345678",
    plantName: "Planta Ensambladora Vía 40",
    plantAddress: "Vía 40 No. 70-150",
    airflowCfm: 220000
  },
  {
    name: "Grupo Energía Bogotá S.A. E.S.P.",
    nit: "860.007.822-9",
    sector: "Energía",
    city: "Bogotá",
    website: "www.geb.com.co",
    contactName: "Ricardo José Beltrán",
    contactCargo: "Jefe de Conectividad y Planta",
    email: "r.beltran@geb.com.co",
    phone: "+573187654321",
    plantName: "Central Térmica Zipaquirá",
    plantAddress: "Km 4 Vía Zipaquirá-Cogua",
    airflowCfm: 280000
  },
  {
    name: "Compañía Nacional de Chocolates S.A.S.",
    nit: "890.900.250-9",
    sector: "Alimentos",
    city: "Rionegro",
    website: "www.chocolates.com.co",
    contactName: "Patricia Elena Gómez",
    contactCargo: "Gerente de Calidad e Infraestructura",
    email: "p.gomez@chocolates.com.co",
    phone: "+573142223344",
    plantName: "Planta Nacional Rionegro",
    plantAddress: "Autopista Medellín-Bogotá Km 38",
    airflowCfm: 175000
  },
  {
    name: "Refinería de Cartagena (Reficar)",
    nit: "900.287.112-3",
    sector: "Petroquímica",
    city: "Cartagena",
    website: "www.reficar.com.co",
    contactName: "Álvaro Enrique Uribe",
    contactCargo: "Superintendente de Confiabilidad",
    email: "a.uribe@reficar.com.co",
    phone: "+573204567890",
    plantName: "Complejo Reficar Cartagena",
    plantAddress: "Zona Industrial Mamonal Sector 4",
    airflowCfm: 320000
  },
  {
    name: "Constructora Colpatria S.A.",
    nit: "860.034.502-5",
    sector: "Construcción",
    city: "Bogotá",
    website: "www.colpatria.com",
    contactName: "Mauricio Vargas",
    contactCargo: "Director General de Obras",
    email: "m.vargas@colpatria.com",
    phone: "+573114445566",
    plantName: "Centro de Prefabricados Soacha",
    plantAddress: "Autopista Sur Km 15",
    airflowCfm: 190000
  },
  {
    name: "Coordinadora Mercantil S.A.",
    nit: "890.902.100-3",
    sector: "Logística",
    city: "Medellín",
    website: "www.coordinadora.com",
    contactName: "Clara Inés Henao",
    contactCargo: "Jefe de Distribución y Transporte",
    email: "c.henao@coordinadora.com",
    phone: "+573138889900",
    plantName: "Terminal de Carga El Poblado",
    plantAddress: "Carrera 48 No. 14-110",
    airflowCfm: 140000
  },
  {
    name: "Carrier Colombia S.A.S.",
    nit: "800.004.991-0",
    sector: "HVAC",
    city: "Cali",
    website: "www.carrier.com",
    contactName: "Felipe Arturo Castro",
    contactCargo: "Jefe de Ingeniería de Producto",
    email: "f.castro@carrier.com",
    phone: "+573024567891",
    plantName: "Planta Ensambladora Yumbo",
    plantAddress: "Calle 15 No. 4-80 Yumbo",
    airflowCfm: 210000
  },
  {
    name: "Alimentos Cárnicos S.A.S. (Zenú)",
    nit: "890.900.380-4",
    sector: "Alimentos",
    city: "Envigado",
    website: "www.zenu.com.co",
    contactName: "Juan Manuel Restrepo",
    contactCargo: "Jefe de Planta Envigado",
    email: "j.restrepo@zenu.com.co",
    phone: "+573104561122",
    plantName: "Planta Embutidos Zenú",
    plantAddress: "Carrera 43A No. 27 Sur-15",
    airflowCfm: 185000
  },
  {
    name: "Isagen S.A. E.S.P.",
    nit: "820.003.541-2",
    sector: "Energía",
    city: "San Carlos",
    website: "www.isagen.com.co",
    contactName: "Nelson de Jesús Montoya",
    contactCargo: "Supervisor de Mantenimiento Electromecánico",
    email: "n.montoya@isagen.com.co",
    phone: "+573157778899",
    plantName: "Central Hidroeléctrica San Carlos",
    plantAddress: "Vereda La Holanda, San Carlos",
    airflowCfm: 270000
  },
  {
    name: "Ecopetrol S.A.",
    nit: "899.999.068-1",
    sector: "Petroquímica",
    city: "Barrancabermeja",
    website: "www.ecopetrol.com.co",
    contactName: "Hernando de la Espriella",
    contactCargo: "Superintendente General de Refinación",
    email: "h.delaespriella@ecopetrol.com.co",
    phone: "+573219876543",
    plantName: "Refinería de Barrancabermeja",
    plantAddress: "Avenida Refinería Puerta 1",
    airflowCfm: 350000
  },
  {
    name: "Cementos San Marcos S.A.",
    nit: "900.412.563-7",
    sector: "Construcción",
    city: "Cali",
    website: "www.sanmarcos.com.co",
    contactName: "Walter Andrés Salazar",
    contactCargo: "Gerente Técnico",
    email: "w.salazar@sanmarcos.com.co",
    phone: "+573169875412",
    plantName: "Planta San Marcos Vijes",
    plantAddress: "Km 25 Vía Cali-Yumbo-Vijes",
    airflowCfm: 230000
  },
  {
    name: "DHL Global Forwarding Colombia S.A.",
    nit: "860.505.412-8",
    sector: "Logística",
    city: "Bogotá",
    website: "www.dhl.com",
    contactName: "Tatiana Lizeth Pardo",
    contactCargo: "Gerente de Logística y Almacenamiento",
    email: "t.pardo@dhl.com",
    phone: "+573124447788",
    plantName: "Bodega Industrial Funza",
    plantAddress: "Parque Industrial Galicia Funza",
    airflowCfm: 145000
  },
  {
    name: "Trane Colombia S.A.S.",
    nit: "800.111.222-3",
    sector: "HVAC",
    city: "Bogotá",
    website: "www.trane.com",
    contactName: "Diego Fernando Muñoz",
    contactCargo: "Director de Servicios",
    email: "d.munoz@trane.com",
    phone: "+573009990011",
    plantName: "Planta Ensambladora Trane Tocancipá",
    plantAddress: "Parque Industrial Gran Sabana Tocancipá",
    airflowCfm: 215000
  }
];

async function seed() {
  const args = process.argv.slice(2);
  let tenantId = "77777777-7777-7777-7777-777777777777"; // default to E2E test tenant ID

  // Parse custom tenant ID if passed as --tenantId=<value>
  for (const arg of args) {
    if (arg.startsWith("--tenantId=")) {
      tenantId = arg.split("=")[1];
    }
  }

  console.log(`Starting industrial companies seeding for Tenant ID: ${tenantId}...`);

  try {
    // 1. Verify tenant config exists
    const [tenant] = await sql`
      SELECT id, company_name FROM public.crm_tenant_config WHERE id = ${tenantId}
    `;

    if (!tenant) {
      console.warn(`[Seeding Warning] Tenant config for ID ${tenantId} not found in the database.`);
      // Fallback to check if any tenant exists
      const tenants = await sql`SELECT id, company_name FROM public.crm_tenant_config LIMIT 1`;
      if (tenants.length === 0) {
        throw new Error("No crm_tenant_config records found in the database. Please initialize a tenant first.");
      }
      tenantId = tenants[0].id;
      console.log(`[Seeding Fallback] Using active Tenant ID: ${tenantId} (${tenants[0].company_name})`);
    } else {
      console.log(`Verified target Tenant: ${tenant.company_name}`);
    }

    // 2. Identify or create a default comercial representative for assignments
    const comercialUsers = await sql`
      SELECT id, email FROM public.crm_users 
      WHERE tenant_id = ${tenantId} AND role IN ('comercial', 'vendedor', 'admin')
      LIMIT 1
    `;
    let ownerId: string | null = comercialUsers[0]?.id || null;
    let assignedTo: string | null = comercialUsers[0]?.email || null;

    if (!ownerId) {
      console.log("No salesperson found for the tenant. Creating default 'asesor@cyh-test.com'...");
      // Let's check if the auth user exists or create it
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingSalesUser = users.find(u => u.email === "asesor@cyh-test.com");
      let salesUserId = existingSalesUser?.id;

      if (!salesUserId) {
        const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
          email: "asesor@cyh-test.com",
          password: "CYH123456!",
          email_confirm: true,
          user_metadata: { full_name: "Asesor Comercial Test" }
        });
        if (authError || !user) {
          throw authError || new Error("Could not create sales agent in Auth.");
        }
        salesUserId = user.id;
      } else {
        await supabase.auth.admin.updateUserById(salesUserId, { password: "CYH123456!" });
      }

      await sql`
        INSERT INTO public.crm_users (id, email, full_name, role, tenant_id, is_active)
        VALUES (${salesUserId}, 'asesor@cyh-test.com', 'Asesor Comercial Test', 'comercial', ${tenantId}, true)
        ON CONFLICT (id) DO UPDATE SET role = 'comercial', tenant_id = ${tenantId}, is_active = true
      `;
      ownerId = salesUserId;
      assignedTo = "asesor@cyh-test.com";
    }

    console.log(`Assigning new accounts to owner ID: ${ownerId} (${assignedTo})`);

    // Fetch existing Auth users to check contacts before seeding
    const { data: { users: authUsersList } } = await supabase.auth.admin.listUsers();

    // 3. Loop and seed the 20 companies
    for (const companyData of companiesToSeed) {
      console.log(`\nProcessing Company: ${companyData.name} (${companyData.sector})`);

      // Clean up previous seeds with the same email or name to prevent FK/unique constraint violations
      const prevContacts = await sql`SELECT id FROM public.crm_customer_contacts WHERE email = ${companyData.email}`;
      for (const cont of prevContacts) {
        await sql`DELETE FROM public.crm_ticket_comments WHERE actor_id = ${cont.user_id}`;
        await sql`DELETE FROM public.crm_service_requests WHERE created_by = ${cont.user_id}`;
        await sql`DELETE FROM public.crm_customer_contacts WHERE id = ${cont.id}`;
      }

      const prevCustomers = await sql`SELECT id FROM public.crm_customers WHERE name = ${companyData.name}`;
      for (const cust of prevCustomers) {
        await sql`DELETE FROM public.crm_customer_plants WHERE customer_id = ${cust.id}`;
        await sql`DELETE FROM public.crm_customer_contacts WHERE customer_id = ${cust.id}`;
        await sql`DELETE FROM public.crm_customers WHERE id = ${cust.id}`;
      }

      await sql`DELETE FROM public.crm_companies WHERE name = ${companyData.name}`;

      // Delete existing profile in crm_users if any matches the email
      const prevUsers = await sql`SELECT id FROM public.crm_users WHERE email = ${companyData.email}`;
      for (const u of prevUsers) {
        await sql`DELETE FROM public.crm_users WHERE id = ${u.id}`;
      }

      // Ensure Auth user exists in Supabase
      let contactUserId: string | null = null;
      const existingAuth = authUsersList.find(u => u.email === companyData.email);

      if (existingAuth) {
        contactUserId = existingAuth.id;
        await supabase.auth.admin.updateUserById(contactUserId, { password: "CYH123456!" });
        console.log(`- Supabase Auth User already exists (ID: ${contactUserId}). Password updated.`);
      } else {
        const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
          email: companyData.email,
          password: "CYH123456!",
          email_confirm: true,
          user_metadata: { full_name: companyData.contactName }
        });
        if (authError || !user) {
          console.error(`- Error creating Auth user for ${companyData.email}:`, authError);
          continue;
        }
        contactUserId = user.id;
        console.log(`- Supabase Auth User created with ID: ${contactUserId}`);
      }

      // Insert/Ensure `crm_users` profile is created for the contact
      await sql`
        INSERT INTO public.crm_users (id, email, full_name, role, tenant_id, is_active)
        VALUES (${contactUserId}, ${companyData.email}, ${companyData.contactName}, 'cliente', ${tenantId}, true)
        ON CONFLICT (id) DO UPDATE SET role = 'cliente', tenant_id = ${tenantId}, is_active = true
      `;
      console.log("- Database CRM User profile upserted.");

      // Insert CRM Company record
      const [companyRecord] = await sql`
        INSERT INTO public.crm_companies (name, industry, city, website)
        VALUES (${companyData.name}, ${companyData.sector}, ${companyData.city}, ${companyData.website})
        RETURNING id
      `;
      console.log(`- CRM Company record established. (ID: ${companyRecord.id})`);

      // Insert CRM Customer record
      const customerId = crypto.randomUUID();
      await sql`
        INSERT INTO public.crm_customers (id, name, nit, status, ltv, assigned_to, recurrence_index, owner_id, tenant_id)
        VALUES (${customerId}, ${companyData.name}, ${companyData.nit}, 'activo', 150000000, ${assignedTo}, 85, ${ownerId}, ${tenantId})
      `;
      console.log(`- CRM Customer B2B record established. (ID: ${customerId})`);

      // Insert CRM Customer Plants record
      const plantId = crypto.randomUUID();
      await sql`
        INSERT INTO public.crm_customer_plants (id, customer_id, name, city, address, airflow_cfm)
        VALUES (${plantId}, ${customerId}, ${companyData.plantName}, ${companyData.city}, ${companyData.plantAddress}, ${companyData.airflowCfm})
      `;
      console.log(`- CRM Customer Plant established. (ID: ${plantId})`);

      // Insert CRM Customer Contacts record
      const contactId = crypto.randomUUID();
      await sql`
        INSERT INTO public.crm_customer_contacts (id, customer_id, full_name, cargo, phone, email, user_id)
        VALUES (${contactId}, ${customerId}, ${companyData.contactName}, ${companyData.contactCargo}, ${companyData.phone}, ${companyData.email}, ${contactUserId})
      `;
      console.log(`- CRM Customer Contact established and linked. (ID: ${contactId})`);
    }

    console.log("\n==================================================");
    console.log("✅ Seeding of 20 industrial companies completed successfully!");
    console.log(`Tenant ID linked: ${tenantId}`);
    console.log("Default passwords set: CYH123456!");
    console.log("==================================================");

  } catch (error) {
    console.error("Fatal error during seeding:", error);
  } finally {
    await sql.end();
  }
}

seed();
