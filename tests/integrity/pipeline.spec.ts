import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, cleanupTestLeadsByEmail, sql } from "../helpers/db";

test.describe("Integrity - Pipeline Workflow", () => {
  test.beforeAll(async () => {
    // Ensure admin user exists and clean up old test data
    await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");
    await cleanupTestLeadsByEmail("pipeline_test@cyh.com");
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    await cleanupTestLeadsByEmail("pipeline_test@cyh.com");
  });

  test("Creating a lead and updating its commercial stage in pipeline", async ({ page }) => {
    // 1. Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Navigate to Leads list
    await page.goto("/crm/leads");

    // 3. Open New Lead Modal
    await page.click("button:has-text('Nuevo Lead')");

    // 4. Fill in the B2B Lead Form
    await page.fill("input[name='fullName']", "Pipeline Test Lead");
    await page.fill("input[name='companyName']", "Pipeline Test Company");
    await page.fill("input[name='email']", "pipeline_test@cyh.com");
    await page.fill("input[name='phone']", "3001234567");
    await page.fill("input[name='cargo']", "Jefe de Mantenimiento");
    await page.fill("input[name='city']", "Medellin");
    await page.fill("input[name='environmentType']", "Industrial");
    await page.fill("textarea", "Mantenimiento preventivo para 5 turbinas centrífugas.");

    // Submit Lead
    await page.click("button[type='submit']:has-text('Crear Lead')");

    // Wait for toast notification confirming success
    await expect(page.locator("div:has-text('Lead creado con éxito')").first()).toBeVisible();

    // Force reload page to bypass client-side router cache
    await page.reload();
    await page.waitForSelector("table");

    // 5. Verify it appears in the list table
    const leadRow = page.locator("tr:has-text('Pipeline Test Company')").first();
    await expect(leadRow).toBeVisible();

    // 6. Click on the lead to open 360° Drawer Details
    await leadRow.click();

    // 7. Verify the details drawer opens with correct title
    const drawerTitle = page.locator("h3:has-text('Pipeline Test Company')");
    await expect(drawerTitle).toBeVisible();

    // 8. Update stage to "Mesa Reunión" (reunion)
    const stageSelect = page.locator("label:has-text('Etapa Comercial') + select");
    await stageSelect.selectOption("reunion");

    // Check Toast notification confirming update
    const toast = page.locator("div:has-text('Etapa comercial actualizada')").last();
    await expect(toast).toBeVisible();

    // 9. Verify the database state updated correctly
    const [dbLead] = await sql`SELECT status FROM leads WHERE email = 'pipeline_test@cyh.com' LIMIT 1`;
    expect(dbLead.status).toBe("reunion");
  });
});
