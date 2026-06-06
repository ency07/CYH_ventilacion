import postgres from "postgres";

const url = "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  const sql = postgres(url);
  console.log("Inserting tasks, meetings, and alert triggers for forensic lead...");

  const leadId = "443e08fa-c25e-4b2a-b9ae-22248d5c5f53";

  try {
    // 1. Insert a pending normal task that is overdue to trigger a "Tarea Vencida" alert
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // 2 days ago

    const [task] = await sql`
      INSERT INTO "crm_tasks" ("lead_id", "task_type", "status", "due_date", "assigned_to", "notes", "priority")
      VALUES (${leadId}, 'llamada', 'pendiente', ${pastDate}, 'Admin', 'Llamar a cliente para coordinar visita técnica', 'alta')
      RETURNING "id";
    `;
    console.log(`Task (Overdue Call) ID: ${task.id}`);

    // 2. Insert a future meeting/reunion task
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // 3 days from now

    const [meeting] = await sql`
      INSERT INTO "crm_tasks" ("lead_id", "task_type", "status", "due_date", "assigned_to", "notes", "priority")
      VALUES (${leadId}, 'reunion', 'pendiente', ${futureDate}, 'Admin', 'Reunión de presentación de propuesta técnica y comercial', 'normal')
      RETURNING "id";
    `;
    console.log(`Meeting Task ID: ${meeting.id}`);

    // 3. Insert an activity log for scheduling the meeting
    const [act] = await sql`
      INSERT INTO "crm_activity_logs" ("lead_id", "activity_type", "description")
      VALUES (${leadId}, 'meeting_scheduled', 'Reunión de presentación programada para dentro de 3 días.')
      RETURNING "id";
    `;
    console.log(`New Activity ID: ${act.id}`);

  } catch (err) {
    console.error("Insertion failed:", err);
  } finally {
    await sql.end();
  }
}

main();
