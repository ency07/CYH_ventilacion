"use server";

import { db } from "@/lib/db";
import { leads, crmPipeline, crmActivityLogs, crmCompanies, crmContacts, crmTasks } from "@/lib/db/schema";
import { PipelineInsertSchema, ActivityLogInsertSchema } from "@/lib/validations/crm.schema";
import { eq, desc, ne, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPipelineEntryAction(rawInput: any): Promise<ActionResult<any>> {
  try {
    const validated = PipelineInsertSchema.parse(rawInput);

    const [newEntry] = await db.insert(crmPipeline).values({
      leadId: validated.leadId,
      stage: validated.stage,
      priority: validated.priority,
      assignedTo: validated.assignedTo,
      probability: validated.probability,
      lossReason: validated.lossReason,
      pdfSent: validated.pdfSent,
      pdfSentAt: validated.pdfSentAt ? new Date(validated.pdfSentAt) : null,
      nextFollowUp: validated.nextFollowUp ? new Date(validated.nextFollowUp) : null,
      nextMeeting: validated.nextMeeting ? new Date(validated.nextMeeting) : null,
      nextTask: validated.nextTask,
    }).returning();

    revalidatePath("/crm");
    return { success: true, data: newEntry };
  } catch (error: any) {
    console.error("Error creating pipeline entry:", error);
    return { success: false, error: error.message || "Error al crear la entrada del pipeline." };
  }
}

export async function createActivityLogAction(rawInput: any): Promise<ActionResult<any>> {
  try {
    const validated = ActivityLogInsertSchema.parse(rawInput);

    const [newLog] = await db.insert(crmActivityLogs).values({
      leadId: validated.leadId,
      activityType: validated.activityType,
      description: validated.description,
    }).returning();

    revalidatePath("/crm");
    revalidatePath(`/crm/${validated.leadId}`);
    return { success: true, data: newLog };
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return { success: false, error: error.message || "Error al registrar la actividad comercial." };
  }
}

export async function updateLeadStatusAction(leadId: string, newStage: any): Promise<ActionResult<any>> {
  try {
    // Stage enum validation check
    const validStages = ["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"];
    if (!validStages.includes(newStage)) {
      return { success: false, error: "Etapa comercial inválida." };
    }

    // Wrap everything in a database transaction to guarantee full atomic operations!
    const result = await db.transaction(async (tx) => {
      // 1. Update status in leads table
      const [updatedLead] = await tx.update(leads)
        .set({ status: newStage, updatedAt: new Date() })
        .where(eq(leads.id, leadId))
        .returning();

      if (!updatedLead) {
        throw new Error("No se pudo encontrar o actualizar el lead.");
      }

      // 2. Update stage in crm_pipeline table (or create if not present)
      const [existingPipeline] = await tx.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
      
      if (existingPipeline) {
        await tx.update(crmPipeline)
          .set({ stage: newStage, updatedAt: new Date() })
          .where(eq(crmPipeline.leadId, leadId));
      } else {
        await tx.insert(crmPipeline).values({
          leadId,
          stage: newStage,
          priority: updatedLead.urgencyLevel === "alta" ? "alta" : "media",
        });
      }

      // 3. Register activity log
      await tx.insert(crmActivityLogs).values({
        leadId,
        activityType: "status_changed",
        description: `Etapa comercial modificada a: ${newStage.toUpperCase()}`,
      });

      return updatedLead;
    });

    revalidatePath("/crm");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return { success: false, error: error.message || "Error al actualizar la etapa comercial." };
  }
}

export async function getPipelineByLeadIdAction(leadId: string): Promise<ActionResult<any>> {
  try {
    const [entry] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
    return { success: true, data: entry || null };
  } catch (error: any) {
    console.error(`Error fetching pipeline for lead ${leadId}:`, error);
    return { success: false, error: error.message || "Error al buscar el pipeline." };
  }
}

export async function getActivityLogsByLeadIdAction(leadId: string): Promise<ActionResult<any[]>> {
  try {
    const logs = await db.select().from(crmActivityLogs)
      .where(eq(crmActivityLogs.leadId, leadId))
      .orderBy(desc(crmActivityLogs.createdAt));
    return { success: true, data: logs };
  } catch (error: any) {
    console.error(`Error fetching activity logs for lead ${leadId}:`, error);
    return { success: false, error: error.message || "Error al buscar historial de actividades." };
  }
}

export async function getAllLeadsWithCrmDataAction(): Promise<ActionResult<any[]>> {
  try {
    const allLeads = await db.select({
      lead: {
        id: leads.id,
        fullName: leads.fullName,
        companyName: leads.companyName,
        city: leads.city,
        serviceType: leads.serviceType,
        status: leads.status,
        estimatedBudgetMax: leads.estimatedBudgetMax,
        riskLevel: leads.riskLevel,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      },
      pipeline: {
        id: crmPipeline.id,
        assignedTo: crmPipeline.assignedTo,
        stage: crmPipeline.stage,
        probability: crmPipeline.probability
      }
    })
    .from(leads)
    .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId))
    .orderBy(desc(leads.createdAt));

    // Map into a single flat object for the frontend
    const mapped = allLeads.map(({ lead, pipeline }) => ({
      ...lead,
      ...pipeline, // This merges status, probability, assignedTo, etc.
      id: lead.id, // Ensure ID is lead ID
      pipelineId: pipeline?.id,
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("Error fetching all leads with CRM data:", error);
    return { success: false, error: error.message || "Error al listar oportunidades comerciales." };
  }
}

export async function updateCommercialDataAction(
  leadId: string, 
  assignedTo: string, 
  probability: number,
  nextMeeting?: string | null,
  nextTask?: string | null
): Promise<ActionResult<any>> {
  try {
    const updated = await db.update(crmPipeline)
      .set({ 
        assignedTo, 
        probability,
        nextMeeting: nextMeeting ? new Date(nextMeeting) : null,
        nextTask,
        updatedAt: new Date()
      })
      .where(eq(crmPipeline.leadId, leadId))
      .returning();
    
    revalidatePath("/crm");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: updated[0] };
  } catch (error: any) {
    console.error("Error updating commercial data:", error);
    return { success: false, error: error.message || "Error al actualizar datos comerciales." };
  }
}

export async function getDashboardMetricsAction(): Promise<ActionResult<any>> {
  try {
    const [allLeads, recentLogs] = await Promise.all([
      db.select({
        id: leads.id,
        status: leads.status,
        urgencyLevel: leads.urgencyLevel,
        estimatedBudgetMax: leads.estimatedBudgetMax,
        severityScore: leads.severityScore,
        serviceType: leads.serviceType
      }).from(leads),
      db.select({
        id: crmActivityLogs.id,
        activityType: crmActivityLogs.activityType,
        description: crmActivityLogs.description,
        createdAt: crmActivityLogs.createdAt,
        leadId: crmActivityLogs.leadId,
        leadName: leads.fullName,
        leadCompany: leads.companyName
      })
      .from(crmActivityLogs)
      .innerJoin(leads, eq(crmActivityLogs.leadId, leads.id))
      .orderBy(desc(crmActivityLogs.createdAt))
      .limit(10)
    ]);
    
    const totalLeads = allLeads.length;
    
    // Opportunities currently open (not won or lost)
    const openOpportunities = allLeads.filter(l => l.status !== "ganado" && l.status !== "perdido").length;
    
    // Critical active urgencies
    const criticalUrgencies = allLeads.filter(l => 
      (l.urgencyLevel === "alta" || l.urgencyLevel === "critica") && 
      l.status !== "ganado" && 
      l.status !== "perdido"
    ).length;

    // Projected revenue (Sum of estimatedBudgetMax for open and won opportunities)
    const projectedRevenue = allLeads
      .filter(l => l.status !== "perdido")
      .reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0);

    // 1. Funnel data: count per commercial stage
    const stages = ["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"];
    const funnelData = stages.map(stage => {
      const stageLeads = allLeads.filter(l => l.status === stage);
      const count = stageLeads.length;
      const revenue = stageLeads.reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0);
      return {
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count,
        revenue
      };
    });

    // 2. Urgency distribution data
    const urgencies = ["baja", "media", "alta", "critica"];
    const urgencyData = urgencies.map(level => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count: allLeads.filter(l => l.urgencyLevel === level).length
    }));

    // 3. Severity & Complexity distribution
    const severityData = [
      { level: "Baja", count: allLeads.filter(l => (l.severityScore || 0) < 40).length },
      { level: "Media", count: allLeads.filter(l => (l.severityScore || 0) >= 40 && (l.severityScore || 0) < 75).length },
      { level: "Crítica", count: allLeads.filter(l => (l.severityScore || 0) >= 75).length }
    ];

    // 4. Services demand projection
    const services = ["fabricacion", "venta", "mantenimiento", "reparacion"];
    const servicesData = services.map(srv => ({
      service: srv.charAt(0).toUpperCase() + srv.slice(1),
      count: allLeads.filter(l => l.serviceType === srv).length,
      revenue: allLeads.filter(l => l.serviceType === srv).reduce((sum, l) => sum + (l.estimatedBudgetMax || 0), 0)
    }));

    // 5. Los activity logs ya fueron extraídos en paralelo al inicio

    return {
      success: true,
      data: {
        totalLeads,
        openOpportunities,
        criticalUrgencies,
        projectedRevenue,
        funnelData,
        urgencyData,
        severityData,
        servicesData,
        recentLogs
      }
    };
  } catch (error: any) {
    console.error("Error computing dashboard metrics:", error);
    return { success: false, error: error.message || "Error al calcular métricas de telemetría." };
  }
}

