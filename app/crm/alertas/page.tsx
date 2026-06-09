import React from "react";
import { db } from "@/lib/db";
import { leads, crmTasks, crmOpportunities, diagnosticReports, crmCompanies, crmCustomers, crmPipeline, crmUsers } from "@/lib/db/schema";
import { eq, lt, and, ne, lte, or } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AlertasClient from "./AlertasClient";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  if (!dbUser) {
    redirect("/login");
  }

  const currentUser = {
    id: dbUser.id,
    name: dbUser.fullName || authData.user.email?.split("@")[0] || "Usuario",
    role: dbUser.role,
    email: dbUser.email
  };

  const now = new Date();
  const fortyEightHoursFromNow = new Date();
  fortyEightHoursFromNow.setHours(fortyEightHoursFromNow.getHours() + 48);

  // 1. Fetch overdue tasks
  let tasksQuery = db.select({
    task: crmTasks,
    lead: leads,
    company: crmCompanies,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    tasksQuery = tasksQuery.where(
      and(
        lt(crmTasks.dueDate, now),
        ne(crmTasks.status, "completado"),
        eq(crmTasks.assignedTo, currentUser.email)
      )
    ) as any;
  } else if (currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial") {
    tasksQuery = tasksQuery.where(
      and(
        lt(crmTasks.dueDate, now),
        ne(crmTasks.status, "completado"),
        eq(crmPipeline.assignedTo, currentUser.email)
      )
    ) as any;
  } else {
    tasksQuery = tasksQuery.where(
      and(
        lt(crmTasks.dueDate, now),
        ne(crmTasks.status, "completado")
      )
    ) as any;
  }
  const overdueTasks = await tasksQuery;

  // 2. Fetch opportunities (for bidding alert)
  let oppsQuery = db.select({
    opportunity: crmOpportunities,
    lead: leads,
    company: crmCompanies,
  })
  .from(crmOpportunities)
  .leftJoin(leads, eq(crmOpportunities.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    // Technical users do not see financial opportunities
    oppsQuery = oppsQuery.where(
      and(
        eq(crmOpportunities.stage, "licitacion"),
        lte(crmOpportunities.expectedCloseDate, fortyEightHoursFromNow),
        eq(crmOpportunities.id, "00000000-0000-0000-0000-000000000000") // always empty
      )
    ) as any;
  } else if (currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial") {
    oppsQuery = oppsQuery.where(
      and(
        eq(crmOpportunities.stage, "licitacion"),
        lte(crmOpportunities.expectedCloseDate, fortyEightHoursFromNow),
        eq(crmPipeline.assignedTo, currentUser.email)
      )
    ) as any;
  } else {
    oppsQuery = oppsQuery.where(
      and(
        eq(crmOpportunities.stage, "licitacion"),
        lte(crmOpportunities.expectedCloseDate, fortyEightHoursFromNow)
      )
    ) as any;
  }
  const criticalOpps = await oppsQuery;

  // 3. Fetch diagnostic reports (for requires visit and CFM discrepancy)
  let diagsQuery = db.select({
    diagnostic: diagnosticReports,
    lead: leads,
    company: crmCompanies,
  })
  .from(diagnosticReports)
  .leftJoin(leads, eq(diagnosticReports.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    diagsQuery = diagsQuery.where(
      or(
        eq(diagnosticReports.createdBy, currentUser.id),
        eq(diagnosticReports.updatedBy, currentUser.id)
      )
    ) as any;
  } else if (currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial") {
    diagsQuery = diagsQuery.where(
      eq(crmPipeline.assignedTo, currentUser.email)
    ) as any;
  }
  const allDiags = await diagsQuery;

  // Build the alert list dynamically
  const alerts: any[] = [];

  // Add overdue tasks alerts
  overdueTasks.forEach((item: any) => {
    alerts.push({
      id: `task-${item.task.id}`,
      type: "tarea_vencida",
      title: `Tarea Vencida: ${item.task.taskType === 'visita_tecnica' ? 'Visita Técnica' : item.task.taskType === 'reunion' ? 'Reunión' : item.task.taskType === 'llamada' ? 'Llamada Comercial' : 'Revisión de Ingeniería'}`,
      description: item.task.notes || "Sin descripción",
      date: item.task.dueDate,
      leadName: item.company?.name || item.lead?.companyName || "CYH Ventilación",
      priority: "alta"
    });
  });

  // Add bidding stage expired or expiring in < 48 hours alerts
  criticalOpps.forEach((item: any) => {
    const isPastDate = new Date(item.opportunity.expectedCloseDate) < now;
    alerts.push({
      id: `licitacion-${item.opportunity.id}`,
      type: "licitacion_critica",
      title: isPastDate ? "Licitación Vencida" : "Licitación Próxima a Vencer (< 48h)",
      description: `La oportunidad "${item.opportunity.title}" está en etapa de licitación y vence el ${new Date(item.opportunity.expectedCloseDate).toLocaleString('es-CO')}.`,
      date: item.opportunity.expectedCloseDate,
      leadName: item.company?.name || item.lead?.companyName || "CYH Ventilación",
      priority: "critica" // Rojo ocre
    });
  });

  // Add requires visit alerts
  allDiags.forEach((item: any) => {
    if (item.diagnostic.status === "requiere_visita") {
      alerts.push({
        id: `visita-${item.diagnostic.id}`,
        type: "requiere_ajuste",
        title: "⚠️ Requiere Ajuste",
        description: `El diagnóstico técnico para ${item.lead?.fullName || "Cliente"} requiere ajuste operativo: ${item.diagnostic.verdictNotes || "Sin observaciones específicas"}.`,
        date: item.diagnostic.approvedAt || item.diagnostic.createdAt,
        leadName: item.company?.name || item.lead?.companyName || "CYH Ventilación",
        priority: "critica" // Rojo ocre
      });
    }

    // Add CFM discrepancy > 25% alerts
    if (item.diagnostic.dimensions && item.diagnostic.airflow) {
      let dims = item.diagnostic.dimensions;
      if (typeof dims === "string") {
        try { dims = JSON.parse(dims); } catch(e) {}
      }
      const { length, width, height } = dims as any;
      if (length && width && height) {
        const volume = Number(length) * Number(width) * Number(height);
        const recommendedCFM = Math.round(volume * 8.828675); // (volume * 15 * 35.3147) / 60
        const deviation = Math.abs(item.diagnostic.airflow - recommendedCFM) / recommendedCFM;
        if (deviation > 0.25) {
          alerts.push({
            id: `desvio-${item.diagnostic.id}`,
            type: "desvio_cfm",
            title: `Desvío Crítico CFM: ${Math.round(deviation * 100)}%`,
            description: `Se detectó un desvío mayor al 25% entre el flujo medido (${item.diagnostic.airflow} CFM) y el recomendado (${recommendedCFM} CFM).`,
            date: item.diagnostic.createdAt,
            leadName: item.company?.name || item.lead?.companyName || "CYH Ventilación",
            priority: "critica" // Rojo ocre
          });
        }
      }
    }
  });

  alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <AlertasClient initialAlerts={alerts} />;
}
