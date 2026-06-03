const fs = require('fs');
const path = require('path');

// 1. Refactor lib/db/schema.ts
const schemaPath = path.join('lib', 'db', 'schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
schemaContent = schemaContent.replace(
  'position: varchar("position", { length: 100 }),',
  'cargo: varchar("cargo", { length: 100 }),'
);
fs.writeFileSync(schemaPath, schemaContent, 'utf8');

// 2. Refactor lib/validations/crm.schema.ts
const crmSchemaPath = path.join('lib', 'validations', 'crm.schema.ts');
let crmSchemaContent = fs.readFileSync(crmSchemaPath, 'utf8');
crmSchemaContent = crmSchemaContent.replace(
  'position: z.string().optional().nullable(),',
  'cargo: z.string().optional().nullable(),'
);
fs.writeFileSync(crmSchemaPath, crmSchemaContent, 'utf8');

// 3. Refactor lib/server-actions/leads.ts
const leadsPath = path.join('lib', 'server-actions', 'leads.ts');
let leadsContent = fs.readFileSync(leadsPath, 'utf8');
// Replace in calculateLeadScore signature
leadsContent = leadsContent.replace(
  'position: string | null;',
  'cargo: string | null;'
);
// Replace in calculateLeadScore logic
leadsContent = leadsContent.replace(
  'const pos = (lead.position || "").toLowerCase();',
  'const pos = (lead.cargo || "").toLowerCase();'
);
// Replace in calculateLeadScore payload
leadsContent = leadsContent.replace(
  'position: validated.position ?? null,',
  'cargo: validated.cargo ?? null,'
);
// Replace in db.insert(leads).values payload
leadsContent = leadsContent.replace(
  'position: validated.position ?? null,',
  'cargo: validated.cargo ?? null,'
);
fs.writeFileSync(leadsPath, leadsContent, 'utf8');

// 4. Refactor components/wizard/StepLead.tsx
const stepLeadPath = path.join('components', 'wizard', 'StepLead.tsx');
let stepLeadContent = fs.readFileSync(stepLeadPath, 'utf8');
stepLeadContent = stepLeadContent.replace(
  'position: data.cargo || "Otro",',
  'cargo: data.cargo || "Otro",'
);
fs.writeFileSync(stepLeadPath, stepLeadContent, 'utf8');

// 5. Refactor app/crm/layout.tsx (Sidebar Toggle)
const crmLayoutPath = path.join('app', 'crm', 'layout.tsx');
let layoutContent = fs.readFileSync(crmLayoutPath, 'utf8');

// Add PanelLeft import
layoutContent = layoutContent.replace(
  'Menu, X, Users',
  'Menu, X, Users, PanelLeft'
);

// Update sidebar class to collapse on desktop
layoutContent = layoutContent.replace(
  'className={`fixed md:sticky top-20 left-0 z-50 w-64 h-[calc(100vh-5rem)] bg-bg-secondary border-r border-border-subtle transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? \'translate-x-0\' : \'-translate-x-full md:translate-x-0\'}`}',
  'className={`fixed md:sticky top-20 left-0 z-50 h-[calc(100vh-5rem)] bg-bg-secondary border-r border-border-subtle transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? \'w-64 translate-x-0\' : \'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden opacity-0\'}`}'
);

// Add toggle button to desktop view
const toggleButtonHTML = `
        <div className="hidden md:flex p-4 border-b border-border-subtle bg-bg-secondary items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium transition-all shadow-sm">
            <PanelLeft className="h-5 w-5" />
          </button>
          <span className="ml-3 font-mono text-sm font-bold tracking-widest text-text-primary uppercase">Pipeline Ejecutivo</span>
        </div>
        <div className="md:hidden p-4 border-b border-border-subtle bg-bg-secondary flex items-center">
`;
layoutContent = layoutContent.replace(
  '<div className="md:hidden p-4 border-b border-border-subtle bg-bg-secondary flex items-center">',
  toggleButtonHTML
);

// Make main content width dynamic based on sidebar state
layoutContent = layoutContent.replace(
  'className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)] relative"',
  'className={`flex-1 flex flex-col w-full relative transition-all duration-300 ${sidebarOpen ? \'md:w-[calc(100%-16rem)]\' : \'md:w-full\'}`}'
);

// Default sidebar to true initially (fix the hook)
layoutContent = layoutContent.replace(
  'const [sidebarOpen, setSidebarOpen] = useState(false);',
  'const [sidebarOpen, setSidebarOpen] = useState(true);'
);

fs.writeFileSync(crmLayoutPath, layoutContent, 'utf8');

console.log("Refactor phase 4 completed.");
