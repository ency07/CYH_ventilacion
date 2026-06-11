import { pgTable, uuid, timestamp, varchar, integer, text, jsonb, boolean, index, AnyPgColumn } from "drizzle-orm/pg-core";
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
  companyId: uuid("company_id").references(() => crmCompanies.id, { onDelete: "restrict" }),
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
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by").references(() => crmUsers.id),
  updatedBy: uuid("updated_by").references(() => crmUsers.id),
  closedBy: uuid("closed_by").references(() => crmUsers.id),
  campaignSource: varchar("campaign_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
}, (table) => {
  return {
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

export const crmDocuments = pgTable("crm_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  customerId: uuid("customer_id").references(() => crmCustomers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmTasks = pgTable("crm_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pendiente").notNull(),
  dueDate: timestamp("due_date").notNull(),
  assignedTo: varchar("assigned_to", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  completedBy: uuid("completed_by").references(() => crmUsers.id),
  completedAt: timestamp("completed_at"),
});

export const diagnosticReports = pgTable("diagnostic_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  plantId: uuid("plant_id").references(() => crmCustomerPlants.id, { onDelete: "set null" }),
  airflow: integer("airflow"),
  dimensions: jsonb("dimensions"),
  technicalObservations: text("technical_observations"),
  materialSuggestions: text("material_suggestions"),
  inspectionProtocol: text("inspection_protocol"),
  recommendations: text("recommendations"),
  currency: varchar("currency", { length: 10 }).default("COP").notNull(),
  generatedPdfUrl: text("generated_pdf_url"),
  status: varchar("status", { length: 50 }).default("pendiente").notNull(),
  verdictNotes: text("verdict_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by").references(() => crmUsers.id),
  updatedBy: uuid("updated_by").references(() => crmUsers.id),
  approvedBy: uuid("approved_by").references(() => crmUsers.id),
  approvedAt: timestamp("approved_at"),
  versionNumber: integer("version_number").default(1),
});

export const crmPipeline = pgTable("crm_pipeline", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
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
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: uuid("user_id").references(() => crmUsers.id),
  durationMinutes: integer("duration_minutes"),
  outcome: varchar("outcome", { length: 50 }),
});

export const leadVerifications = pgTable("lead_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
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
  isActive: boolean("is_active").default(true).notNull(),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: uuid("suspended_by").references((): AnyPgColumn => crmUsers.id),
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
  crmProposals: many(crmProposals),
  crmOpportunities: many(crmOpportunities),
  company: one(crmCompanies, { fields: [leads.companyId], references: [crmCompanies.id] }),
  contact: one(crmContacts, { fields: [leads.contactId], references: [crmContacts.id] }),
}));

export const diagnosticReportsRelations = relations(diagnosticReports, ({ one }) => ({
  lead: one(leads, { fields: [diagnosticReports.leadId], references: [leads.id] }),
  plant: one(crmCustomerPlants, { fields: [diagnosticReports.plantId], references: [crmCustomerPlants.id] }),
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
  customer: one(crmCustomers, { fields: [crmDocuments.customerId], references: [crmCustomers.id] }),
}));

export const crmProposals = pgTable("crm_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  diagnosticId: uuid("diagnostic_id").references(() => diagnosticReports.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  version: integer("version").default(1).notNull(),
  totalValue: integer("total_value").notNull(),
  currency: varchar("currency", { length: 10 }).default("COP").notNull(),
  status: varchar("status", { length: 50 }).default("borrador").notNull(), // borrador, enviada, aceptada, rechazada
  pdfUrl: text("pdf_url"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by").references(() => crmUsers.id),
  approvedBy: uuid("approved_by").references(() => crmUsers.id),
  approvedAt: timestamp("approved_at"),
  discountAmount: integer("discount_amount"),
  discountReason: text("discount_reason"),
});

export const crmProposalsRelations = relations(crmProposals, ({ one }) => ({
  lead: one(leads, { fields: [crmProposals.leadId], references: [leads.id] }),
  diagnosticReport: one(diagnosticReports, { fields: [crmProposals.diagnosticId], references: [diagnosticReports.id] }),
}));