export async function createCompanyAction(data: { name: string; industry?: string; city?: string; website?: string }): Promise<ActionResult<any>> {
  try {
    const [newCompany] = await db.insert(crmCompanies).values({
      name: data.name,
      industry: data.industry,
      city: data.city,
      website: data.website,
    }).returning();
    revalidatePath("/crm/clientes");
    return { success: true, data: newCompany };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContactAction(data: { companyId: string; fullName: string; cargo?: string; email?: string; phone?: string }): Promise<ActionResult<any>> {
  try {
    const [newContact] = await db.insert(crmContacts).values({
      companyId: data.companyId,
      fullName: data.fullName,
      cargo: data.cargo,
      email: data.email,
      phone: data.phone,
    }).returning();
    revalidatePath("/crm/clientes");
    return { success: true, data: newContact };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTaskAction(data: { leadId: string; taskType: string; dueDate: string; assignedTo?: string; notes?: string }): Promise<ActionResult<any>> {
  try {
    const [newTask] = await db.insert(crmTasks).values({
      leadId: data.leadId,
      taskType: data.taskType,
      dueDate: new Date(data.dueDate),
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: 'pendiente'
    }).returning();
    
    // Also create an activity log for the new task
    await db.insert(crmActivityLogs).values({
      leadId: data.leadId,
      activityType: 'task_created',
      description: 'Nueva tarea programada: ' + data.taskType,
    });

    revalidatePath('/crm');
    revalidatePath('/crm/' + data.leadId);
    return { success: true, data: newTask };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
