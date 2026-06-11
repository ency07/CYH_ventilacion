"use server";

import { db } from "@/lib/db";
import { leads, crmPipeline, crmActivityLogs, crmCompanies, crmContacts, crmTasks, crmOpportunities, crmProposals, diagnosticReports, crmUsers, crmCustomers, crmCustomerPlants, crmCustomerContacts } from "@/lib/db/schema";
import { PipelineInsertSchema, ActivityLogInsertSchema } from "@/lib/validations/crm.schema";
import { eq, desc, ne, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { normalizeCity } from "@/lib/utils/normalization";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPipelineEntryAction(rawInput: any): Promise<ActionResult<typeof crmPipeline.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

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

function sanitizeActivityType(input: string): typeof crmActivityLogs.$inferInsert['activityType'] {
  const normalized = input.trim().toLowerCase();
  
  if (["correo", "email", "mail", "correo electrónico", "correo electronico"].includes(normalized)) {
    return "email" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["llamada", "call", "telefono", "teléfono", "wsp", "whatsapp"].includes(normalized)) {
    return "call" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["reunion", "reunión", "meeting", "cita", "mesa_reunion", "mesa reunion"].includes(normalized)) {
    return "meeting" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["visita", "visit", "inspeccion", "inspección"].includes(normalized)) {
    return "visit" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["estado", "status", "cambio_estado", "cambio estado"].includes(normalized)) {
    return "status_changed" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["lead_created", "lead creado", "lead-created"].includes(normalized)) {
    return "lead_created" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["report_generated", "reporte generado", "report-generated"].includes(normalized)) {
    return "report_generated" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["proposal", "propuesta", "cotizacion", "cotización"].includes(normalized)) {
    return "proposal" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  if (["technical", "tecnico", "técnico", "seguimiento tecnico", "seguimiento técnico"].includes(normalized)) {
    return "technical" as typeof crmActivityLogs.$inferInsert['activityType'];
  }
  
  return "call" as typeof crmActivityLogs.$inferInsert['activityType']; // Fallback defensivo
}

export async function createActivityLogAction(rawInput: any): Promise<ActionResult<typeof crmActivityLogs.$inferSelect>> {
  try {
    const dbUser = await requireRole(["admin", "comercial", "director_comercial"]);

    // Clean and sanitize activity type before parsing
    const rawActivityType = typeof rawInput === "object" && rawInput !== null ? String(rawInput.activityType || "") : "";
    const sanitizedType = sanitizeActivityType(rawActivityType);

    const validated = ActivityLogInsertSchema.parse({
      ...rawInput,
      activityType: sanitizedType
    });

    const [newLog] = await db.insert(crmActivityLogs).values({
      leadId: validated.leadId,
      activityType: validated.activityType,
      description: validated.description,
      userId: dbUser.id,
    }).returning();

    // Atomic cascade revalidation
    revalidatePath("/crm");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/pipeline");
    revalidatePath(`/crm/${validated.leadId}`);
    
    return { success: true, data: newLog };
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return { success: false, error: error.message || "Error al registrar la actividad comercial." };
  }
}

export async function updateLeadStatusAction(leadId: string, newStage: any): Promise<ActionResult<any>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);
    const userRole = dbUser.role;
    const userEmail = dbUser.email || "";

    // Stage enum validation check
    const validStages = ["nuevo", "contacto", "reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado", "perdido"];
    if (!validStages.includes(newStage)) {
      return { success: false, error: "Etapa comercial inválida." };
    }

    // Ownership check for commercial users
    if (userRole === "vendedor" || userRole === "comercial") {
      const [existingPipe] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
      if (existingPipe && existingPipe.assignedTo && existingPipe.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
        return { success: false, error: "Acceso denegado: No tiene permisos para modificar este lead." };
      }
    }

    // Wrap everything in a database transaction to guarantee full atomic operations!
    const result = await db.transaction(async (tx) => {
      // 1. Lock lead row to prevent concurrent updates to the same lead
      const [updatedLead] = await tx.select().from(leads).where(eq(leads.id, leadId)).for("update");

      if (!updatedLead) {
        throw new Error("No se pudo encontrar o actualizar el lead.");
      }

      // If transitioning to "ganado", acquire a transaction-level advisory lock on the normalized company name hash
      if (newStage === "ganado") {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(lower(trim(${updatedLead.companyName}))))`);
      }

      // Update status in leads table
      await tx.update(leads)
        .set({ status: newStage, updatedAt: new Date(), updatedBy: dbUser.id })
        .where(eq(leads.id, leadId));

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

      // 2.5 Sincronizar crm_opportunities
      const oppStageMap: Record<string, string> = {
        "nuevo": "analisis",
        "contacto": "analisis",
        "reunion": "analisis",
        "diagnostico": "analisis",
        "propuesta_prep": "propuesta",
        "propuesta_entregada": "propuesta",
        "negociacion": "negociacion",
        "ganado": "cerrado_ganado",
        "perdido": "cerrado_perdido",
      };

      const probMap: Record<string, number> = {
        "nuevo": 10,
        "contacto": 20,
        "reunion": 30,
        "diagnostico": 40,
        "propuesta_prep": 50,
        "propuesta_entregada": 70, // 70% probability for Propuesta Enviada
        "negociacion": 80,
        "ganado": 100,
        "perdido": 0,
      };

      const targetOppStage = oppStageMap[newStage] || "analisis";
      const targetOppProb = probMap[newStage] !== undefined ? probMap[newStage] : 50;

      const [existingOpp] = await tx.select().from(crmOpportunities).where(eq(crmOpportunities.leadId, leadId));
      const estBudget = updatedLead.estimatedBudgetMax || 0;
      const weighted = Math.round((estBudget * targetOppProb) / 100);

      if (existingOpp) {
        await tx.update(crmOpportunities)
          .set({ 
            stage: targetOppStage, 
            probability: targetOppProb, 
            estimatedValue: estBudget,
            weightedValue: weighted,
            updatedAt: new Date() 
          })
          .where(eq(crmOpportunities.leadId, leadId));
      } else {
        await tx.insert(crmOpportunities).values({
          leadId,
          serviceType: updatedLead.serviceType,
          title: `Proyecto ${updatedLead.serviceType.toUpperCase()} - ${updatedLead.companyName}`,
          estimatedValue: estBudget,
          probability: targetOppProb,
          weightedValue: weighted,
          stage: targetOppStage,
          assignedTo: existingPipeline?.assignedTo || userEmail || "comercial@cyh.com",
        });
      }

      if (newStage === "ganado") {
        // Cascade 3: update crmPipeline stage to ganado
        await tx.update(crmPipeline)
          .set({ stage: "ganado", probability: 100, updatedAt: new Date() })
          .where(eq(crmPipeline.leadId, leadId));

        // Cascade 4: Create B2B Customer entry in crm_customers if not already present
        const [existingCustomer] = await tx.select().from(crmCustomers)
          .where(eq(crmCustomers.name, updatedLead.companyName))
          .limit(1);

        if (!existingCustomer) {
          const ltvVal = existingOpp ? (existingOpp.estimatedValue || 0) : estBudget;
          const [newCust] = await tx.insert(crmCustomers).values({
            name: updatedLead.companyName,
            status: "activo",
            ltv: ltvVal,
            assignedTo: existingPipeline?.assignedTo || userEmail || "comercial@cyh.com",
            recurrenceIndex: 80, // Default B2B recurrence index
          }).returning();

          // Also create a default B2B Plant
          const [newPlant] = await tx.insert(crmCustomerPlants).values({
            customerId: newCust.id,
            name: `Planta Principal - ${updatedLead.companyName}`,
            city: updatedLead.city,
            airflowCfm: 0,
          }).returning();

          // Assign plantId to latest diagnostic report if exists
          const [latestDiag] = await tx.select().from(diagnosticReports)
            .where(eq(diagnosticReports.leadId, leadId))
            .orderBy(desc(diagnosticReports.createdAt))
            .limit(1);
          if (latestDiag) {
            await tx.update(diagnosticReports)
              .set({ plantId: newPlant.id })
              .where(eq(diagnosticReports.id, latestDiag.id));
            
            // Sync airflowCFM to plant
            await tx.update(crmCustomerPlants)
              .set({ airflowCfm: latestDiag.airflow || 0 })
              .where(eq(crmCustomerPlants.id, newPlant.id));
          }

          // Create a primary contact
          await tx.insert(crmCustomerContacts).values({
            customerId: newCust.id,
            fullName: updatedLead.fullName,
            cargo: updatedLead.cargo || "Representante Técnico",
            phone: updatedLead.phone,
            email: updatedLead.email,
          });
        } else {
          // Update LTV of existing customer
          const currentLtv = existingCustomer.ltv || 0;
          const delta = existingOpp ? (existingOpp.estimatedValue || 0) : estBudget;
          await tx.update(crmCustomers)
            .set({ ltv: currentLtv + delta, updatedAt: new Date() })
            .where(eq(crmCustomers.id, existingCustomer.id));
        }
      }

      // 3. Register activity log
      await tx.insert(crmActivityLogs).values({
        leadId,
        activityType: "status_changed",
        description: `Etapa comercial modificada a: ${newStage.toUpperCase()}`,
        userId: dbUser.id,
      });

      return updatedLead;
    });

    revalidatePath("/crm");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/leads");
    revalidatePath("/crm/clientes");
    revalidatePath("/crm/pipeline");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return { success: false, error: error.message || "Error al actualizar la etapa comercial." };
  }
}

export async function updateLeadRiskLevelAction(leadId: string, newRiskLevel: string): Promise<ActionResult<any>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);
    const userRole = dbUser.role;
    const userEmail = dbUser.email || "";

    // Ownership check for commercial users
    if (userRole === "vendedor" || userRole === "comercial") {
      const [existingPipe] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
      if (existingPipe && existingPipe.assignedTo && existingPipe.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
        return { success: false, error: "Acceso denegado: No tiene permisos para modificar este lead." };
      }
    }

    const validRiskLevels = ["HOT", "WARM", "LOW", "SPAM"];
    if (!validRiskLevels.includes(newRiskLevel)) {
      return { success: false, error: "Temperatura (Riesgo) inválida." };
    }

    // Map riskLevel to an approximate leadScore if set manually
    let targetScore = 10;
    if (newRiskLevel === "HOT") targetScore = 85;
    else if (newRiskLevel === "WARM") targetScore = 55;
    else if (newRiskLevel === "LOW") targetScore = 30;

    const [updated] = await db.update(leads)
      .set({ 
        riskLevel: newRiskLevel, 
        leadScore: targetScore,
        updatedAt: new Date(), 
        updatedBy: dbUser.id 
      })
      .where(eq(leads.id, leadId))
      .returning();

    // Log the activity
    await db.insert(crmActivityLogs).values({
      leadId,
      activityType: "status_changed",
      description: `Temperatura comercial modificada a: ${newRiskLevel}`,
      userId: dbUser.id,
    });

    revalidatePath("/crm");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/leads");
    revalidatePath("/crm/pipeline");
    revalidatePath(`/crm/${leadId}`);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating lead risk level:", error);
    return { success: false, error: error.message || "Error al actualizar la temperatura." };
  }
}

export async function getPipelineByLeadIdAction(leadId: string): Promise<ActionResult<typeof crmPipeline.$inferSelect | null>> {
  try {
    await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);

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
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
    const userRole = dbUser?.role || "vendedor";
    const userEmail = dbUser?.email || user.email || "";

    let query = db.select({
      lead: {
        id: leads.id,
        fullName: leads.fullName,
        companyName: leads.companyName,
        email: leads.email,
        phone: leads.phone,
        cargo: leads.cargo,
        city: leads.city,
        serviceType: leads.serviceType,
        environmentType: leads.environmentType,
        urgencyLevel: leads.urgencyLevel,
        status: leads.status,
        source: leads.source,
        estimatedBudgetMin: leads.estimatedBudgetMin,
        estimatedBudgetMax: leads.estimatedBudgetMax,
        companyId: leads.companyId,
        contactId: leads.contactId,
        complexityScore: leads.complexityScore,
        severityScore: leads.severityScore,
        notes: leads.notes,
        leadScore: leads.leadScore,
        isVerified: leads.isVerified,
        riskLevel: leads.riskLevel,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      },
      pipeline: {
        id: crmPipeline.id,
        assignedTo: crmPipeline.assignedTo,
        stage: crmPipeline.stage,
        probability: crmPipeline.probability
      },
      opportunity: {
        id: crmOpportunities.id,
        estimatedValue: crmOpportunities.estimatedValue,
        probability: crmOpportunities.probability,
        stage: crmOpportunities.stage
      },
      diagnostic: {
        airflow: diagnosticReports.airflow
      }
    })
    .from(leads)
    .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId))
    .leftJoin(crmOpportunities, eq(leads.id, crmOpportunities.leadId))
    .leftJoin(diagnosticReports, eq(leads.id, diagnosticReports.leadId));

    // Apply strict server-side filtering for sales/vendedor roles
    if (userRole === "vendedor" || userRole === "comercial") {
      query = query.where(eq(crmPipeline.assignedTo, userEmail)) as any;
    }

    const rawResults = await query.orderBy(desc(leads.createdAt));

    // De-duplicate in memory using a Map keyed by lead ID to avoid duplicates due to left joins
    const leadMap = new Map<string, any>();
    for (const row of rawResults) {
      const existing = leadMap.get(row.lead.id);
      if (!existing) {
        leadMap.set(row.lead.id, {
          ...row.lead,
          ...row.pipeline,
          id: row.lead.id,
          pipelineId: row.pipeline?.id,
          airflow: row.diagnostic?.airflow != null ? `${row.diagnostic.airflow} CFM` : "0 CFM",
          opportunityId: row.opportunity?.id || null,
          opportunityValue: row.opportunity?.estimatedValue != null ? `$${row.opportunity.estimatedValue} COP` : "$0 COP",
          opportunityStage: row.opportunity?.stage || null,
        });
      } else {
        // If there's a diagnostic report with airflow, keep the latest one
        if (row.diagnostic?.airflow && (existing.airflow === "0 CFM" || !existing.airflow)) {
          existing.airflow = `${row.diagnostic.airflow} CFM`;
        }
      }
    }
    const mapped = Array.from(leadMap.values());

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
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);
    const userRole = dbUser.role;
    const userEmail = dbUser.email || "";

    // If commercial user, prevent modifying leads assigned to others
    if (userRole === "vendedor" || userRole === "comercial") {
      const [existingPipe] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
      if (existingPipe && existingPipe.assignedTo && existingPipe.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
        return { success: false, error: "Acceso denegado: No tiene permisos para modificar la asignación de este lead." };
      }
    }

    const updated = await db.transaction(async (tx) => {
      // 1. Update pipeline entry
      const [pipe] = await tx.update(crmPipeline)
        .set({ 
          assignedTo, 
          probability,
          nextMeeting: nextMeeting ? new Date(nextMeeting) : null,
          nextTask,
          updatedAt: new Date()
        })
        .where(eq(crmPipeline.leadId, leadId))
        .returning();

      // 2. Cascade update opportunities table assignedTo for 100% dashboard consistency
      await tx.update(crmOpportunities)
        .set({ assignedTo })
        .where(eq(crmOpportunities.leadId, leadId));

      return pipe;
    });
    
    revalidatePath("/crm");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/leads");
    revalidatePath("/crm/pipeline");
    revalidatePath(`/crm/${leadId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating commercial data:", error);
    return { success: false, error: error.message || "Error al actualizar datos comerciales." };
  }
}

export async function getDashboardMetricsAction(): Promise<ActionResult<any>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

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
      .leftJoin(leads, eq(crmActivityLogs.leadId, leads.id))
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

import { requireRole } from "@/lib/auth/permissions";

export async function createCompanyAction(data: { name: string; industry?: string; city?: string; website?: string }): Promise<ActionResult<typeof crmCompanies.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

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

export async function createContactAction(data: { companyId: string; fullName: string; cargo?: string; email?: string; phone?: string }): Promise<ActionResult<typeof crmContacts.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

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


export async function createTaskAction(data: { leadId: string; taskType: string; dueDate: string; assignedTo?: string; notes?: string }): Promise<ActionResult<typeof crmTasks.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

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
}): Promise<ActionResult<typeof crmOpportunities.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

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
}): Promise<ActionResult<typeof crmProposals.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

    const [newProp] = await db.insert(crmProposals).values({
      leadId: data.leadId,
      diagnosticId: data.diagnosticId || null,
      title: data.title,
      totalValue: data.totalValue ?? 0,
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

export async function getReportsMetricsAction(periodo?: string): Promise<ActionResult<any>> {
  try {
    await requireRole(["admin", "super_admin", "director", "director_comercial"]);

    const [allLeads, allDiagnostics, allProposals, allOpportunities] = await Promise.all([
      db.select().from(leads),
      db.select().from(diagnosticReports),
      db.select().from(crmProposals),
      db.select().from(crmOpportunities),
    ]);

    // Apply period filtering based on createdAt
    const now = new Date();
    let cutoffDate = new Date();
    if (periodo === "30dias") cutoffDate.setDate(now.getDate() - 30);
    else if (periodo === "180dias") cutoffDate.setDate(now.getDate() - 180);
    else if (periodo === "365dias") cutoffDate.setDate(now.getDate() - 365);
    else cutoffDate.setDate(now.getDate() - 90); // default 90dias

    const filteredLeads = allLeads.filter(l => new Date(l.createdAt) >= cutoffDate);
    const filteredDiagnostics = allDiagnostics.filter(d => new Date(d.createdAt) >= cutoffDate);
    const filteredProposals = allProposals.filter(p => new Date(p.createdAt) >= cutoffDate);
    const filteredOpportunities = allOpportunities.filter(o => new Date(o.createdAt) >= cutoffDate);

    const totalLeads = filteredLeads.length;
    const diagnosticsCount = filteredDiagnostics.length;
    const proposalsCount = filteredProposals.length;

    // Conversion rate: Diagnostics to proposals
    const conversionRate = diagnosticsCount > 0 
      ? parseFloat(((proposalsCount / diagnosticsCount) * 100).toFixed(1)) 
      : 0;

    // Average close time (Won/lost leads)
    const closedLeads = filteredLeads.filter(l => l.status === "ganado" || l.status === "perdido");
    let averageCloseDays = 42; // default standard fallback
    if (closedLeads.length > 0) {
      const totalDays = closedLeads.reduce((acc, l) => {
        const diff = new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime();
        return acc + (diff / (1000 * 60 * 60 * 24));
      }, 0);
      averageCloseDays = Math.max(1, Math.round(totalDays / closedLeads.length));
    }

    // Win rate
    const wonLeads = filteredLeads.filter(l => l.status === "ganado").length;
    const lostLeads = filteredLeads.filter(l => l.status === "perdido").length;
    const winRate = (wonLeads + lostLeads) > 0 
      ? parseFloat(((wonLeads / (wonLeads + lostLeads)) * 100).toFixed(1)) 
      : 0;

    // Sales volume: total value of active/won opportunities
    const salesVolume = filteredOpportunities
      .filter(opp => opp.stage !== "cerrado_perdido")
      .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

    // Group sales volume or opportunities by service type (desgloseData)
    const serviceTypeMap: Record<string, number> = {
      fabricacion: 0,
      venta: 0,
      mantenimiento: 0,
      reparacion: 0,
    };
    filteredOpportunities.forEach(opp => {
      const type = opp.serviceType || "venta";
      if (serviceTypeMap[type] !== undefined) {
        serviceTypeMap[type] += (opp.estimatedValue || 0);
      }
    });

    const maxVal = Math.max(...Object.values(serviceTypeMap), 1);

    const desgloseData = [
      { sector: "Fabricación Especial", value: serviceTypeMap.fabricacion || 0, max: maxVal, color: "#0b1c30" },
      { sector: "Venta Directa", value: serviceTypeMap.venta || 0, max: maxVal, color: "#d3e4fe" },
      { sector: "Mantenimiento Preventivo", value: serviceTypeMap.mantenimiento || 0, max: maxVal, color: "#8a9eb8" },
      { sector: "Reparación / Overhaul", value: serviceTypeMap.reparacion || 0, max: maxVal, color: "#4f6580" },
    ];

    // Grouping by months for tendenciaData (defaulting to last 6 months)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthlyData: Record<string, { name: string; abiertas: number; ganadas: number }> = {};
    
    // Seed last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthlyData[mName] = { name: mName, abiertas: 0, ganadas: 0 };
    }

    filteredOpportunities.forEach(opp => {
      const date = new Date(opp.createdAt);
      const mName = months[date.getMonth()];
      if (monthlyData[mName]) {
        // Show real value of opportunities in bidding stage ('licitacion', 'analisis', 'propuesta', 'negociacion') vs closed-won contracts ('cerrado_ganado')
        const isLicitacion = opp.stage === "analisis" || opp.stage === "propuesta" || opp.stage === "negociacion" || opp.stage === "licitacion";
        const isWon = opp.stage === "cerrado_ganado";
        const val = opp.estimatedValue || 0;
        
        if (isWon) {
          monthlyData[mName].ganadas += val;
        } else if (isLicitacion) {
          monthlyData[mName].abiertas += val;
        }
      }
    });

    const tendenciaData = Object.values(monthlyData);

    // Fetch actual users to build dynamic engineer performance report
    const dbUsers = await db.select().from(crmUsers);
    const userMap = new Map<string, string>();
    dbUsers.forEach(u => {
      userMap.set(u.id, u.fullName || u.email.split("@")[0]);
    });

    const engineerMap: Record<string, { diag: number; cerrados: number }> = {};
    dbUsers.forEach(u => {
      if (u.role === "tecnico" || u.role === "admin") {
        const name = u.fullName || u.email.split("@")[0];
        engineerMap[name] = { diag: 0, cerrados: 0 };
      }
    });

    if (Object.keys(engineerMap).length === 0) {
      engineerMap["Admin"] = { diag: 0, cerrados: 0 };
    }

    filteredDiagnostics.forEach(d => {
      const creatorName = d.createdBy ? userMap.get(d.createdBy) : null;
      const assigned = creatorName || "Admin";
      if (!engineerMap[assigned]) {
        engineerMap[assigned] = { diag: 0, cerrados: 0 };
      }
      engineerMap[assigned].diag += 1;
      
      const associatedLead = filteredLeads.find(l => l.id === d.leadId);
      if (associatedLead && associatedLead.status === "ganado") {
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

export async function updateProposalStatusAction(
  proposalId: string,
  newStatus: string
): Promise<ActionResult<any>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);
    const userRole = dbUser.role;
    const userEmail = dbUser.email || "";

    if (newStatus === "aceptada" && !["admin", "super_admin", "director_comercial", "director"].includes(userRole)) {
      return { success: false, error: "Permisos insuficientes para aprobar propuestas comerciales." };
    }

    // Vendedor restriction
    if (userRole === "vendedor" || userRole === "comercial") {
      const [proposal] = await db.select().from(crmProposals).where(eq(crmProposals.id, proposalId)).limit(1);
      if (proposal) {
        const [opp] = await db.select().from(crmOpportunities).where(eq(crmOpportunities.leadId, proposal.leadId)).limit(1);
        if (opp && opp.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
          return { success: false, error: "Acceso denegado: Esta propuesta no está asignada a su cartera." };
        }
      }
    }

    const [updated] = await db.transaction(async (tx) => {
      const [u] = await tx
        .update(crmProposals)
        .set({ 
          status: newStatus, 
          updatedAt: new Date(), 
          approvedBy: newStatus === "aceptada" ? dbUser.id : null, 
          approvedAt: newStatus === "aceptada" ? new Date() : null 
        })
        .where(eq(crmProposals.id, proposalId))
        .returning();

      if (u && newStatus === "aceptada") {
        // Cascade 1: update lead status to ganado
        await tx.update(leads)
          .set({ status: "ganado", updatedAt: new Date() })
          .where(eq(leads.id, u.leadId));

        // Cascade 2: update crmOpportunities stage to cerrado_ganado, probability to 100, and weightedValue to estimatedValue
        const [opp] = await tx.select().from(crmOpportunities).where(eq(crmOpportunities.leadId, u.leadId)).limit(1);
        if (opp) {
          await tx.update(crmOpportunities)
            .set({ 
              stage: "cerrado_ganado", 
              probability: 100, 
              weightedValue: opp.estimatedValue,
              updatedAt: new Date()
            })
            .where(eq(crmOpportunities.id, opp.id));
        }

        // Cascade 3: update crmPipeline stage to ganado
        await tx.update(crmPipeline)
          .set({ stage: "ganado", probability: 100, updatedAt: new Date() })
          .where(eq(crmPipeline.leadId, u.leadId));

        // Cascade 4: Create B2B Customer entry in crm_customers if not already present
        const [leadRecord] = await tx.select().from(leads).where(eq(leads.id, u.leadId)).limit(1);
        if (leadRecord) {
          const [existingCustomer] = await tx.select().from(crmCustomers)
            .where(eq(crmCustomers.name, leadRecord.companyName))
            .limit(1);

          if (!existingCustomer) {
            const [newCust] = await tx.insert(crmCustomers).values({
              name: leadRecord.companyName,
              status: "activo",
              ltv: u.totalValue || 0,
              assignedTo: leadRecord.email || "comercial@cyh.com",
              recurrenceIndex: 85,
            }).returning();

            // Also create a default B2B Plant
            const [newPlant] = await tx.insert(crmCustomerPlants).values({
              customerId: newCust.id,
              name: `Planta Principal - ${leadRecord.companyName}`,
              city: leadRecord.city,
              airflowCfm: 0,
            }).returning();

            // Assign plantId to latest diagnostic report if exists
            const [latestDiag] = await tx.select().from(diagnosticReports)
              .where(eq(diagnosticReports.leadId, u.leadId))
              .orderBy(desc(diagnosticReports.createdAt))
              .limit(1);
            if (latestDiag) {
              await tx.update(diagnosticReports)
                .set({ plantId: newPlant.id })
                .where(eq(diagnosticReports.id, latestDiag.id));
              
              await tx.update(crmCustomerPlants)
                .set({ airflowCfm: latestDiag.airflow || 0 })
                .where(eq(crmCustomerPlants.id, newPlant.id));
            }

            // Create a primary contact
            await tx.insert(crmCustomerContacts).values({
              customerId: newCust.id,
              fullName: leadRecord.fullName,
              cargo: leadRecord.cargo || "Representante Técnico",
              phone: leadRecord.phone,
              email: leadRecord.email,
            });
          } else {
            // Update LTV of existing customer
            const currentLtv = existingCustomer.ltv || 0;
            await tx.update(crmCustomers)
              .set({ ltv: currentLtv + (u.totalValue || 0), updatedAt: new Date() })
              .where(eq(crmCustomers.id, existingCustomer.id));
          }
        }
      }

      return [u];
    });

    if (!updated) {
      return { success: false, error: "Propuesta no encontrada." };
    }

    revalidatePath("/crm");
    revalidatePath("/crm/clientes");
    revalidatePath("/crm/propuestas");
    revalidatePath("/crm/oportunidades");
    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/pipeline");
    revalidatePath(`/crm/propuestas/${proposalId}`);
    if (updated.leadId) {
      revalidatePath(`/crm/${updated.leadId}`);
    }

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateProposalStatusAction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: string
): Promise<ActionResult<any>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial", "tecnico", "ingeniero"]);

    const [updated] = await db
      .update(crmTasks)
      .set({ 
        status: newStatus, 
        updatedAt: new Date(),
        completedBy: newStatus === 'completado' ? dbUser.id : null,
        completedAt: newStatus === 'completado' ? new Date() : null
      })
      .where(eq(crmTasks.id, taskId))
      .returning();

    if (!updated) {
      return { success: false, error: "Tarea no encontrada." };
    }

    revalidatePath("/crm");
    revalidatePath("/crm/tareas");
    revalidatePath("/crm/actividades");
    revalidatePath("/crm/calendario");
    revalidatePath("/crm/alertas");
    revalidatePath("/crm/dashboard");
    if (updated.leadId) {
      revalidatePath(`/crm/${updated.leadId}`);
    }
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateTaskStatusAction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadCityAction(leadId: string, newCity: string): Promise<ActionResult<any>> {
  try {
    if (!newCity || newCity.trim() === "") {
      return { success: false, error: "La ciudad no puede estar vacía." };
    }

    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);
    const userRole = dbUser.role;
    const userEmail = dbUser.email || "";

    if (userRole === "vendedor" || userRole === "comercial") {
      const [existingPipe] = await db.select().from(crmPipeline).where(eq(crmPipeline.leadId, leadId));
      if (existingPipe && existingPipe.assignedTo && existingPipe.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
        return { success: false, error: "Acceso denegado: No tiene asignado este lead." };
      }
    }

    const normalizedCity = normalizeCity(newCity);
    const [updatedLead] = await db.update(leads)
      .set({ city: normalizedCity, updatedAt: new Date(), updatedBy: dbUser.id })
      .where(eq(leads.id, leadId))
      .returning();

    revalidatePath("/crm/dashboard");
    revalidatePath("/crm/leads");
    revalidatePath("/crm/pipeline");

    return { success: true, data: updatedLead };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar la ciudad." };
  }
}

export async function updateOpportunityAction(
  oppId: string,
  data: {
    title?: string;
    serviceType?: string;
    estimatedValue?: number;
    probability?: number;
    expectedCloseDate?: Date | string | null;
    stage?: string;
    assignedTo?: string;
    diagnosticId?: string | null;
  }
): Promise<ActionResult<typeof crmOpportunities.$inferSelect>> {
  try {
    await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial"]);

    const [existingOpp] = await db.select().from(crmOpportunities).where(eq(crmOpportunities.id, oppId));
    if (!existingOpp) {
      return { success: false, error: "Oportunidad no encontrada." };
    }

    const newEstValue = data.estimatedValue !== undefined ? data.estimatedValue : existingOpp.estimatedValue;
    const newProbability = data.probability !== undefined ? data.probability : existingOpp.probability;
    const newWeightedValue = Math.round((newEstValue * newProbability) / 100);

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.serviceType !== undefined) updateFields.serviceType = data.serviceType;
    if (data.estimatedValue !== undefined) updateFields.estimatedValue = data.estimatedValue;
    if (data.probability !== undefined) updateFields.probability = data.probability;
    updateFields.weightedValue = newWeightedValue;
    if (data.expectedCloseDate !== undefined) {
      updateFields.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : null;
    }
    if (data.stage !== undefined) updateFields.stage = data.stage;
    if (data.assignedTo !== undefined) updateFields.assignedTo = data.assignedTo;
    if (data.diagnosticId !== undefined) updateFields.diagnosticId = data.diagnosticId;

    const [updatedOpp] = await db.update(crmOpportunities)
      .set(updateFields)
      .where(eq(crmOpportunities.id, oppId))
      .returning();

    revalidatePath("/crm");
    revalidatePath("/crm/oportunidades");
    revalidatePath("/crm/dashboard");
    revalidatePath(`/crm/oportunidades/${oppId}`);
    revalidatePath(`/crm/${existingOpp.leadId}`);

    return { success: true, data: updatedOpp };
  } catch (error: any) {
    console.error("Error in updateOpportunityAction:", error);
    return { success: false, error: error.message || "Error al actualizar la oportunidad." };
  }
}

export async function updateTaskAction(
  taskId: string,
  data: { status?: string; notes?: string }
): Promise<ActionResult<typeof crmTasks.$inferSelect>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director", "director_comercial", "vendedor", "comercial", "tecnico", "ingeniero"]);

    const updateFields: any = {
      updatedAt: new Date(),
    };
    if (data.status !== undefined) {
      updateFields.status = data.status;
      if (data.status === 'completado') {
        updateFields.completedBy = dbUser.id;
        updateFields.completedAt = new Date();
      } else {
        updateFields.completedBy = null;
        updateFields.completedAt = null;
      }
    }
    if (data.notes !== undefined) {
      updateFields.notes = data.notes;
    }

    const [updated] = await db
      .update(crmTasks)
      .set(updateFields)
      .where(eq(crmTasks.id, taskId))
      .returning();

    if (!updated) {
      return { success: false, error: "Tarea no encontrada." };
    }

    revalidatePath("/crm");
    revalidatePath("/crm/calendario");
    revalidatePath("/crm/tareas");
    revalidatePath("/crm/actividades");
    revalidatePath("/crm/alertas");
    revalidatePath("/crm/dashboard");
    if (updated.leadId) {
      revalidatePath(`/crm/${updated.leadId}`);
    }
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateTaskAction:", error);
    return { success: false, error: error.message || "Error al actualizar el compromiso." };
  }
}

