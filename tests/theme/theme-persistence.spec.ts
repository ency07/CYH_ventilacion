import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("Theme Persistence Verification", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test("Theme toggling, persistence on refresh, logout, and cross-navigation", async ({ page }) => {
    // 1. Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "AdminCYH2026*");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Locate theme toggle button in CRM shell and toggle it to dark
    const toggleBtn = page.locator("#crm-theme-toggle");
    await expect(toggleBtn).toBeVisible();

    // Reset theme to light first to make the test deterministic
    let htmlClass = await page.locator("html").getAttribute("class");
    if (htmlClass?.includes("dark")) {
      await toggleBtn.click();
      await page.waitForTimeout(500); // Wait for transition
    }
    
    // Now toggle to dark
    await toggleBtn.click();
    await page.waitForTimeout(500); // Wait for transition
    await expect(page.locator("html")).toHaveClass(/dark/);

    // 3. Persist after refresh
    await page.reload();
    await page.waitForURL("**/crm/dashboard");
    await expect(page.locator("html")).toHaveClass(/dark/);

    // 4. Persist after logout and login again
    const logoutBtn = page.locator('button:has-text("Cerrar Sesión"), button[title="Cerrar sesión"], button:has-text("Salir")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      const avatarBtn = page.locator('button[aria-label="Menú de usuario"], button:has-text("CYH")').first();
      await avatarBtn.click();
      await page.locator('button:has-text("Cerrar Sesión")').first().click();
    }
    await page.waitForURL("**/login");

    // Log in again
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "AdminCYH2026*");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // Theme should still be dark
    await expect(page.locator("html")).toHaveClass(/dark/);

    // 5. Change theme from Profile Preferences page
    await page.goto("/crm/perfil");
    await page.click("#perfil-tab-preferencias");
    
    const lightBtn = page.locator("#theme-btn-light");
    await expect(lightBtn).toBeVisible();
    await lightBtn.click();
    await page.waitForTimeout(500);
    
    // Theme should now be light
    await expect(page.locator("html")).toHaveClass(/light/);

    // 6. Cross-context validation: Navigate to Public Web (/)
    await page.goto("/");
    // Theme should persist as light on public pages
    await expect(page.locator("html")).toHaveClass(/light/);

    // Use navbar theme toggle on public web to change back to dark
    const webToggle = page.locator('button[aria-label="Cambiar tema"]');
    await expect(webToggle).toBeVisible();
    await webToggle.click();
    await page.waitForTimeout(500);
    
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Go back to CRM and verify it is dark
    await page.goto("/crm/dashboard");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
