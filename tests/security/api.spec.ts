import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, cleanupTestLeadsByEmail, sql } from "../helpers/db";

test.describe("Security - Server Actions API Verification", () => {
  let adminUserId: string;
  let clientAId: string;
  let clientBId: string;
  let leadAId: string;
  let dummyLeadId: string;
  
  let getLeadActionId: string | null = null;
  let updateStatusActionId: string | null = null;

  test.beforeAll(async () => {
    // 1. Setup users & clean old records
    adminUserId = await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");
    clientAId = await ensureTestUser("clienta@cyh.com", "cliente", "Client A");
    clientBId = await ensureTestUser("clientb@cyh.com", "cliente", "Client B");

    await cleanupTestLeadsByEmail("clienta@cyh.com");
    await cleanupTestLeadsByEmail("client_api@cyh.com");

    // 2. Create lead for Client A (ID-linked)
    const [leadA] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Lead de A', 'Empresa A', 'clienta@cyh.com', '+573001234567', 'Barranquilla', 'mantenimiento', 'industrial', 'media', 'nuevo', ${clientAId}
      ) RETURNING id
    `;
    leadAId = leadA.id;

    // Create a dummy lead for capturing action hashes
    const [dummyLead] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Dummy API Lead', 'Dummy API Company', 'client_api@cyh.com', '+573001234568', 'Bogota', 'mantenimiento', 'industrial', 'media', 'nuevo', ${adminUserId}
      ) RETURNING id
    `;
    dummyLeadId = dummyLead.id;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    await cleanupTestLeadsByEmail("clienta@cyh.com");
    await cleanupTestLeadsByEmail("client_api@cyh.com");
  });

  test("Capture Server Action hashes dynamically", async ({ page }) => {
    // Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    await page.goto("/crm/leads");

    // Capture the getLeadByIdAction ID
    const getLeadRequestPromise = page.waitForRequest(req => {
      const actionHeader = req.headers()["next-action"];
      return !!actionHeader && req.method() === "POST";
    });
    
    // Click dummy lead to trigger details fetch
    await page.click(`tr:has-text('Dummy API Lead')`);
    
    const getLeadReq = await getLeadRequestPromise;
    getLeadActionId = getLeadReq.headers()["next-action"]!;
    expect(getLeadActionId).toBeDefined();
    console.log("Captured getLeadByIdAction ID:", getLeadActionId);

    // Capture the updateLeadStatusAction ID
    const updateStatusRequestPromise = page.waitForRequest(req => {
      const actionHeader = req.headers()["next-action"];
      return !!actionHeader && req.method() === "POST" && actionHeader !== getLeadActionId;
    });

    // Toggle stage select
    const stageSelect = page.locator("label:has-text('Etapa Comercial') + select");
    await stageSelect.selectOption("contacto");

    const updateStatusReq = await updateStatusRequestPromise;
    updateStatusActionId = updateStatusReq.headers()["next-action"]!;
    expect(updateStatusActionId).toBeDefined();
    console.log("Captured updateLeadStatusAction ID:", updateStatusActionId);
  });

  test("API - POST request without session (no authentication) is rejected", async ({ playwright }) => {
    expect(getLeadActionId).not.toBeNull();
    
    // Create an unauthenticated request context
    const apiRequest = await playwright.request.newContext();
    const response = await apiRequest.post("/crm/leads", {
      headers: {
        "next-action": getLeadActionId!,
        "content-type": "text/plain;charset=UTF-8",
        "accept": "text/x-component",
      },
      data: JSON.stringify([leadAId]),
    });

    const bodyText = await response.text();
    // Rejection should return redirect headers or throws "No autenticado"
    expect(response.status() === 303 || bodyText.includes("No autenticado") || bodyText.includes("login")).toBe(true);
  });

  test("API - POST request with incorrect role (unauthorized) is rejected", async ({ page, context }) => {
    expect(updateStatusActionId).not.toBeNull();

    // Login as técnico (low-privilege)
    await page.goto("/login");
    await page.fill('input[name="email"]', "tecnico@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard/tecnico");

    // Use current page cookies for POST request
    const response = await context.request.post("/crm/leads", {
      headers: {
        "next-action": updateStatusActionId!,
        "content-type": "text/plain;charset=UTF-8",
        "accept": "text/x-component",
      },
      data: JSON.stringify([leadAId, "ganado"]),
    });

    const bodyText = await response.text();
    // Must return Acceso Denegado
    expect(bodyText.includes("Acceso Denegado") || bodyText.includes("denegado") || response.status() === 403).toBe(true);
  });

  test("API - POST request with altered payload (invalid data) returns validation error", async ({ page, context }) => {
    expect(updateStatusActionId).not.toBeNull();

    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // Send invalid stage payload "garbage_stage"
    const response = await context.request.post("/crm/leads", {
      headers: {
        "next-action": updateStatusActionId!,
        "content-type": "text/plain;charset=UTF-8",
        "accept": "text/x-component",
      },
      data: JSON.stringify([leadAId, "garbage_stage"]),
    });

    const bodyText = await response.text();
    expect(bodyText.includes("Etapa comercial inválida.")).toBe(true);
  });

  test("API - POST request with non-existent UUID fails cleanly", async ({ page, context }) => {
    expect(getLeadActionId).not.toBeNull();

    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    const response = await context.request.post("/crm/leads", {
      headers: {
        "next-action": getLeadActionId!,
        "content-type": "text/plain;charset=UTF-8",
        "accept": "text/x-component",
      },
      data: JSON.stringify(["00000000-0000-0000-0000-000000000000"]),
    });

    const bodyText = await response.text();
    expect(bodyText.includes("Lead no encontrado.") || bodyText.includes("Formato de ID inválido.")).toBe(true);
  });

  test("API - POST request with UUID belonging to another tenant/client returns IDOR access denied", async ({ page, context }) => {
    expect(getLeadActionId).not.toBeNull();

    // Log in as Client B
    await page.goto("/login");
    await page.fill('input[name="email"]', "clientb@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/portal/inicio");

    // Client B attempts to direct-fetch Client A's Lead ID
    const response = await context.request.post("/crm/leads", {
      headers: {
        "next-action": getLeadActionId!,
        "content-type": "text/plain;charset=UTF-8",
        "accept": "text/x-component",
      },
      data: JSON.stringify([leadAId]),
    });

    const bodyText = await response.text();
    expect(bodyText.includes("Este lead pertenece a otro cliente.") || bodyText.includes("Acceso denegado")).toBe(true);
  });
});
