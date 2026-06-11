import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, cleanupTestLeadsByEmail, sql } from "../helpers/db";

test.describe("Security - IDOR Isolation", () => {
  let clientAId: string;
  let clientBId: string;
  let leadAId: string;

  test.beforeAll(async () => {
    // 1. Ensure test client users exist
    clientAId = await ensureTestUser("clienta@cyh.com", "cliente", "Client A");
    clientBId = await ensureTestUser("clientb@cyh.com", "cliente", "Client B");

    // 2. Cleanup old test leads
    await cleanupTestLeadsByEmail("clienta@cyh.com");
    await cleanupTestLeadsByEmail("clientb@cyh.com");

    // 3. Create a lead for Client A (ID-linked)
    const [leadA] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Lead de A', 'Empresa A', 'clienta@cyh.com', '+573001234567', 'Barranquilla', 'mantenimiento', 'industrial', 'media', 'nuevo', ${clientAId}
      ) RETURNING id
    `;
    leadAId = leadA.id;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    await cleanupTestLeadsByEmail("clienta@cyh.com");
  });

  test("Client B cannot access Client A's lead", async ({ page }) => {
    // 1. Login as Client B
    await page.goto("/login");
    await page.fill('input[name="email"]', "clientb@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Wait for redirect to customer portal
    await page.waitForURL("**/portal/inicio");

    // 2. Try to navigate directly to Client A's lead page
    await page.goto(`/crm/${leadAId}`);

    // 3. Assert that they are blocked and redirected back to their portal home page
    await page.waitForURL("**/portal/inicio");
    await expect(page).toHaveURL(/\/portal\/inicio/);
  });
});
