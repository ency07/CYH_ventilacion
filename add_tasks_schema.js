const fs = require('fs');
const path = require('path');

const schemaPath = path.join('lib', 'db', 'schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const tasksSchema = `
export const crmTasks = pgTable("crm_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  assignedTo: varchar("assigned_to", { length: 255 }).default('Admin').notNull(),
  taskType: varchar("task_type", { length: 100 }).notNull(), // Llamar cliente | Enviar propuesta | Agendar visita | Seguimiento WhatsApp | Reunión técnica
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 50 }).default("pendiente").notNull(), // pendiente | completado
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

`;

// Add crmTasks before leadVerifications
schemaContent = schemaContent.replace(
  'export const leadVerifications',
  tasksSchema + 'export const leadVerifications'
);

// Add relations for crmTasks
const relationsCode = `
export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  lead: one(leads, {
    fields: [crmTasks.leadId],
    references: [leads.id],
  }),
}));
`;
schemaContent += relationsCode;

// Add crmTasks to leadsRelations
schemaContent = schemaContent.replace(
  'crmActivityLogs: many(crmActivityLogs),',
  'crmActivityLogs: many(crmActivityLogs),\n  crmTasks: many(crmTasks),'
);

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('crmTasks added to schema.ts');

const crmSchemaPath = path.join('lib', 'validations', 'crm.schema.ts');
let crmSchemaContent = fs.readFileSync(crmSchemaPath, 'utf8');

const zodTasks = `
export const TaskInsertSchema = z.object({
  leadId: z.string().uuid("ID de lead inválido."),
  assignedTo: z.string().default("Admin"),
  taskType: z.enum(["Llamar cliente", "Enviar propuesta", "Agendar visita", "Seguimiento WhatsApp", "Reunión técnica", "Otro"]),
  dueDate: z.string().or(z.date()),
  status: z.enum(["pendiente", "completado"]).default("pendiente"),
  notes: z.string().optional().nullable(),
});
`;

crmSchemaContent += zodTasks;
fs.writeFileSync(crmSchemaPath, crmSchemaContent, 'utf8');
console.log('TaskInsertSchema added to crm.schema.ts');
