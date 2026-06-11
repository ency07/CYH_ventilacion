import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabaseUrl = "https://soqjlmnphdubaxvhfvpj.supabase.co";
// Supabase service key (bypass RLS for setup)
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWpsbW5waGR1YmF4dmhmdnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA2ODkzNCwiZXhwIjoyMDk1NjQ0OTM0fQ.BAZ0P3zRYfYDBBLv06l-WNWVLmukSiQfnHL5OC9kGQ4";
const dbUrl = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const sql = postgres(dbUrl, { prepare: false });

async function run() {
  try {
    const email = "cliente.prueba@cyh.com";
    const password = "ClienteCYH2026*";
    const fullName = "Cliente de Prueba B2B";
    const customerName = "Servicios Industriales del Caribe S.A.S.";

    console.log("Cleaning up previous database rows...");
    await sql`DELETE FROM crm_service_requests WHERE title = 'Calibración de Flujo Extractor Principal'`;
    await sql`DELETE FROM crm_documents WHERE file_name = 'Plano_Rediseño_Ventilacion_Norte.pdf'`;
    await sql`DELETE FROM crm_proposals WHERE title = 'Mantenimiento Preventivo Extractores Axiales V1'`;
    await sql`DELETE FROM leads WHERE company_name = ${customerName}`;
    await sql`DELETE FROM crm_customer_plants WHERE name = 'Planta Norte - Barranquilla'`;
    await sql`DELETE FROM crm_customer_contacts WHERE email = ${email}`;
    await sql`DELETE FROM crm_customers WHERE name = ${customerName}`;
    await sql`DELETE FROM crm_companies WHERE name = ${customerName}`;
    await sql`DELETE FROM crm_users WHERE email = ${email}`;

    console.log("Creating test B2B client user in Supabase Auth...");
    
    // 1. Create Supabase Auth User
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    let userId = null;

    if (authError) {
      if (authError.message.includes("already exists") || authError.message.includes("registered") || authError.status === 422) {
        console.log("User already exists, fetching existing user ID and resetting password...");
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(userId, { password });
          console.log("Password reset successfully.");
        }
      } else {
        throw authError;
      }
    } else if (user) {
      userId = user.id;
      console.log("Auth user created with ID:", userId);
    }

    if (!userId) {
      throw new Error("Could not resolve user ID.");
    }

    // 2. Create crm_users profile
    console.log("Upserting profile in crm_users...");
    const existingProfile = await sql`SELECT id FROM crm_users WHERE id = ${userId}`;
    if (existingProfile.length === 0) {
      await sql`
        INSERT INTO crm_users (id, email, full_name, role, is_active)
        VALUES (${userId}, ${email}, ${fullName}, 'cliente', true)
      `;
    } else {
      await sql`
        UPDATE crm_users 
        SET role = 'cliente', full_name = ${fullName}, is_active = true 
        WHERE id = ${userId}
      `;
    }

    // 3. Create crm_companies entry
    console.log("Creating crm_companies entry...");
    const [company] = await sql`
      INSERT INTO crm_companies (name, city)
      VALUES (${customerName}, 'Barranquilla')
      RETURNING id
    `;
    const companyId = company.id;

    // 4. Create crm_customers entry
    console.log("Creating customer entry...");
    const [customer] = await sql`
      INSERT INTO crm_customers (name, nit, status, ltv, recurrence_index)
      VALUES (${customerName}, '901.456.789-2', 'activo', 45000000, 85)
      RETURNING id
    `;
    const customerId = customer.id;
    console.log("Customer entry established with ID:", customerId);

    // 5. Create crm_customer_contacts entry and link userId
    console.log("Creating contact entry and linking to user ID...");
    await sql`
      INSERT INTO crm_customer_contacts (customer_id, full_name, cargo, phone, email, user_id)
      VALUES (${customerId}, ${fullName}, 'Director de Mantenimiento', '+573009998888', ${email}, ${userId})
    `;

    // 6. Create crm_customer_plants entry
    console.log("Creating plant entry...");
    const [plant] = await sql`
      INSERT INTO crm_customer_plants (customer_id, name, city, address, airflow_cfm)
      VALUES (${customerId}, 'Planta Norte - Barranquilla', 'Barranquilla', 'Parque Industrial Malambo Bodega 14', 125000)
      RETURNING id
    `;
    const plantId = plant.id;

    // 7. Create lead/project
    console.log("Creating lead/project...");
    const [lead] = await sql`
      INSERT INTO leads (full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, source, lead_score, company_id)
      VALUES (${fullName}, ${customerName}, ${email}, '+573009998888', 'Barranquilla', 'mantenimiento', 'Industrial', 'media', 'diagnostico', 'portal_cliente', 60, ${companyId})
      RETURNING id
    `;
    const leadId = lead.id;

    // 8. Create proposal
    console.log("Creating proposal...");
    await sql`
      INSERT INTO crm_proposals (lead_id, title, version, total_value, currency, status, valid_until)
      VALUES (${leadId}, 'Mantenimiento Preventivo Extractores Axiales V1', 1, 15000000, 'COP', 'aceptada', '2026-12-31')
    `;

    // 9. Create document
    console.log("Creating document...");
    await sql`
      INSERT INTO crm_documents (lead_id, file_name, file_url, file_type, customer_id)
      VALUES (${leadId}, 'Plano_Rediseño_Ventilacion_Norte.pdf', '/documents/Plano_Rediseño_Ventilacion_Norte.pdf', 'PDF', ${customerId})
    `;

    // 10. Create service request
    console.log("Creating service request...");
    await sql`
      INSERT INTO crm_service_requests (customer_id, plant_id, title, description, urgency, status, created_by)
      VALUES (${customerId}, ${plantId}, 'Calibración de Flujo Extractor Principal', 'El extractor principal presenta vibraciones y reducción de flujo. Se requiere balanceo dinámico y calibración de álabes.', 'alta', 'abierta', ${userId})
    `;

    console.log("\nSetup completed successfully!");
    console.log("==================================================");
    console.log("🔑 B2B Customer Portal Test Access");
    console.log("Email:      " + email);
    console.log("Password:   " + password);
    console.log("Role:       cliente");
    console.log("Route:      /portal/inicio");
    console.log("==================================================");

  } catch (err) {
    console.error("Error setting up test client:", err);
  } finally {
    await sql.end();
  }
}

run();