// ─── MODAL SUPPORT ACTIONS ─────────────────────────────────────────────────

/** Tipos para el select de leads en modales */
export type LeadSelectItem = {
  leadId: string;
  label: string;        // "Empresa | Planta o Área"
  companyName: string;
  environmentType: string;
};

/**
 * Devuelve leads activos (no cerrados) formateados para dropdowns de modales.
 * Si role === 'tecnico' o 'ingeniero', filtra los asignados al usuario en sesión.
 */
export async function getLeadsForSelectAction(): Promise<ActionResult<LeadSelectItem[]>> {
  try {
    const dbUser = await requireRole(["admin", "super_admin", "director_comercial", "vendedor", "comercial", "tecnico", "ingeniero"]);
    const role = dbUser.role;
    const fullName = dbUser.fullName ?? "";

    const rows = await db
      .select({
        leadId: leads.id,
        companyName: leads.companyName,
        environmentType: leads.environmentType,
        assignedTo: crmPipeline.assignedTo,
      })
      .from(leads)
      .leftJoin(crmPipeline, eq(crmPipeline.leadId, leads.id))
      .where(
        and(
          ne(leads.status, "cerrado_ganado"),
          ne(leads.status, "cerrado_perdido"),
          sql`${leads.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(200);

    let filtered = rows;
    if (role === "tecnico" || role === "ingeniero") {
      filtered = rows.filter(r => r.assignedTo === fullName);
    }

    const items: LeadSelectItem[] = filtered.map(r => ({
      leadId: r.leadId,
      label: `${r.companyName} | ${r.environmentType}`,
      companyName: r.companyName,
      environmentType: r.environmentType,
    }));

    return { success: true, data: items };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

/** Payload tipado para crear una tarea desde modal */
export type CreateTaskInput = {
  leadId: string;
  taskType: "visita_tecnica" | "llamada" | "reunion" | "tarea";
  priority: "critica" | "alta" | "media";
  dueDate: string;   // ISO string
  assignedTo?: string;
  notes?: string;
};

/**
 * Crea una tarea completa con priority y revalida en cascada.
 * Bloquea si faltan campos obligatorios (leadId, taskType, priority, dueDate).
 */
export async function createTaskFullAction(data: CreateTaskInput): Promise<ActionResult<typeof crmTasks.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

    if (!data.leadId || !data.taskType || !data.priority || !data.dueDate) {
      return { success: false, error: "Todos los campos obligatorios deben ser completados." };
    }

    const [newTask] = await db.insert(crmTasks).values({
      leadId: data.leadId,
      taskType: data.taskType,
      priority: data.priority,
      dueDate: new Date(data.dueDate),
      assignedTo: data.assignedTo ?? undefined,
      notes: data.notes ?? undefined,
      status: "pendiente",
    }).returning();

    // Log de actividad
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    await db.insert(crmActivityLogs).values({
      leadId: data.leadId,
      activityType: "technical",
      description: `Nueva tarea [${data.priority.toUpperCase()}]: ${data.taskType}`,
      userId: user!.id,
    });

    // Revalidación en cascada total
    revalidatePath("/crm/tareas");
    revalidatePath("/crm/actividades");
    revalidatePath("/crm/alertas");
    revalidatePath("/crm/dashboard");
    revalidatePath(`/crm/${data.leadId}`);

    return { success: true, data: newTask };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

/** Payload tipado para registrar una actividad desde modal */
export type CreateActivityInput = {
  leadId: string;
  taskType: "visita_tecnica" | "llamada" | "reunion" | "tarea";
  dueDate: string;
  assignedTo?: string;
  notes: string;
};

/**
 * Registra una actividad (tarea + log) desde el modal de Actividades.
 */
export async function createActivityFullAction(data: CreateActivityInput): Promise<ActionResult<typeof crmTasks.$inferSelect>> {
  try {
    await requireRole(["admin", "comercial", "director_comercial"]);

    if (!data.leadId || !data.taskType || !data.dueDate || !data.notes.trim()) {
      return { success: false, error: "Todos los campos obligatorios deben ser completados." };
    }

    const [newTask] = await db.insert(crmTasks).values({
      leadId: data.leadId,
      taskType: data.taskType,
      dueDate: new Date(data.dueDate),
      assignedTo: data.assignedTo ?? undefined,
      notes: data.notes,
      priority: "media",
      status: "pendiente",
    }).returning();

    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    await db.insert(crmActivityLogs).values({
      leadId: data.leadId,
      activityType: sanitizeActivityType(data.taskType),
      description: data.notes.substring(0, 200),
      userId: user!.id,
    });

    revalidatePath("/crm/actividades");
    revalidatePath("/crm/tareas");
    revalidatePath("/crm/alertas");
    revalidatePath("/crm/dashboard");
    revalidatePath(`/crm/${data.leadId}`);

    return { success: true, data: newTask };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

/** Alerta de notificación para el popover de la campana */
export type NotificationAlert = {
  id: string;
  type: "licitacion" | "diagnostico" | "cfm" | "tarea_vencida";
  message: string;
  severity: "critica" | "alta";
  href: string;
  createdAt: string;
};

/**
 * Devuelve alertas críticas vivas para el popover de la campana superior.
 * Máximo 10 alertas ordenadas por severidad.
 */
export async function getNotificationAlertsAction(): Promise<ActionResult<NotificationAlert[]>> {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const alerts: NotificationAlert[] = [];
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Regla 1: Licitaciones con fecha límite < 48h (pipeline.nextFollowUp próximo)
    const urgentPipeline = await db
      .select({ id: crmPipeline.id, leadId: crmPipeline.leadId, nextFollowUp: crmPipeline.nextFollowUp, assignedTo: crmPipeline.assignedTo })
      .from(crmPipeline)
      .where(
        and(
          sql`${crmPipeline.nextFollowUp} IS NOT NULL`,
          sql`${crmPipeline.nextFollowUp} >= ${now}`,
          sql`${crmPipeline.nextFollowUp} <= ${in48h}`,
        )
      )
      .limit(5);

    urgentPipeline.forEach(p => {
      alerts.push({
        id: `lic-${p.id}`,
        type: "licitacion",
        message: `Seguimiento vence en < 48h — Asignado: ${p.assignedTo ?? "Sin asignar"}`,
        severity: "critica",
        href: "/crm/calendario",
        createdAt: now.toISOString(),
      });
    });

    // Regla 2: Diagnósticos con estado requiere_visita
    const diagsReq = await db
      .select({ id: diagnosticReports.id, leadId: diagnosticReports.leadId, createdAt: diagnosticReports.createdAt })
      .from(diagnosticReports)
      .where(sql`${diagnosticReports.recommendations} ILIKE '%requiere_visita%' OR ${diagnosticReports.recommendations} ILIKE '%requiere visita%'`)
      .limit(4);

    diagsReq.forEach(d => {
      alerts.push({
        id: `diag-${d.id}`,
        type: "diagnostico",
        message: "Diagnóstico requiere visita técnica presencial.",
        severity: "alta",
        href: "/crm/diagnosticos",
        createdAt: d.createdAt.toISOString(),
      });
    });

    // Regla 3: Tareas vencidas sin completar
    const vencidas = await db
      .select({ id: crmTasks.id, taskType: crmTasks.taskType, dueDate: crmTasks.dueDate })
      .from(crmTasks)
      .where(
        and(
          sql`${crmTasks.status} != 'completado'`,
          sql`${crmTasks.dueDate} < ${now}`,
          sql`${crmTasks.deletedAt} IS NULL`
        )
      )
      .limit(3);

    vencidas.forEach(t => {
      alerts.push({
        id: `task-${t.id}`,
        type: "tarea_vencida",
        message: `Tarea vencida: ${t.taskType}`,
        severity: "critica",
        href: "/crm/tareas",
        createdAt: t.dueDate.toISOString(),
      });
    });

    // Ordenar: críticas primero
    alerts.sort((a, b) => (a.severity === "critica" ? -1 : 1));

    return { success: true, data: alerts.slice(0, 10) };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}


