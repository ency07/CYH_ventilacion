import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";

test.describe("Industrial Operations System (IOS) - End-to-End Traceability", () => {
  let clientId: string;
  let adminId: string;
  const customerId = "a1111111-1111-1111-1111-111111111111";
  const plantId = "b1111111-1111-1111-1111-111111111111";
  const assetId = "c1111111-1111-1111-1111-111111111111";
  const invoiceId = "d1111111-1111-1111-1111-111111111111";
  const warRoomId = "e1111111-1111-1111-1111-111111111111";
  const serviceRequestId = "f1111111-1111-1111-1111-111111111111";

  test.beforeAll(async () => {
    // 1. Ensure test users exist
    clientId = await ensureTestUser("iosclient@cyh.com", "cliente", "IOS Test Client");
    adminId = await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");

    // 2. Clean up any existing records
    await sql`DELETE FROM crm_electronic_signatures WHERE entity_id = ${customerId}`;
    await sql`DELETE FROM crm_war_room_timeline WHERE war_room_id = ${warRoomId}`;
    await sql`DELETE FROM crm_emergency_war_rooms WHERE id = ${warRoomId}`;
    await sql`DELETE FROM crm_payments WHERE invoice_id = ${invoiceId}`;
    await sql`DELETE FROM crm_accounts_receivable WHERE invoice_id = ${invoiceId}`;
    await sql`DELETE FROM crm_invoices WHERE id = ${invoiceId}`;
    await sql`DELETE FROM crm_work_orders WHERE asset_id = ${assetId}`;
    await sql`DELETE FROM crm_maintenance_plans WHERE asset_id = ${assetId}`;
    await sql`DELETE FROM crm_assets WHERE id = ${assetId}`;
    await sql`DELETE FROM crm_ticket_comments WHERE request_id = ${serviceRequestId}`;
    await sql`DELETE FROM crm_service_requests WHERE id = ${serviceRequestId}`;
    await sql`DELETE FROM crm_customer_plants WHERE id = ${plantId}`;
    await sql`DELETE FROM crm_customer_contacts WHERE customer_id = ${customerId}`;
    await sql`DELETE FROM crm_customers WHERE id = ${customerId}`;

    // 3. Seed B2B Customer hierarchy
    await sql`
      INSERT INTO crm_customers (id, name, nit, status, ltv, assigned_to, recurrence_index, owner_id)
      VALUES (${customerId}, 'IOS Test Corporation', '900.888.777-6', 'activo', 250000000, 'admin@cyh.com', 95, ${adminId})
    `;

    await sql`
      INSERT INTO crm_customer_contacts (customer_id, full_name, cargo, phone, email, user_id)
      VALUES (${customerId}, 'IOS Test Client', 'Director de Planta', '+573151112233', 'iosclient@cyh.com', ${clientId})
    `;

    await sql`
      INSERT INTO crm_customer_plants (id, customer_id, name, city, address, airflow_cfm)
      VALUES (${plantId}, ${customerId}, 'Planta IOS Central', 'Barranquilla', 'Vía Industrial 4.0', 250000)
    `;

    // 4. Seed asset for CMMS
    await sql`
      INSERT INTO crm_assets (id, plant_id, name, code, operating_hours, status)
      VALUES (${assetId}, ${plantId}, 'Extractor Turbocentrífugo AX-500', 'CYH-AX-500', 1200, 'operativo')
    `;

    // 5. Seed maintenance plan
    await sql`
      INSERT INTO crm_maintenance_plans (asset_id, title, interval_hours, description)
      VALUES (${assetId}, 'Cambio de Rodamientos y Aspas', 2000, 'Reemplazo preventivo periódico de rodamientos de alta velocidad')
    `;

    // 6. Seed service request
    await sql`
      INSERT INTO crm_service_requests (id, customer_id, plant_id, title, description, urgency, status, created_by)
      VALUES (${serviceRequestId}, ${customerId}, ${plantId}, 'Fuga de lubricante AX-500', 'Presenta goteo en retén primario', 'alta', 'abierta', ${clientId})
    `;

    // 7. Seed invoice for Finanzas view
    await sql`
      INSERT INTO crm_invoices (id, customer_id, invoice_number, amount, status, due_date, engineering_status, procurement_status, finance_status)
      VALUES (${invoiceId}, ${customerId}, 'CYH-INV-2026-99', 12500000, 'pending', NOW() + INTERVAL '10 days', 'approved', 'approved', 'approved')
    `;

    await sql`
      INSERT INTO crm_accounts_receivable (customer_id, invoice_id, outstanding_balance, days_past_due, collection_status)
      VALUES (${customerId}, ${invoiceId}, 12500000, 0, 'normal')
    `;

    // 8. Seed Emergency War Room
    await sql`
      INSERT INTO crm_emergency_war_rooms (id, request_id, incident_code, status, leader_id, responsible_id, approver_id)
      VALUES (${warRoomId}, ${serviceRequestId}, 'WR-2026-AX500', 'activo', ${adminId}, ${adminId}, ${adminId})
    `;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    // Cleanup seeded records to maintain clean test DB state
    await sql`DELETE FROM crm_electronic_signatures WHERE entity_id = ${customerId}`;
    await sql`DELETE FROM crm_war_room_timeline WHERE war_room_id = ${warRoomId}`;
    await sql`DELETE FROM crm_emergency_war_rooms WHERE id = ${warRoomId}`;
    await sql`DELETE FROM crm_payments WHERE invoice_id = ${invoiceId}`;
    await sql`DELETE FROM crm_accounts_receivable WHERE invoice_id = ${invoiceId}`;
    await sql`DELETE FROM crm_invoices WHERE id = ${invoiceId}`;
    await sql`DELETE FROM crm_work_orders WHERE asset_id = ${assetId}`;
    await sql`DELETE FROM crm_maintenance_plans WHERE asset_id = ${assetId}`;
    await sql`DELETE FROM crm_assets WHERE id = ${assetId}`;
    await sql`DELETE FROM crm_ticket_comments WHERE request_id = ${serviceRequestId}`;
    await sql`DELETE FROM crm_service_requests WHERE id = ${serviceRequestId}`;
    await sql`DELETE FROM crm_customer_plants WHERE id = ${plantId}`;
    await sql`DELETE FROM crm_customer_contacts WHERE customer_id = ${customerId}`;
    await sql`DELETE FROM crm_customers WHERE id = ${customerId}`;
  });

  test("Verify B2B Customer Portal - Tab navigation, asset operating hours increment, and Wompi simulated payment", async ({ page }) => {
    // 1. Log in as Customer
    await page.goto("/login?from=portal");
    await page.fill('input[name="email"]', "iosclient@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/portal/inicio");

    // Verify header and page content loads correctly
    await expect(page.locator("h2:has-text('Planta IOS Central')")).toBeVisible();

    // 2. Equipos Tab: operating hours increment
    await page.click("button:has-text('Equipos')");
    await expect(page.locator("span:has-text('CYH-AX-500')").first()).toBeVisible();
    await expect(page.locator(":has-text('1.200 hrs')").first()).toBeVisible();

    // Click increment hours button
    await page.click("button:has-text('Simular Uso')");
    // Verify hours updated on table
    await expect(page.locator(":has-text('1.300 hrs')").first()).toBeVisible({ timeout: 10000 });

    // 3. Finanzas Tab: simulated PSE invoice payment
    await page.click("button:has-text('Finanzas & Cartera')");
    await expect(page.locator("td:has-text('CYH-INV-2026-99')")).toBeVisible();
    await expect(page.locator("span:has-text('Pendiente')").first()).toBeVisible();

    // Click mock checkout payment button
    await page.click("button:has-text('Simular Pago PSE')");
    // Wait for confirmation that transaction completed
    await expect(page.locator("span:has-text('procesado correctamente')").first()).toBeVisible({ timeout: 10000 });

    // Verify invoice status updated on screen
    await expect(page.locator("span:has-text('Pagada')").first()).toBeVisible({ timeout: 10000 });
  });

  test("Verify Internal Operations Dashboard (/ops)", async ({ page }) => {
    // 1. Log in as Admin
    await page.goto("/login?from=crm");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Go to Operations Dashboard
    await page.goto("/ops");
    await expect(page.locator("h1:has-text('Centro de Control de Operaciones (IOS)')")).toBeVisible();

    // Check stats are rendered
    await expect(page.locator("span:has-text('Total Activos Monitoreados')")).toBeVisible();
    await expect(page.locator("td:has-text('CYH-AX-500')")).toBeVisible();
  });

  test("Verify Executive Governance Dashboard (/management)", async ({ page }) => {
    // 1. Log in as Admin
    await page.goto("/login?from=crm");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Go to Management Dashboard
    await page.goto("/management");
    await expect(page.locator("h1:has-text('Gobernanza Corporativa & BI (CYH OS)')")).toBeVisible();

    // Verify KPIs
    await expect(page.locator("span:has-text('LTV Acumulado')")).toBeVisible();
    await expect(page.locator("span:has-text('Índice de Recurrencia Promedio')")).toBeVisible();
  });

  test("Verify Emergency War Room View (/portal/war-room/[code])", async ({ page }) => {
    // 1. Log in as Admin
    await page.goto("/login?from=crm");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Navigate to war room URL directly
    await page.goto(`/portal/war-room/WR-2026-AX500`);
    await expect(page.locator("h1:has-text('SALA DE EMERGENCIA CRÍTICA (WAR ROOM)')")).toBeVisible();

    // Check RACI table elements are visible
    await expect(page.locator("span:has-text('Leader (L)')")).toBeVisible();
    await expect(page.locator("span:has-text('CYH Super Admin')").first()).toBeVisible();

    // Post an event to the timeline
    await page.fill("textarea", "Verificado goteo del motor primario. Se procede a solicitar repuesto.");
    await page.click("button:has-text('Registrar Suceso')");

    // Verify timeline updates
    await expect(page.locator("p:has-text('Verificado goteo del motor primario')")).toBeVisible({ timeout: 10000 });
  });
});

