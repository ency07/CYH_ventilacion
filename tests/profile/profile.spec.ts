import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("User Profile Page Verification", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
    test.setTimeout(90000);
    
    // Log in as admin@cyh.com
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "AdminCYH2026*");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");
  });

  test("Should navigate to Profile and switch between tabs", async ({ page }) => {
    await page.goto("/crm/perfil");
    await expect(page).toHaveURL(/\/crm\/perfil/);

    // Verify header title
    await expect(page.locator("h1")).toContainText("PERFIL DE USUARIO");

    // Click "Editar Datos" tab
    await page.click("#perfil-tab-editar");
    await expect(page.locator("h2:has-text('Datos Personales')")).toBeVisible();

    // Click "Contraseña" tab
    await page.click("#perfil-tab-password");
    await expect(page.locator("h2:has-text('Cambiar Contraseña')")).toBeVisible();

    // Click "Historial" tab
    await page.click("#perfil-tab-historial");
    await expect(page.locator("h2:has-text('Historial de Actividad')")).toBeVisible();

    // Click "Preferencias" tab
    await page.click("#perfil-tab-preferencias");
    await expect(page.locator("h2:has-text('Apariencia')")).toBeVisible();
  });

  test("Should edit profile details and persist successfully", async ({ page }) => {
    await page.goto("/crm/perfil");
    await page.click("#perfil-tab-editar");

    // Modify profile fields
    const testSuffix = Math.floor(Math.random() * 1000).toString();
    const newName = `Admin Test ${testSuffix}`;
    const newPhone = `+57 300 123 ${testSuffix}`;
    const newPosition = `Developer ${testSuffix}`;

    await page.fill("#perfil-fullname", newName);
    await page.fill("#perfil-phone", newPhone);
    await page.fill("#perfil-position", newPosition);

    // Click save
    await page.click("#perfil-save-btn");

    // Toast notification confirmation
    const toast = page.locator("text=Perfil actualizado correctamente");
    await expect(toast).toBeVisible();

    // Reload page and check if updates are persisted
    await page.reload();
    await page.waitForURL("**/crm/perfil");

    // Check "Mi Perfil" tab details
    await page.click("#perfil-tab-perfil");
    await expect(page.locator("body")).toContainText(newName);
    await expect(page.locator("body")).toContainText(newPhone);
    await expect(page.locator("body")).toContainText(newPosition);
  });
});
