import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";
import fs from "fs";
import path from "path";

// Load server action hashes dynamically
const actionHashesPath = path.join(__dirname, "../../scratch/action_hashes.json");
let actionHashes: Record<string, string> = {};

try {
  actionHashes = JSON.parse(fs.readFileSync(actionHashesPath, "utf8"));
} catch (e) {
  console.error("Warning: could not read action_hashes.json", e);
}

test.describe("Security - B2B Portal Isolation and Server Actions API", () => {
  let clientAId: string;
  let clientBId: string;

  let leadAId: string;
  let leadBId: string;

  let diagnosticBId: string;
  let opportunityBId: string;
  let proposalBId: string;
  let taskBId: string;
  let documentBId: string;

  test.beforeAll(async () => {
    // 1. Ensure test users exist with role 'cliente'
    clientAId = await ensureTestUser("clienta@cyh.com", "cliente", "Client A");
    clientBId = await ensureTestUser("clientb@cyh.com", "cliente", "Client B");

    // 2. Clean up previous records for these test emails
    const testLeads = await sql`SELECT id FROM leads WHERE email IN ('clienta@cyh.com', 'clientb@cyh.com')`;
    if (testLeads.length > 0) {
      const leadIds = testLeads.map(l => l.id);
      await sql`DELETE FROM crm_pipeline WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_opportunities WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_proposals WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_tasks WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_documents WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM diagnostic_reports WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM leads WHERE id = ANY(${leadIds})`;
    }

    // 3. Create Lead A owned by Client A
    const [leadA] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Lead Cliente A', 'Empresa Cliente A', 'clienta@cyh.com', '+573001112222', 'Barranquilla', 'mantenimiento', 'industrial', 'media', 'nuevo', ${clientAId}
      ) RETURNING id
    `;
    leadAId = leadA.id;

    // 4. Create Lead B owned by Client B
    const [leadB] = await sql`
      INSERT INTO leads (
        full_name, company_name, email, phone, city, service_type, environment_type, urgency_level, status, created_by
      ) VALUES (
        'Lead Cliente B', 'Empresa Cliente B', 'clientb@cyh.com', '+573003334444', 'Bogota', 'mantenimiento', 'industrial', 'media', 'nuevo', ${clientBId}
      ) RETURNING id
    `;
    leadBId = leadB.id;

    // 5. Create Diagnostic B for Lead B
    const [diagnosticB] = await sql`
      INSERT INTO diagnostic_reports (
        lead_id, airflow, dimensions, status, technical_observations, material_suggestions, recommendations, inspection_protocol, generated_pdf_url
      ) VALUES (
        ${leadBId}, 1200, '{"width": 10, "length": 15, "height": 4}'::jsonb, 'completado', 'Observaciones B', 'Sugerencias B', 'Recomendaciones B', 'Protocolo B', 'https://soqjlmnphdubaxvhfvpj.supabase.co/storage/v1/object/public/pdfs/reports/test_report_b.pdf'
      ) RETURNING id
    `;
    diagnosticBId = diagnosticB.id;

    // 6. Create Opportunity B for Lead B
    const [opportunityB] = await sql`
      INSERT INTO crm_opportunities (
        lead_id, diagnostic_id, title, service_type, estimated_value, probability, weighted_value, stage, assigned_to
      ) VALUES (
        ${leadBId}, ${diagnosticBId}, 'Proyecto Climatizacion - Empresa B', 'mantenimiento', 50000000, 50, 25000000, 'propuesta', 'comercial@cyh.com'
      ) RETURNING id
    `;
    opportunityBId = opportunityB.id;

    // 7. Create Proposal B for Lead B
    const [proposalB] = await sql`
      INSERT INTO crm_proposals (
        lead_id, diagnostic_id, title, total_value, currency, status, pdf_url, created_by
      ) VALUES (
        ${leadBId}, ${diagnosticBId}, 'Propuesta Comercial B', 48000000, 'COP', 'enviada', 'https://soqjlmnphdubaxvhfvpj.supabase.co/storage/v1/object/public/pdfs/proposals/proposal_b.pdf', ${clientBId}
      ) RETURNING id
    `;
    proposalBId = proposalB.id;

    // 8. Create Task B for Lead B
    const [taskB] = await sql`
      INSERT INTO crm_tasks (
        lead_id, task_type, due_date, assigned_to, notes, status
      ) VALUES (
        ${leadBId}, 'Visita Técnica Preventiva', NOW() + INTERVAL '2 days', 'comercial@cyh.com', 'Revisión técnica de ductos para Cliente B', 'pendiente'
      ) RETURNING id
    `;
    taskBId = taskB.id;

    // 9. Create Document B for Lead B
    const [documentB] = await sql`
      INSERT INTO crm_documents (
        lead_id, file_name, file_url, file_type
      ) VALUES (
        ${leadBId}, 'Plano_AsBuilt_B.pdf', 'https://soqjlmnphdubaxvhfvpj.supabase.co/storage/v1/object/public/pdfs/documents/plano_b.pdf', 'pdf'
      ) RETURNING id
    `;
    documentBId = documentB.id;
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test.afterAll(async () => {
    // Clean up created entities
    const leadIds = [leadAId, leadBId].filter(Boolean);
    if (leadIds.length > 0) {
      await sql`DELETE FROM crm_pipeline WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_opportunities WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_proposals WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_tasks WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM crm_documents WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM diagnostic_reports WHERE lead_id = ANY(${leadIds})`;
      await sql`DELETE FROM leads WHERE id = ANY(${leadIds})`;
    }
  });

  test.describe("Frontend Navigation Isolation Checks", () => {
    test.beforeEach(async ({ page }) => {
      // Login as Client A
      await page.goto("/login");
      await page.fill('input[name="email"]', "clienta@cyh.com");
      await page.fill('input[name="password"]', "CYH123456!");
      await page.click('button:has-text("Ingresar")');
      await page.waitForURL("**/portal/inicio");
    });

    test("Client A navigating to Lead B is blocked and redirected", async ({ page }) => {
      await page.goto(`/crm/${leadBId}`);
      await page.waitForURL("**/portal/inicio");
      expect(page.url()).toContain("/portal/inicio");
    });

    test("Client A navigating to Proposal B is blocked and redirected", async ({ page }) => {
      await page.goto(`/crm/propuestas/${proposalBId}`);
      await page.waitForURL("**/portal/inicio");
      expect(page.url()).toContain("/portal/inicio");
    });

    test("Client A navigating to Opportunity B is blocked and redirected", async ({ page }) => {
      await page.goto(`/crm/oportunidades/${opportunityBId}`);
      await page.waitForURL("**/portal/inicio");
      expect(page.url()).toContain("/portal/inicio");
    });

    test("Client A navigating to general CRM Tasks list is blocked and redirected", async ({ page }) => {
      await page.goto("/crm/tareas");
      await page.waitForURL("**/portal/inicio");
      expect(page.url()).toContain("/portal/inicio");
    });

    test("Client A navigating to general CRM Reports list is blocked and redirected", async ({ page }) => {
      await page.goto("/crm/reportes");
      await page.waitForURL("**/portal/inicio");
      expect(page.url()).toContain("/portal/inicio");
    });
  });

  test.describe("Direct Server Actions API Checks", () => {
    test.beforeEach(async ({ page }) => {
      // Login as Client A to establish session cookies in page context
      await page.goto("/login");
      await page.fill('input[name="email"]', "clienta@cyh.com");
      await page.fill('input[name="password"]', "CYH123456!");
      await page.click('button:has-text("Ingresar")');
      await page.waitForURL("**/portal/inicio");
    });

    test("API - getLeadByIdAction fails on Client B Lead", async ({ page, context }) => {
      const actionId = actionHashes.getLeadByIdAction;
      expect(actionId).toBeDefined();

      const response = await context.request.post("/portal/inicio", {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify([leadBId]),
      });

      const bodyText = await response.text();
      expect(bodyText).toContain("Este lead pertenece a otro cliente.");
    });

    test("API - getDiagnosticByLeadIdAction fails on Client B Lead", async ({ page, context }) => {
      const actionId = actionHashes.getDiagnosticByLeadIdAction;
      expect(actionId).toBeDefined();

      const response = await context.request.post("/portal/inicio", {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify([leadBId]),
      });

      const bodyText = await response.text();
      expect(bodyText).toContain("Acceso denegado: Recurso no pertenece a su cuenta.");
    });

    test("API - updateProposalStatusAction is rejected for Client role", async ({ page, context }) => {
      const actionId = actionHashes.updateProposalStatusAction;
      expect(actionId).toBeDefined();

      const response = await context.request.post("/portal/inicio", {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify([proposalBId, "aceptada"]),
      });

      const bodyText = await response.text();
      expect(
        bodyText.includes("Acceso Denegado") ||
        bodyText.includes("denegado") ||
        response.status() === 500 ||
        response.status() === 403
      ).toBe(true);
    });

    test("API - updateTaskStatusAction is rejected for Client role", async ({ page, context }) => {
      const actionId = actionHashes.updateTaskStatusAction;
      expect(actionId).toBeDefined();

      const response = await context.request.post("/portal/inicio", {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify([taskBId, "completado"]),
      });

      const bodyText = await response.text();
      expect(
        bodyText.includes("Acceso Denegado") ||
        bodyText.includes("denegado") ||
        response.status() === 500 ||
        response.status() === 403
      ).toBe(true);
    });

    test("API - getReportsMetricsAction is rejected for Client role", async ({ page, context }) => {
      const actionId = actionHashes.getReportsMetricsAction;
      expect(actionId).toBeDefined();

      const response = await context.request.post("/portal/inicio", {
        headers: {
          "next-action": actionId,
          "content-type": "text/plain;charset=UTF-8",
          "accept": "text/x-component",
        },
        data: JSON.stringify(["30dias"]),
      });

      const bodyText = await response.text();
      expect(
        bodyText.includes("Acceso Denegado") ||
        bodyText.includes("denegado") ||
        response.status() === 500 ||
        response.status() === 403
      ).toBe(true);
    });
  });
});
