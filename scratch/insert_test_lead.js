import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("Starting lead injection...");

  try {
    // 1. Insert Company
    const [company] = await sql`
      INSERT INTO "crm_companies" ("name", "industry", "city")
      VALUES ('EMPRESA TRAZABILIDAD 2026', 'Ventilación Industrial', 'Barranquilla')
      RETURNING "id";
    `;
    console.log(`Company ID: ${company.id}`);

    // 2. Insert Contact
    const [contact] = await sql`
      INSERT INTO "crm_contacts" ("company_id", "full_name", "cargo", "email", "phone")
      VALUES (${company.id}, 'TEST TRAZABILIDAD CYH', 'Gerente de Proyectos', 'trazabilidad@cyh-test.com', '3000000000')
      RETURNING "id";
    `;
    console.log(`Contact ID: ${contact.id}`);

    // 3. Insert Lead
    const [lead] = await sql`
      INSERT INTO "leads" (
        "full_name", "company_name", "email", "phone", "cargo", "city", 
        "service_type", "environment_type", "urgency_level", "status", "source",
        "estimated_budget_min", "estimated_budget_max", "company_id", "contact_id",
        "complexity_score", "severity_score", "notes", "is_verified", "risk_level"
      )
      VALUES (
        'TEST TRAZABILIDAD CYH', 'EMPRESA TRAZABILIDAD 2026', 'trazabilidad@cyh-test.com', '3000000000', 
        'Gerente de Proyectos', 'Barranquilla', 'fabricacion', 'warehouse', 'alta', 'nuevo', 'wizard',
        2500000, 5000000, ${company.id}, ${contact.id},
        45, 80, 'PRUEBA FORENSE DE TRAZABILIDAD', true, 'HOT'
      )
      RETURNING "id";
    `;
    console.log(`Lead ID: ${lead.id}`);

    // 4. Insert Diagnostic Report
    const [diag] = await sql`
      INSERT INTO "diagnostic_reports" (
        "lead_id", "airflow", "dimensions", "technical_observations", 
        "material_suggestions", "inspection_protocol", "recommendations", "currency", "status"
      )
      VALUES (
        ${lead.id}, 3500, '{"length": 20, "width": 15, "height": 6}', 
        'Cálculo de caudal y preingeniería para renovación de aire en nave industrial.',
        'Acero galvanizado pesado con recubrimiento epóxico.',
        'Prueba de presión y verificación de flujo bajo norma ASHRAE.',
        'Instalar extractor centrífugo de alto rendimiento.', 'COP', 'pendiente'
      )
      RETURNING "id";
    `;
    console.log(`Diagnostic ID: ${diag.id}`);

    // 5. Insert Opportunity
    const [opp] = await sql`
      INSERT INTO "crm_opportunities" (
        "lead_id", "diagnostic_id", "service_type", "title", 
        "estimated_value", "probability", "weighted_value", "stage", "assigned_to"
      )
      VALUES (
        ${lead.id}, ${diag.id}, 'fabricacion', 'Proyecto EMPRESA TRAZABILIDAD 2026 - FABRICACIÓN',
        5000000, 20, 1000000, 'analisis', 'Admin'
      )
      RETURNING "id";
    `;
    console.log(`Opportunity ID: ${opp.id}`);

    // 6. Insert Proposal
    const [proposal] = await sql`
      INSERT INTO "crm_proposals" (
        "lead_id", "diagnostic_id", "title", "total_value", "currency", "status", "pdf_url"
      )
      VALUES (
        ${lead.id}, ${diag.id}, 'Propuesta Comercial Inicial - EMPRESA TRAZABILIDAD 2026',
        5000000, 'COP', 'borrador', 'https://aws-1-sa-east-1.supabase.co/storage/v1/object/public/pdfs/reports/' || ${lead.id} || '.pdf'
      )
      RETURNING "id";
    `;
    console.log(`Proposal ID: ${proposal.id}`);

    // 7. Insert Pipeline Entry
    const [pipeline] = await sql`
      INSERT INTO "crm_pipeline" ("lead_id", "stage", "priority", "assigned_to", "probability")
      VALUES (${lead.id}, 'nuevo', 'alta', 'Admin', 20)
      RETURNING "id";
    `;
    console.log(`Pipeline ID: ${pipeline.id}`);

    // 8. Insert Activity Log
    const [activity] = await sql`
      INSERT INTO "crm_activity_logs" ("lead_id", "activity_type", "description")
      VALUES (${lead.id}, 'lead_created', 'Lead comercial registrado y auto-verificado con éxito.')
      RETURNING "id";
    `;
    console.log(`Activity ID: ${activity.id}`);

  } catch (err) {
    console.error("Injection failed:", err);
  } finally {
    await sql.end();
  }
}

main();
