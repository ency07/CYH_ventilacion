import { pgTable, uuid, timestamp, varchar, integer, text, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  position: varchar("position", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  serviceType: varchar("service_type", { length: 50 }).notNull(), // fabricacion | venta | mantenimiento | reparacion
  environmentType: varchar("environment_type", { length: 100 }).notNull(),
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(), // baja | media | alta | critica
  status: varchar("status", { length: 50 }).default("nuevo").notNull(), // nuevo | diagnosticado | propuesta | negociacion | ganado | perdido
  source: varchar("source", { length: 50 }).default("wizard").notNull(),
  estimatedBudgetMin: integer("estimated_budget_min"),
  estimatedBudgetMax: integer("estimated_budget_max"),
  complexityScore: integer("complexity_score"),
  severityScore: integer("severity_score"),
  notes: text("notes"),
  leadScore: integer("lead_score").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  riskLevel: varchar("risk_level", { length: 50 }).default("COLD").notNull(), // HOT | WARM | COLD | SPAM
}, (table) => {
  return {
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

export const diagnosticReports = pgTable("diagnostic_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  airflow: integer("airflow"),
  dimensions: jsonb("dimensions"), // { length, width, height }
  technicalObservations: text("technical_observations"),
  materialSuggestions: text("material_suggestions"),
  inspectionProtocol: text("inspection_protocol"),
  recommendations: text("recommendations"),
  currency: varchar("currency", { length: 10 }).default("COP").notNull(),
  generatedPdfUrl: text("generated_pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmPipeline = pgTable("crm_pipeline", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  stage: varchar("stage", { length: 50 }).default("nuevo").notNull(), 
  priority: varchar("priority", { length: 50 }).default("media").notNull(), // baja | media | alta
  assignedTo: varchar("assigned_to", { length: 255 }),
  probability: integer("probability").default(10).notNull(),
  lossReason: text("loss_reason"),
  pdfSent: boolean("pdf_sent").default(false).notNull(),
  pdfSentAt: timestamp("pdf_sent_at"),
  nextFollowUp: timestamp("next_follow_up"),
  nextMeeting: timestamp("next_meeting"),
  nextTask: varchar("next_task", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    stageIdx: index("stage_idx").on(table.stage),
    assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
  };
});

export const crmActivityLogs = pgTable("crm_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // lead_created | report_generated | call_scheduled | email_sent | proposal_sent | meeting | status_changed
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadVerifications = pgTable("lead_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  attempts: integer("attempts").default(0).notNull(),
  method: varchar("method", { length: 50 }).default("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configure Drizzle relations for safe typings and nested queries
export const leadsRelations = relations(leads, ({ many }) => ({
  diagnosticReports: many(diagnosticReports),
  crmPipelines: many(crmPipeline),
  crmActivityLogs: many(crmActivityLogs),
  leadVerifications: many(leadVerifications),
}));

export const diagnosticReportsRelations = relations(diagnosticReports, ({ one }) => ({
  lead: one(leads, {
    fields: [diagnosticReports.leadId],
    references: [leads.id],
  }),
}));

export const crmPipelineRelations = relations(crmPipeline, ({ one }) => ({
  lead: one(leads, {
    fields: [crmPipeline.leadId],
    references: [leads.id],
  }),
}));

export const crmActivityLogsRelations = relations(crmActivityLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [crmActivityLogs.leadId],
    references: [leads.id],
  }),
}));

export const leadVerificationsRelations = relations(leadVerifications, ({ one }) => ({
  lead: one(leads, {
    fields: [leadVerifications.leadId],
    references: [leads.id],
  }),
}));
