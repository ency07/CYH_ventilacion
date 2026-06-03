import { pgTable, uuid, timestamp, varchar, integer, text, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const crmCompanies = pgTable("crm_companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  city: varchar("city", { length: 100 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crmContacts = pgTable("crm_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => crmCompanies.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  serviceType: varchar("service_type", { length: 50 }).notNull(),
  environmentType: varchar("environment_type", { length: 100 }).notNull(),
  urgencyLevel: varchar("urgency_level", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("nuevo").notNull(),
  source: varchar("source", { length: 50 }).default("wizard").notNull(),
  estimatedBudgetMin: integer("estimated_budget_min"),
  estimatedBudgetMax: integer("estimated_budget_max"),
  companyId: uuid("company_id").references(() => crmCompanies.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  complexityScore: integer("complexity_score"),
  severityScore: integer("severity_score"),
  notes: text("notes"),
  leadScore: integer("lead_score").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  riskLevel: varchar("risk_level", { length: 50 }).default("COLD").notNull(),
}, (table) => {
  return {
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

export const crmDocuments = pgTable("crm_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmTasks = pgTable("crm_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pendiente").notNull(),
  dueDate: timestamp("due_date").notNull(),
  assignedTo: varchar("assigned_to", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diagnosticReports = pgTable("diagnostic_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  airflow: integer("airflow"),
  dimensions: jsonb("dimensions"),
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
  priority: varchar("priority", { length: 50 }).default("media").notNull(),
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
  activityType: varchar("activity_type", { length: 50 }).notNull(),
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

export const crmUsers = pgTable("crm_users", {
  id: uuid("id").primaryKey(), // maps to auth.users id
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("vendedor").notNull(), // admin | vendedor | tecnico
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configure Drizzle relations
export const leadsRelations = relations(leads, ({ one, many }) => ({
  diagnosticReports: many(diagnosticReports),
  crmPipelines: many(crmPipeline),
  crmActivityLogs: many(crmActivityLogs),
  leadVerifications: many(leadVerifications),
  crmTasks: many(crmTasks),
  crmDocuments: many(crmDocuments),
  company: one(crmCompanies, { fields: [leads.companyId], references: [crmCompanies.id] }),
  contact: one(crmContacts, { fields: [leads.contactId], references: [crmContacts.id] }),
}));

export const diagnosticReportsRelations = relations(diagnosticReports, ({ one }) => ({
  lead: one(leads, { fields: [diagnosticReports.leadId], references: [leads.id] }),
}));

export const crmPipelineRelations = relations(crmPipeline, ({ one }) => ({
  lead: one(leads, { fields: [crmPipeline.leadId], references: [leads.id] }),
}));

export const crmActivityLogsRelations = relations(crmActivityLogs, ({ one }) => ({
  lead: one(leads, { fields: [crmActivityLogs.leadId], references: [leads.id] }),
}));

export const leadVerificationsRelations = relations(leadVerifications, ({ one }) => ({
  lead: one(leads, { fields: [leadVerifications.leadId], references: [leads.id] }),
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  lead: one(leads, { fields: [crmTasks.leadId], references: [leads.id] }),
}));

export const crmCompaniesRelations = relations(crmCompanies, ({ many }) => ({
  contacts: many(crmContacts),
  leads: many(leads),
}));

export const crmContactsRelations = relations(crmContacts, ({ one, many }) => ({
  company: one(crmCompanies, { fields: [crmContacts.companyId], references: [crmCompanies.id] }),
  leads: many(leads),
}));

export const crmDocumentsRelations = relations(crmDocuments, ({ one }) => ({
  lead: one(leads, { fields: [crmDocuments.leadId], references: [leads.id] }),
}));
