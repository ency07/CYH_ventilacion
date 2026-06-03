import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    console.log("Starting B2B backfill migration...");

    // 1. Get all leads without a company_id
    const legacyLeads = await sql`SELECT id, company_name, city, full_name, email, phone, cargo FROM public.leads WHERE company_id IS NULL`;
    console.log(`Found ${legacyLeads.length} leads without company_id.`);

    if (legacyLeads.length === 0) {
      console.log("No leads to backfill.");
      return;
    }

    // 2. Group by company_name
    const uniqueCompaniesMap = new Map();
    for (const lead of legacyLeads) {
      const cName = lead.company_name.trim().toLowerCase();
      if (!uniqueCompaniesMap.has(cName)) {
        uniqueCompaniesMap.set(cName, {
          originalName: lead.company_name.trim(),
          city: lead.city,
          leads: []
        });
      }
      uniqueCompaniesMap.get(cName).leads.push(lead);
    }

    console.log(`Extracted ${uniqueCompaniesMap.size} unique companies.`);

    // 3. Insert companies and update leads
    for (const [key, companyData] of uniqueCompaniesMap) {
      console.log(`Processing company: ${companyData.originalName}...`);
      
      // Check if company already exists
      let existingCompany = await sql`SELECT id FROM public.crm_companies WHERE name = ${companyData.originalName} LIMIT 1`;
      let companyId;
      
      if (existingCompany.length > 0) {
        companyId = existingCompany[0].id;
      } else {
        const insertRes = await sql`
          INSERT INTO public.crm_companies (name, city) 
          VALUES (${companyData.originalName}, ${companyData.city})
          RETURNING id
        `;
        companyId = insertRes[0].id;
      }

      for (const lead of companyData.leads) {
        // Create contact
        let existingContact = await sql`SELECT id FROM public.crm_contacts WHERE email = ${lead.email} LIMIT 1`;
        let contactId;

        if (existingContact.length > 0) {
          contactId = existingContact[0].id;
        } else {
          const cInsertRes = await sql`
            INSERT INTO public.crm_contacts (company_id, full_name, cargo, email, phone)
            VALUES (${companyId}, ${lead.full_name}, ${lead.cargo}, ${lead.email}, ${lead.phone})
            RETURNING id
          `;
          contactId = cInsertRes[0].id;
        }

        // Update lead
        await sql`
          UPDATE public.leads 
          SET company_id = ${companyId}, contact_id = ${contactId}
          WHERE id = ${lead.id}
        `;
      }
    }

    console.log("Success! Backfill migration completed.");
  } catch (err) {
    console.error("Error executing backfill:", err);
  } finally {
    await sql.end();
  }
}

run();
