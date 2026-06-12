import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("Critical Accounts Authentication Tests", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
    test.setTimeout(90000);
  });

  test("Admin account (admin@cyh.com) can log in and out successfully", async ({ page }) => {
    await page.goto("/login");

    // Fill credentials
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "AdminCYH2026*");
    await page.click('button:has-text("Ingresar")');

    // Should redirect to CRM dashboard
    await page.waitForURL("**/crm/dashboard");
    await expect(page).toHaveURL(/\/crm\/dashboard/);

    // Verify user info is visible (e.g., name or initials)
    await expect(page.locator("body")).toContainText("CYH Super Admin");

    // Perform logout
    // Locate logout button (let's check CrmShell for where the logout button is)
    // Wait, let's find the logout button in the CRM UI
    const logoutBtn = page.locator('button:has-text("Cerrar Sesión"), button[title="Cerrar sesión"], button:has-text("Salir")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Look for the user profile dropdown trigger
      const avatarBtn = page.locator('button[aria-label="Menú de usuario"], button:has-text("CYH")').first();
      if (await avatarBtn.isVisible()) {
        await avatarBtn.click();
        await page.locator('button:has-text("Cerrar Sesión")').first().click();
      }
    }

    // Verify redirected back to login
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Gedeón root account (gedeon07@gmail.com) can log in successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "gedeon07@gmail.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Should redirect to CRM dashboard
    await page.waitForURL("**/crm/dashboard");
    await expect(page).toHaveURL(/\/crm\/dashboard/);

    // Verify user info is visible
    await expect(page.locator("body")).toContainText("Gedeón");
  });

  test("Client test account (cliente.prueba@cyh.com) can log in and gets redirected to Portal", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "cliente.prueba@cyh.com");
    await page.fill('input[name="password"]', "ClienteCYH2026*");
    await page.click('button:has-text("Ingresar")');

    // Should redirect to customer portal
    await page.waitForURL("**/portal/inicio");
    await expect(page).toHaveURL(/\/portal\/inicio/);
    
    // Verify greeting or customer info
    await expect(page.locator("body")).toContainText("Cliente de Prueba");
  });
});
