const fs = require('fs');
const path = require('path');

const schemaPath = path.join('lib', 'db', 'schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// 1. Add crm_companies, crm_contacts, crm_documents before crmTasks
const b2bSchema = `
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

export const crmDocuments = pgTable("crm_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf | image | doc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;

schemaContent = schemaContent.replace(
  'export const crmTasks = pgTable("crm_tasks", {',
  b2bSchema + '\nexport const crmTasks = pgTable("crm_tasks", {'
);

// 2. Add foreign keys to leads
schemaContent = schemaContent.replace(
  'estimatedBudgetMax: integer("estimated_budget_max"),',
  'estimatedBudgetMax: integer("estimated_budget_max"),\n  companyId: uuid("company_id").references(() => crmCompanies.id, { onDelete: "set null" }),\n  contactId: uuid("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),'
);

// 3. Add Relations
const b2bRelations = `
export const crmCompaniesRelations = relations(crmCompanies, ({ many }) => ({
  contacts: many(crmContacts),
  leads: many(leads),
}));

export const crmContactsRelations = relations(crmContacts, ({ one, many }) => ({
  company: one(crmCompanies, {
    fields: [crmContacts.companyId],
    references: [crmCompanies.id],
  }),
  leads: many(leads),
}));

export const crmDocumentsRelations = relations(crmDocuments, ({ one }) => ({
  lead: one(leads, {
    fields: [crmDocuments.leadId],
    references: [leads.id],
  }),
}));
`;

schemaContent += b2bRelations;

// 4. Update leadsRelations
schemaContent = schemaContent.replace(
  'crmTasks: many(crmTasks),',
  'crmTasks: many(crmTasks),\n  crmDocuments: many(crmDocuments),\n  company: one(crmCompanies, { fields: [leads.companyId], references: [crmCompanies.id] }),\n  contact: one(crmContacts, { fields: [leads.contactId], references: [crmContacts.id] }),'
);

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('B2B Schema added to schema.ts');
