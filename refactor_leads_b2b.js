const fs = require('fs');
const path = require('path');

const leadsPath = path.join('lib', 'server-actions', 'leads.ts');
let leadsContent = fs.readFileSync(leadsPath, 'utf8');

// Add imports for crmCompanies and crmContacts
leadsContent = leadsContent.replace(
  'import { leads } from "@/lib/db/schema";',
  'import { leads, crmCompanies, crmContacts } from "@/lib/db/schema";'
);

const newLogic = `
    // B2B Logic: Upsert Company
    let companyId = null;
    if (validated.companyName) {
      const existingCompany = await db.query.crmCompanies.findFirst({
        where: eq(crmCompanies.name, validated.companyName)
      });
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const [newComp] = await db.insert(crmCompanies).values({
          name: validated.companyName,
          city: validated.city,
        }).returning();
        companyId = newComp.id;
      }
    }

    // B2B Logic: Upsert Contact
    let contactId = null;
    if (validated.fullName && companyId) {
      const existingContact = await db.query.crmContacts.findFirst({
        where: eq(crmContacts.email, validated.email)
      });
      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const [newCont] = await db.insert(crmContacts).values({
          companyId,
          fullName: validated.fullName,
          cargo: validated.cargo ?? null,
          email: validated.email,
          phone: validated.phone,
        }).returning();
        contactId = newCont.id;
      }
    }

    const [newLead] = await db.insert(leads).values({
      fullName: validated.fullName,
      companyName: validated.companyName,
      companyId: companyId,
      contactId: contactId,
`;

leadsContent = leadsContent.replace(
  'const [newLead] = await db.insert(leads).values({\n      fullName: validated.fullName,\n      companyName: validated.companyName,',
  newLogic
);

fs.writeFileSync(leadsPath, leadsContent, 'utf8');
console.log('B2B Upsert logic injected in leads.ts');
