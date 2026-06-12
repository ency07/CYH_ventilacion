import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("Branding and Whitelabel Persistence Verification", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });

  test("Should modify company name and colors, check preview, save, persist on refresh/re-login, and reset", async ({ page }) => {
    test.setTimeout(90000); // Allow up to 90 seconds for heavy compilation and page transitions
    // 1. Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "AdminCYH2026*");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 2. Navigate to Whitelabel configuration page
    await page.goto("/crm/configuracion");
    await page.waitForSelector('h1:has-text("Configuración & Whitelabel")');

    // 3. Edit company name
    const companyInput = page.locator('label:has-text("Razón Social") + input, input[value="CYH Ventilación"]').first();
    await expect(companyInput).toBeVisible();
    await expect(companyInput).not.toHaveValue("");
    await companyInput.fill("CYH Industrial Corporation");

    // 4. Change tab to Colores Corporativos
    await page.click('button:has-text("Colores Corporativos")');
    await page.waitForTimeout(300);

    // 5. Select color preset (Siemens Dark)
    const siemensDarkPreset = page.locator('button:has-text("Siemens Dark")');
    await expect(siemensDarkPreset).toBeVisible();
    await siemensDarkPreset.click();
    await page.waitForTimeout(300);

    // 6. Check live preview updates (CRM preview title and button color)
    const previewCrmTitle = page.locator('span:has-text("CYH Industrial Corporation")');
    await expect(previewCrmTitle).toBeVisible();

    // 7. Change tab back to Datos Empresa to click save (since save button is not on seguridad/media/catalog)
    await page.click('button:has-text("Datos Empresa")');
    await page.waitForTimeout(300);

    // 8. Click save Whitelabel Config
    const saveBtn = page.locator('button:has-text("Guardar Whitelabel Config")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 9. Wait for success toast / alert
    await page.waitForSelector('div:has-text("global de marca e IAM guardada")');

    // 10. Refresh page to verify persistence
    await page.reload();
    await page.waitForURL("**/crm/configuracion");
    
    // Check that company name persisted
    const companyInputAfterRefresh = page.locator('label:has-text("Razón Social") + input').first();
    await expect(companyInputAfterRefresh).toHaveValue("CYH Industrial Corporation");

    // Check that the sidebar title has updated too (global layout revalidation)
    const sidebarTitle = page.locator('span:has-text("CYH Industrial Corporation")').first();
    await expect(sidebarTitle).toBeVisible();

    // 11. Navigate to Catalog tab and open Modal to ensure it loads
    await page.click('button:has-text("Catálogo Equipos")');
    await page.waitForTimeout(1000); // Wait for items load
    
    const registerBtn = page.locator('button:has-text("Registrar Equipo")');
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Verify modal is visible
    const modalTitle = page.getByText("[Registrar] Nuevo Equipo en Catálogo");
    await expect(modalTitle).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(300);

    // 12. Reset branding back to original default settings
    await page.click('button:has-text("Datos Empresa")');
    await page.waitForTimeout(300);
    
    const resetBtn = page.locator('button:has-text("Restablecer Branding")');
    await expect(resetBtn).toBeVisible();

    // Intercept confirm dialog and accept it
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("desea restablecer la marca");
      await dialog.accept();
    });

    await resetBtn.click();
    
    // Wait for reload after reset
    await page.waitForTimeout(3000);

    // Check that the company name has returned to default "CYH Ventilación"
    await page.goto("/crm/configuracion");
    const companyInputAfterReset = page.locator('label:has-text("Razón Social") + input').first();
    await expect(companyInputAfterReset).toHaveValue("CYH Ventilación");
  });
});
