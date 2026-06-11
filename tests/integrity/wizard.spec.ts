import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";

test.describe("Integrity - Pre-Engineering Wizard", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
    // Deep-link directly to step 2 (calculator) of the wizard
    await page.goto("/cotizador?servicio=venta");
  });

  test("Rejects zero values with validation messages", async ({ page }) => {
    await page.fill("input#length", "0");
    await page.fill("input#width", "10");
    await page.fill("input#height", "5");

    // Click outside to trigger validation
    await page.click("h2:has-text('Dimensione sus Instalaciones')");

    const errorMsg = page.locator("span:has-text('El largo debe ser mayor a 0')");
    await expect(errorMsg).toBeVisible();

    const submitBtn = page.locator("button:has-text('PROCESAR CÁLCULOS')");
    await expect(submitBtn).toBeDisabled();
  });

  test("Rejects negative values with validation messages", async ({ page }) => {
    await page.fill("input#length", "10");
    await page.fill("input#width", "-5");
    await page.fill("input#height", "5");

    await page.click("h2:has-text('Dimensione sus Instalaciones')");

    const errorMsg = page.locator("span:has-text('El ancho debe ser mayor a 0')");
    await expect(errorMsg).toBeVisible();

    const submitBtn = page.locator("button:has-text('PROCESAR CÁLCULOS')");
    await expect(submitBtn).toBeDisabled();
  });

  test("Rejects extremely large values exceeding limits", async ({ page }) => {
    await page.fill("input#length", "999999999");
    await page.fill("input#width", "10");
    await page.fill("input#height", "5");

    await page.click("h2:has-text('Dimensione sus Instalaciones')");

    const errorMsg = page.locator("span:has-text('El largo máximo permitido es')");
    await expect(errorMsg).toBeVisible();

    const submitBtn = page.locator("button:has-text('PROCESAR CÁLCULOS')");
    await expect(submitBtn).toBeDisabled();
  });

  test("Accepts and computes tiny fractional positive values successfully", async ({ page }) => {
    await page.fill("input#length", "0.00001");
    await page.fill("input#width", "0.00001");
    await page.fill("input#height", "0.00001");

    await page.click("h2:has-text('Dimensione sus Instalaciones')");

    // The pre-engineering calculation panel should update successfully
    const flowKpi = page.locator("span:has-text('CFM')").first();
    await expect(flowKpi).toBeVisible();

    // Verify it doesn't display NaN
    const panelText = await page.locator("div.glass-panel").first().innerText();
    expect(panelText).not.toContain("NaN");
    expect(panelText).toContain("CFM");
  });

  test("Rejects non-numeric, empty, and infinite values gracefully", async ({ page }) => {
    const stressInputs = ["NaN", "Infinity", "-Infinity", "1e309", "", "abc", "999999999999999999999999"];

    for (const val of stressInputs) {
      // Set value via DOM to bypass Playwright's fill validation on type=number inputs
      await page.evaluate(({ val }) => {
        const el = document.querySelector("input#length") as HTMLInputElement;
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { val });

      await page.fill("input#width", "10");
      await page.fill("input#height", "5");

      // Click outside to trigger validation
      await page.click("h2:has-text('Dimensione sus Instalaciones')");

      // Verify that the submit button is disabled
      const submitBtn = page.locator("button:has-text('PROCESAR CÁLCULOS')");
      await expect(submitBtn).toBeDisabled();

      // Ensure no NaN or Infinity is displayed in the pre-engineering preview panel
      const panelText = await page.locator("div.glass-panel").first().innerText();
      expect(panelText).not.toContain("NaN");
      expect(panelText).not.toContain("Infinity");
    }
  });
});


