import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";

test.describe("Integrity - Concurrency Race Conditions", () => {
  let adminUserId: string;
  let targetLeadId: string;
  let dummyLeadId: string;
  let nextActionId: string | null = null;

  test.beforeAll(async () => {
    // 1. Ensure admin user exists
    adminUserId = await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");

    // 2. Cleanup old test leads & B2B customers
    await sql`DELETE FROM crm_customer_plants WHERE name LIKE 'Race Test Company%'`;
    await sql`DELETE FROM crm_customer_contacts WHERE email = 'race@cyh.com'`;
    await sql`DELETE FROM crm_customers WHERE name = 'Race Test Company'`;

    const oldLeads = await sql`SELECT id FROM leads WHERE email = 'race@cyh.com'`;
    for (const l of oldLeads) {
      await sql`DELETE FROM crm_pipeline WHERE lead_id = ${l.id}`;
      await sql`DELETE FROM crm_opportunities WHERE lead_id = ${l.id}`;
      await sql`DELETE FROM diagnostic_reports WHERE lead_id = ${l.id}`;
    }
    if (oldLeads.length > 0) {
      const ids = oldLeads.map(l => l.id);
      await sql`DELETE FROM leads WHERE id = ANY(${ids})`;
    }

    // 3. Seed target lead in 'negociacion' stage
    const [targetLead] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Race Lead', 'Race Test Company', 'race@cyh.com', '+573009999999', 'Barranquilla', 'mantenimiento', 'industrial', 'media', 'negociacion', ${adminUserId}
      ) RETURNING id
    `;
    targetLeadId = targetLead.id;

    // Seed dummy lead to capture action ID
    const [dummyLead] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Dummy Lead', 'Dummy Company', 'race_dummy@cyh.com', '+573009999998', 'Bogota', 'mantenimiento', 'industrial', 'media', 'nuevo', ${adminUserId}
      ) RETURNING id
    `;
    dummyLeadId = dummyLead.id;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    // Cleanup
    await sql`DELETE FROM crm_customer_plants WHERE name LIKE 'Race Test Company%'`;
    await sql`DELETE FROM crm_customer_contacts WHERE email = 'race@cyh.com'`;
    await sql`DELETE FROM crm_customers WHERE name = 'Race Test Company'`;
    
    for (const id of [targetLeadId, dummyLeadId]) {
      await sql`DELETE FROM crm_pipeline WHERE lead_id = ${id}`;
      await sql`DELETE FROM crm_opportunities WHERE lead_id = ${id}`;
      await sql`DELETE FROM diagnostic_reports WHERE lead_id = ${id}`;
      await sql`DELETE FROM leads WHERE id = ${id}`;
    }
  });

  test("Serializing concurrent updates to ganado stage to avoid duplicate B2B customers", async ({ page, context }) => {
    // 1. Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // Navigate to leads list
    await page.goto("/crm/leads");

    // 2. Set up request listener to capture getLeadByIdAction ID first
    const getLeadRequestPromise = page.waitForRequest(req => {
      const actionHeader = req.headers()["next-action"];
      return !!actionHeader && req.method() === "POST";
    });

    // Select dummy lead in UI
    await page.click(`tr:has-text('Dummy Lead')`);
    
    const getLeadReq = await getLeadRequestPromise;
    const getLeadActionId = getLeadReq.headers()["next-action"]!;

    // Now set up request listener to capture update status action
    const updateStatusRequestPromise = page.waitForRequest(req => {
      const actionHeader = req.headers()["next-action"];
      return !!actionHeader && req.method() === "POST" && actionHeader !== getLeadActionId;
    });

    // Change stage of dummy lead to trigger updateLeadStatusAction and capture ID
    const stageSelect = page.locator("label:has-text('Etapa Comercial') + select");
    await stageSelect.selectOption("contacto");

    // Capture the action ID
    const capturedReq = await updateStatusRequestPromise;
    nextActionId = capturedReq.headers()["next-action"]!;
    expect(nextActionId).toBeDefined();
    console.log("Captured Next-Action ID:", nextActionId);

    // 3. Count customers and plants before the race condition
    const [custCountBefore] = await sql`SELECT count(*)::int as count FROM crm_customers WHERE name = 'Race Test Company'`;
    const [plantCountBefore] = await sql`SELECT count(*)::int as count FROM crm_customer_plants WHERE name LIKE 'Planta Principal - Race Test Company%'`;

    expect(custCountBefore.count).toBe(0);
    expect(plantCountBefore.count).toBe(0);

    // 4. Launch 4 concurrent Server Action HTTP POST requests to transition Target Lead to "ganado"
    const apiRequest = context.request;
    const concurrentRequests = Array.from({ length: 4 }).map(() => {
      return apiRequest.post("/crm/leads", {
        headers: {
          "next-action": nextActionId!,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify([targetLeadId, "ganado"]),
      });
    });

    const results = await Promise.all(concurrentRequests);
    console.log("Concurrent requests completed. Status codes:", results.map(r => r.status()));
    for (let i = 0; i < results.length; i++) {
      console.log(`Response ${i} body:`, await results[i].text());
    }

    // 5. Verify database counts after the race execution
    const [custCountAfter] = await sql`SELECT count(*)::int as count FROM crm_customers WHERE name = 'Race Test Company'`;
    const [plantCountAfter] = await sql`SELECT count(*)::int as count FROM crm_customer_plants WHERE name LIKE 'Planta Principal - Race Test Company%'`;

    console.log(`B2B Customers created: ${custCountAfter.count} (Expected: 1)`);
    console.log(`B2B Customer Plants created: ${plantCountAfter.count} (Expected: 1)`);

    // Crucial Assertions: Ensure EXACTLY 1 customer and plant were created (no duplicates!)
    expect(custCountAfter.count).toBe(1);
    expect(plantCountAfter.count).toBe(1);
  });
});
