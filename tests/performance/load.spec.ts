import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";

test.describe("Performance - Load Testing", () => {
  let adminUserId: string;

  test.beforeAll(async () => {
    adminUserId = await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");
    // Initial cleanup
    await sql`DELETE FROM leads WHERE email LIKE 'perf_%'`;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);

    // Login once
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");
  });

  test.afterEach(async () => {
    // Cleanup any created performance test records
    await sql`DELETE FROM leads WHERE email LIKE 'perf_%'`;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM leads WHERE email LIKE 'perf_%'`;
  });

  async function seedBulkLeads(count: number) {
    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        full_name: `Perf User ${i}`,
        company_name: `Perf Company ${i}`,
        email: `perf_${i}@cyh.com`,
        phone: `3001234567`,
        city: `Medellin`,
        service_type: `mantenimiento`,
        environment_type: `industrial`,
        urgency_level: `media`,
        status: `nuevo`,
        created_by: adminUserId
      });
    }
    
    // Chunk insert (500 rows max per query) to avoid PgBouncer parameter/statement length limits
    const chunkSize = 500;
    for (let j = 0; j < rows.length; j += chunkSize) {
      const chunk = rows.slice(j, j + chunkSize);
      await sql`
        INSERT INTO leads ${sql(
          chunk,
          "full_name",
          "company_name",
          "email",
          "phone",
          "city",
          "service_type",
          "environment_type",
          "urgency_level",
          "status",
          "created_by"
        )}
      `;
    }
  }

  test("Performance with 500 Leads", async ({ page }) => {
    console.log("Seeding 500 leads...");
    await seedBulkLeads(500);

    const start = performance.now();
    await page.goto(`/crm/leads?t=${Date.now()}`);
    await page.waitForSelector("table");
    await expect(page.locator("tbody tr").nth(499)).toBeVisible({ timeout: 10000 });
    const end = performance.now();

    const duration = end - start;
    console.log(`Load time with 500 leads: ${duration.toFixed(2)}ms`);

    // Verify page rendered rows
    const rowsCount = await page.locator("tbody tr").count();
    expect(rowsCount).toBeGreaterThanOrEqual(500);

    // Expect acceptable rendering time (< 5 seconds)
    expect(duration).toBeLessThan(5000);
  });

  test("Performance with 1000 Leads", async ({ page }) => {
    console.log("Seeding 1000 leads...");
    await seedBulkLeads(1000);

    const start = performance.now();
    await page.goto(`/crm/leads?t=${Date.now()}`);
    await page.waitForSelector("table");
    await expect(page.locator("tbody tr").nth(999)).toBeVisible({ timeout: 15000 });
    const end = performance.now();

    const duration = end - start;
    console.log(`Load time with 1000 leads: ${duration.toFixed(2)}ms`);

    const rowsCount = await page.locator("tbody tr").count();
    expect(rowsCount).toBeGreaterThanOrEqual(1000);

    expect(duration).toBeLessThan(7000);
  });

  test("Performance with 5000 Leads", async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for large render
    console.log("Seeding 5000 leads...");
    await seedBulkLeads(5000);

    const start = performance.now();
    await page.goto(`/crm/leads?t=${Date.now()}`);
    await page.waitForSelector("table");
    await expect(page.locator("tbody tr").nth(4999)).toBeVisible({ timeout: 25000 });
    const end = performance.now();

    const duration = end - start;
    console.log(`Load time with 5000 leads: ${duration.toFixed(2)}ms`);

    const rowsCount = await page.locator("tbody tr").count();
    expect(rowsCount).toBeGreaterThanOrEqual(5000);

    expect(duration).toBeLessThan(15000);
  });
});
