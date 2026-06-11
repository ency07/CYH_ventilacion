import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";

test.describe("Security - Tenant Isolation", () => {
  let vendedorAId: string;
  let vendedorBId: string;
  let customerAId: string;

  test.beforeAll(async () => {
    // 1. Ensure test vendedor users exist
    vendedorAId = await ensureTestUser("vendedora@cyh.com", "vendedor", "Vendedor A");
    vendedorBId = await ensureTestUser("vendedorb@cyh.com", "vendedor", "Vendedor B");

    // 2. Cleanup old test customers with this name
    const oldCusts = await sql`SELECT id FROM crm_customers WHERE name = 'Empresa Inquilina A'`;
    for (const c of oldCusts) {
      await sql`DELETE FROM crm_customer_plants WHERE customer_id = ${c.id}`;
      await sql`DELETE FROM crm_customer_contacts WHERE customer_id = ${c.id}`;
    }
    if (oldCusts.length > 0) {
      const ids = oldCusts.map(c => c.id);
      await sql`DELETE FROM crm_customers WHERE id = ANY(${ids})`;
    }

    // 3. Create a Customer assigned to Vendedor A
    const [custA] = await sql`
      INSERT INTO crm_customers (
        name, nit, status, ltv, assigned_to, recurrence_index
      ) VALUES (
        'Empresa Inquilina A', '800.123.456-1', 'activo', 15000000, 'vendedora@cyh.com', 85
      ) RETURNING id
    `;
    customerAId = custA.id;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    // Cleanup created customer
    await sql`DELETE FROM crm_customer_plants WHERE customer_id = ${customerAId}`;
    await sql`DELETE FROM crm_customer_contacts WHERE customer_id = ${customerAId}`;
    await sql`DELETE FROM crm_customers WHERE id = ${customerAId}`;
  });

  test("Vendedor B cannot view Customer A assigned to Vendedor A", async ({ page }) => {
    // 1. Login as Vendedor B
    await page.goto("/login");
    await page.fill('input[name="email"]', "vendedorb@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Wait for redirect to CRM pipeline page
    await page.waitForURL("**/crm/pipeline");

    // 2. Try to view Customer A details directly
    await page.goto(`/crm/clientes/${customerAId}`);

    // 3. Verify it redirects back to list with unauthorized error query param
    await page.waitForURL("**/crm/clientes?error=unauthorized");

    // 4. Assert URL query params matching
    const url = page.url();
    expect(url).toContain("error=unauthorized");
  });
});