export const crmOpportunities = pgTable("crm_opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "restrict" }).notNull(),
  diagnosticId: uuid("diagnostic_id").references(() => diagnosticReports.id, { onDelete: "set null" }),
  serviceType: varchar("service_type", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  estimatedValue: integer("estimated_value").notNull(),
  probability: integer("probability").default(50).notNull(), // 0-100
  weightedValue: integer("weighted_value").notNull(),
  expectedCloseDate: timestamp("expected_close_date"),
  stage: varchar("stage", { length: 50 }).notNull(), // analisis, propuesta, negociacion, cerrado_ganado, cerrado_perdido
  assignedTo: varchar("assigned_to", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crmOpportunitiesRelations = relations(crmOpportunities, ({ one }) => ({
  lead: one(leads, { fields: [crmOpportunities.leadId], references: [leads.id] }),
  diagnosticReport: one(diagnosticReports, { fields: [crmOpportunities.diagnosticId], references: [diagnosticReports.id] }),
}));

// B2B Customer Management Tables
export const crmCustomers = pgTable("crm_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nit: varchar("nit", { length: 50 }),
  status: varchar("status", { length: 50 }).default("activo").notNull(), // activo, inactivo
  ltv: integer("ltv").default(0).notNull(), // Lifetime value in COP
  assignedTo: varchar("assigned_to", { length: 255 }), // assigned salesperson email
  recurrenceIndex: integer("recurrence_index").default(0).notNull(), // index of loyalty recurrence (0-100)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crmCustomerPlants = pgTable("crm_customer_plants", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").references(() => crmCustomers.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  airflowCfm: integer("airflow_cfm").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmCustomerContacts = pgTable("crm_customer_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").references(() => crmCustomers.id, { onDelete: "cascade" }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  userId: uuid("user_id").references(() => crmUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmCustomersRelations = relations(crmCustomers, ({ many }) => ({
  plants: many(crmCustomerPlants),
  contacts: many(crmCustomerContacts),
  serviceRequests: many(crmServiceRequests),
}));

export const crmCustomerPlantsRelations = relations(crmCustomerPlants, ({ one, many }) => ({
  customer: one(crmCustomers, { fields: [crmCustomerPlants.customerId], references: [crmCustomers.id] }),
  diagnostics: many(diagnosticReports),
  serviceRequests: many(crmServiceRequests),
}));

export const crmCustomerContactsRelations = relations(crmCustomerContacts, ({ one }) => ({
  customer: one(crmCustomers, { fields: [crmCustomerContacts.customerId], references: [crmCustomers.id] }),
  user: one(crmUsers, { fields: [crmCustomerContacts.userId], references: [crmUsers.id] }),
}));

export const crmServiceRequests = pgTable("crm_service_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").references(() => crmCustomers.id, { onDelete: "cascade" }).notNull(),
  plantId: uuid("plant_id").references(() => crmCustomerPlants.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  urgency: varchar("urgency", { length: 50 }).notNull(), // baja, media, alta, critica
  status: varchar("status", { length: 50 }).default("abierta").notNull(), // abierta, asignada, en_proceso, cerrada
  createdBy: uuid("created_by").references(() => crmUsers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crmServiceRequestsRelations = relations(crmServiceRequests, ({ one }) => ({
  customer: one(crmCustomers, { fields: [crmServiceRequests.customerId], references: [crmCustomers.id] }),
  plant: one(crmCustomerPlants, { fields: [crmServiceRequests.plantId], references: [crmCustomerPlants.id] }),
  creator: one(crmUsers, { fields: [crmServiceRequests.createdBy], references: [crmUsers.id] }),
}));

export type AuditLogMetadata = 
  | {
      leadId: string;
      companyName: string;
      finalLtv: number;
    }
  | {
      previousRole: string;
      newRole: string;
      userId: string;
    }
  | {
      userId: string;
      action: "suspend" | "reactivate";
    }
  | {
      userId: string;
      email: string;
    };

export const crmAuditLogs = pgTable("crm_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => crmUsers.id, { onDelete: "restrict" }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityAffected: varchar("entity_affected", { length: 255 }).notNull(),
  metadata: jsonb("metadata").$type<AuditLogMetadata>().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    actorIdIdx: index("crm_audit_logs_actor_id_idx").on(table.actorId),
    actionIdx: index("crm_audit_logs_action_idx").on(table.action),
    entityAffectedIdx: index("crm_audit_logs_entity_affected_idx").on(table.entityAffected),
    createdAtIdx: index("crm_audit_logs_created_at_idx").on(table.createdAt),
  };
});
