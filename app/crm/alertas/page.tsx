import React from "react";
import { db } from "@/lib/db";
import { leads, crmTasks, crmProposals, crmOpportunities, crmActivityLogs } from "@/lib/db/schema";
import { eq, lt, and, ne, isNull } from "drizzle-orm";
import AlertasClient from "./AlertasClient";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const now = new Date();

  // 1. Tareas Vencidas
  const overdueTasks = await db.query.crmTasks.findMany({
    where: (tasks, { and, lt, ne }) => and(
      lt(tasks.dueDate, now),
      ne(tasks.status, "completada")
    ),
    with: { lead: true }
  });

  // 2. Propuestas Vencidas
  const expiredProposals = await db.query.crmProposals.findMany({
    where: (props, { and, lt, eq }) => and(
      lt(props.validUntil, now),
      eq(props.status, "enviada")
    ),
    with: { lead: true }
  });

  // 3. Leads sin contacto (leads nuevos sin logs de actividad)
  const allLeads = await db.query.leads.findMany({
    where: (l, { eq }) => eq(l.status, "nuevo"),
    with: { crmActivityLogs: true }
  });
  const leadsNoContact = allLeads.filter(l => l.crmActivityLogs.length === 0);

  // 4. Oportunidades Estancadas (más de 15 días sin actualización)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const stalledOpps = await db.query.crmOpportunities.findMany({
    where: (opps, { and, lt, ne }) => and(
      lt(opps.updatedAt, fifteenDaysAgo),
      ne(opps.stage, "cerrado_ganado"),
      ne(opps.stage, "cerrado_perdido")
    ),
    with: { lead: true }
  });

  const alerts = [
    ...overdueTasks.map(t => ({
      id: `task-${t.id}`,
      type: "tarea_vencida",
      title: `Tarea Vencida: ${t.taskType}`,
      description: t.notes || "Sin descripción",
      date: t.dueDate,
      leadName: t.lead.companyName,
      priority: "alta"
    })),
    ...expiredProposals.map(p => ({
      id: `prop-${p.id}`,
      type: "propuesta_vencida",
      title: `Propuesta Vencida: V${p.version}.0`,
      description: `Monto: $${p.totalValue}`,
      date: p.validUntil,
      leadName: p.lead.companyName,
      priority: "media"
    })),
    ...leadsNoContact.map(l => ({
      id: `lead-${l.id}`,
      type: "lead_sin_contacto",
      title: "Lead Nuevo Sin Contactar",
      description: `Esperando primer contacto para ${l.serviceType}`,
      date: l.createdAt,
      leadName: l.companyName,
      priority: "alta"
    })),
    ...stalledOpps.map(o => ({
      id: `opp-${o.id}`,
      type: "oportunidad_estancada",
      title: `Oportunidad Estancada: ${o.title}`,
      description: `Sin movimiento en 15 días (Etapa: ${o.stage})`,
      date: o.updatedAt,
      leadName: o.lead.companyName,
      priority: "media"
    }))
  ].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return <AlertasClient initialAlerts={alerts} />;
}
