import { db } from "../lib/db/index";
import { crmPipeline, crmTasks, crmOpportunities } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== INICIANDO MIGRACIÓN DE ASESORES EN BASE DE DATOS ===");

  // 1. Mapeo de crm_pipeline
  const pipelines = await db.select().from(crmPipeline);
  console.log(`Pipelines totales: ${pipelines.length}`);
  
  let updatedPipelinesCount = 0;
  for (const p of pipelines) {
    let newAssignee = p.assignedTo;
    if (p.assignedTo === "Andres G") {
      newAssignee = "comercial@cyh.com";
    } else if (p.assignedTo === "Admin") {
      newAssignee = "admin@cyh.com";
    }
    
    if (newAssignee !== p.assignedTo) {
      await db.update(crmPipeline)
        .set({ assignedTo: newAssignee, updatedAt: new Date() })
        .where(eq(crmPipeline.id, p.id));
      updatedPipelinesCount++;
      console.log(`Pipeline ${p.id} actualizado: '${p.assignedTo}' -> '${newAssignee}'`);
    }
  }

  // 2. Mapeo de crm_tasks
  const tasks = await db.select().from(crmTasks);
  console.log(`Tareas totales: ${tasks.length}`);
  
  let updatedTasksCount = 0;
  for (const t of tasks) {
    let newAssignee = t.assignedTo;
    if (t.assignedTo === "Admin") {
      newAssignee = "admin@cyh.com";
    } else if (t.assignedTo === "Andres G") {
      newAssignee = "comercial@cyh.com";
    }

    if (newAssignee !== t.assignedTo) {
      await db.update(crmTasks)
        .set({ assignedTo: newAssignee, updatedAt: new Date() })
        .where(eq(crmTasks.id, t.id));
      updatedTasksCount++;
      console.log(`Tarea ${t.id} actualizada: '${t.assignedTo}' -> '${newAssignee}'`);
    }
  }

  // 3. Mapeo de crm_opportunities
  const opps = await db.select().from(crmOpportunities);
  console.log(`Oportunidades totales: ${opps.length}`);

  let updatedOppsCount = 0;
  for (const o of opps) {
    let newAssignee = o.assignedTo;
    if (o.assignedTo === "Admin") {
      newAssignee = "admin@cyh.com";
    } else if (o.assignedTo === "Andres G") {
      newAssignee = "comercial@cyh.com";
    }

    if (newAssignee !== o.assignedTo) {
      await db.update(crmOpportunities)
        .set({ assignedTo: newAssignee, updatedAt: new Date() })
        .where(eq(crmOpportunities.id, o.id));
      updatedOppsCount++;
      console.log(`Oportunidad ${o.id} actualizada: '${o.assignedTo}' -> '${newAssignee}'`);
    }
  }

  console.log("=== MIGRACIÓN DE ASESORES FINALIZADA CON ÉXITO ===");
  console.log(`Pipelines modificados: ${updatedPipelinesCount}`);
  console.log(`Tareas modificadas: ${updatedTasksCount}`);
  console.log(`Oportunidades modificadas: ${updatedOppsCount}`);
}

main();
