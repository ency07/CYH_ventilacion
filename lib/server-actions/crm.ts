"use server";

import { db } from "@/lib/db";
import { leads, crmPipeline, crmActivityLogs, crmCompanies, crmContacts, crmTasks, crmOpportunities, crmProposals, diagnosticReports } from "@/lib/db/schema";
import { PipelineInsertSchema, ActivityLogInsertSchema } from "@/lib/validations/crm.schema";
import { eq, desc, ne, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPipelineEntryAction(rawInput: any): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

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
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const validated = ActivityLogInsertSchema.parse(rawInput);

    const [newLog] = await db.insert(crmActivityLogs).values({
      leadId: validated.leadId,
      activityType: validated.activityType,
      description: validated.description,
      userId: user.id,
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
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Stage enum validation check
    const validStages = ["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"];
    if (!validStages.includes(newStage)) {
      return { success: false, error: "Etapa comercial inválida." };
    }

    // Wrap everything in a database transaction to guarantee full atomic operations!
    const result = await db.transaction(async (tx) => {
      // 1. Update status in leads table
      const [updatedLead] = await tx.update(leads)
        .set({ status: newStage, updatedAt: new Date(), updatedBy: user.id })
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
        userId: user.id,
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
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const [entry] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
    return { success: true, data: entry || null };
  } catch (error: any) {
    console.error(`Error fetching pipeline for lead ${leadId}:`, error);
    return { success: false, error: error.message || "Error al buscar el pipeline." };
  }
}

export async function getActivityLogsByLeadIdAction(leadId: string): Promise<ActionResult<any[]>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

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
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
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

export async function createOpportunityAction(data: {
  leadId: string;
  diagnosticId?: string | null;
  serviceType: string;
  title: string;
  estimatedValue: number;
  probability: number;
  stage: string;
  assignedTo?: string;
}): Promise<ActionResult<any>> {
  try {
    const [newOpp] = await db.insert(crmOpportunities).values({
      leadId: data.leadId,
      diagnosticId: data.diagnosticId || null,
      serviceType: data.serviceType,
      title: data.title,
      estimatedValue: data.estimatedValue,
      probability: data.probability,
      weightedValue: Math.round((data.estimatedValue * data.probability) / 100),
      stage: data.stage,
      assignedTo: data.assignedTo || "Admin",
    }).returning();

    revalidatePath("/crm");
    revalidatePath("/crm/oportunidades");
    revalidatePath(`/crm/${data.leadId}`);
    return { success: true, data: newOpp };
  } catch (error: any) {
    console.error("Error in createOpportunityAction:", error);
    return { success: false, error: error.message };
  }
}

export async function createProposalAction(data: {
  leadId: string;
  diagnosticId?: string | null;
  title: string;
  totalValue: number;
  pdfUrl?: string | null;
  status?: string;
}): Promise<ActionResult<any>> {
  try {
    const [newProp] = await db.insert(crmProposals).values({
      leadId: data.leadId,
      diagnosticId: data.diagnosticId || null,
      title: data.title,
      totalValue: data.totalValue,
      currency: "COP",
      status: data.status || "borrador",
      pdfUrl: data.pdfUrl || null,
    }).returning();

    revalidatePath("/crm");
    revalidatePath("/crm/propuestas");
    revalidatePath(`/crm/${data.leadId}`);
    return { success: true, data: newProp };
  } catch (error: any) {
    console.error("Error in createProposalAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getReportsMetricsAction(): Promise<ActionResult<any>> {
  try {
    const [allLeads, allDiagnostics, allProposals, allOpportunities] = await Promise.all([
      db.select().from(leads),
      db.select().from(diagnosticReports),
      db.select().from(crmProposals),
      db.select().from(crmOpportunities),
    ]);

    const totalLeads = allLeads.length;
    const diagnosticsCount = allDiagnostics.length;
    const proposalsCount = allProposals.length;

    // Conversion rate: Diagnostics to proposals
    const conversionRate = diagnosticsCount > 0 
      ? parseFloat(((proposalsCount / diagnosticsCount) * 100).toFixed(1)) 
      : 0;

    // Average close time (Won/lost leads)
    const closedLeads = allLeads.filter(l => l.status === "ganado" || l.status === "perdido");
    let averageCloseDays = 42; // default standard fallback
    if (closedLeads.length > 0) {
      const totalDays = closedLeads.reduce((acc, l) => {
        const diff = new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime();
        return acc + (diff / (1000 * 60 * 60 * 24));
      }, 0);
      averageCloseDays = Math.max(1, Math.round(totalDays / closedLeads.length));
    }

    // Win rate
    const wonLeads = allLeads.filter(l => l.status === "ganado").length;
    const lostLeads = allLeads.filter(l => l.status === "perdido").length;
    const winRate = (wonLeads + lostLeads) > 0 
      ? parseFloat(((wonLeads / (wonLeads + lostLeads)) * 100).toFixed(1)) 
      : 0;

    // Sales volume: total value of active/won opportunities
    const salesVolume = allOpportunities
      .filter(opp => opp.stage !== "cerrado_perdido")
      .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

    // Group sales volume or opportunities by service type (desgloseData)
    const serviceTypeMap: Record<string, number> = {
      fabricacion: 0,
      venta: 0,
      mantenimiento: 0,
      reparacion: 0,
    };
    allOpportunities.forEach(opp => {
      const type = opp.serviceType || "venta";
      if (serviceTypeMap[type] !== undefined) {
        serviceTypeMap[type] += opp.estimatedValue;
      }
    });

    const desgloseData = [
      { sector: "Fabricación Especial", value: parseFloat((serviceTypeMap.fabricacion / 1000000).toFixed(1)) || 0, max: 100, color: "#0b1c30" },
      { sector: "Venta Directa", value: parseFloat((serviceTypeMap.venta / 1000000).toFixed(1)) || 0, max: 100, color: "#d3e4fe" },
      { sector: "Mantenimiento Preventivo", value: parseFloat((serviceTypeMap.mantenimiento / 1000000).toFixed(1)) || 0, max: 100, color: "#8a9eb8" },
      { sector: "Reparación / Overhaul", value: parseFloat((serviceTypeMap.reparacion / 1000000).toFixed(1)) || 0, max: 100, color: "#4f6580" },
    ];

    // Grouping by months for tendenciaData (defaulting to last 6 months)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthlyData: Record<string, { name: string; fabricacion: number; mantenimiento: number }> = {};
    
    // Seed last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthlyData[mName] = { name: mName, fabricacion: 0, mantenimiento: 0 };
    }

    allOpportunities.forEach(opp => {
      const date = new Date(opp.createdAt);
      const mName = months[date.getMonth()];
      if (monthlyData[mName]) {
        if (opp.serviceType === "fabricacion" || opp.serviceType === "venta") {
          monthlyData[mName].fabricacion += parseFloat((opp.estimatedValue / 1000000).toFixed(2));
        } else {
          monthlyData[mName].mantenimiento += parseFloat((opp.estimatedValue / 1000000).toFixed(2));
        }
      }
    });

    const tendenciaData = Object.values(monthlyData);

    // Engineer/sales agent metrics (ingenieroData)
    const engineerMap: Record<string, { diag: number; cerrados: number }> = {
      "Admin": { diag: 0, cerrados: 0 },
      "Javier Paz": { diag: 0, cerrados: 0 },
      "Ana Gómez": { diag: 0, cerrados: 0 },
    };

    allLeads.forEach(l => {
      const assigned = l.fullName.includes("Carlos") ? "Ana Gómez" : l.fullName.includes("Argos") ? "Javier Paz" : "Admin";
      if (!engineerMap[assigned]) {
        engineerMap[assigned] = { diag: 0, cerrados: 0 };
      }
      if (l.status === "diagnostico" || l.status === "ganado") {
        engineerMap[assigned].diag += 1;
      }
      if (l.status === "ganado") {
        engineerMap[assigned].cerrados += 1;
      }
    });

    const ingenieroData = Object.entries(engineerMap).map(([name, stats]) => {
      const rateVal = stats.diag > 0 ? (stats.cerrados / stats.diag) * 100 : 0;
      return {
        name,
        iniciales: name.split(" ").map(n => n[0]).join(""),
        diag: stats.diag,
        cerrados: stats.cerrados,
        tasa: `${rateVal.toFixed(1)}%`,
        chartVal: Math.round(rateVal),
      };
    });

    return {
      success: true,
      data: {
        totalLeads,
        conversionRate,
        averageCloseDays,
        salesVolume,
        winRate,
        desgloseData,
        tendenciaData,
        ingenieroData,
      }
    };
  } catch (error: any) {
    console.error("Error in getReportsMetricsAction:", error);
    return { success: false, error: error.message };
  }
}

