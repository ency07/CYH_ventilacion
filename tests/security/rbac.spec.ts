import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("Security - RBAC Verification", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test("Blocking Login for Unprofiled Users", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "unprofiled@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Should remain on the login page
    await expect(page).toHaveURL(/\/login/);

    // Should display the Access Denied error alert
    const errorAlert = page.locator("div:has-text('Acceso Denegado')").first();
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Su usuario no está registrado en el sistema");
  });

  test("Blocking Access to Commercial Reports for Tecnico Role", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "tecnico@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Wait for redirect to technical dashboard
    await page.waitForURL("**/crm/dashboard/tecnico");

    // Intercept Server Action response for getReportsMetricsAction
    page.on("response", (response) => {
      if (response.url().includes("getReportsMetricsAction")) {
        expect(response.status()).toBe(403);
      }
    });

    // Try navigating to commercial reports page
    await page.goto("/crm/reportes");

    // Assert that the Restricted Access lock screen is visible in the UI
    const lockTitle = page.locator("h2:has-text('Acceso Restringido')");
    await expect(lockTitle).toBeVisible();
  });
});
