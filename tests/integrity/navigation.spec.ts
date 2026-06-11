import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser } from "../helpers/db";

test.describe("Integrity - Extreme Navigation Stress Test", () => {
  test.beforeAll(async () => {
    await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");
  });

  test("Fast navigation stress loop seeking memory leaks, crashes, and hydration mismatches", async ({ page }) => {
    test.setTimeout(60000); // Allow test to run up to 60s to accommodate the 45s stress loop
    // 1. Setup the console gate to automatically fail on page errors, TypeError, ReferenceError, and Hydration mismatches.
    setupConsoleGate(page);

    // 2. Log in as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");

    // 3. Define navigation path sequence
    const navigationSteps = [
      { url: "/crm/calendario", selector: "h1:has-text('Mesa de Agendamiento Técnico')" },
      { url: "/crm/clientes", selector: "h1:has-text('Directorio de Cuentas B2B')" },
      { url: "/crm/pipeline", selector: "h1:has-text('Pipeline Comercial')" },
      { url: "/crm/reportes", selector: "h1:has-text('Reportes y Analítica')" },
      { url: "/crm/calendario", selector: "h1:has-text('Mesa de Agendamiento Técnico')" },
      { url: "/crm/dashboard", selector: "h1:has-text('CYH Super Admin')" },
      { url: "/crm/reportes", selector: "h1:has-text('Reportes y Analítica')" },
      { url: "/cotizador", selector: "h1:has-text('Plataforma de Diagnóstico y Preingeniería Industrial')" },
      { url: "/portal/inicio", selector: "h1:has-text('Portal Corporativo')" },
    ];

    const STRESS_TEST_DURATION_MS = 45000; // Run for 45 seconds
    const startTime = Date.now();
    let stepIndex = 0;
    let iterationCount = 0;

    console.log(`Starting extreme navigation loop for ${STRESS_TEST_DURATION_MS / 1000} seconds...`);

    const pageLoadTimes: number[] = [];

    while (Date.now() - startTime < STRESS_TEST_DURATION_MS) {
      const step = navigationSteps[stepIndex];
      const navStart = performance.now();

      // Append cache-busting timestamp to bypass Next.js client-side router caching
      await page.goto(`${step.url}?t=${Date.now()}`);

      // Verify the page contains the expected header and is visible
      await expect(page.locator(step.selector)).toBeVisible({ timeout: 10000 });

      const navEnd = performance.now();
      const loadTime = navEnd - navStart;
      pageLoadTimes.push(loadTime);

      // Verify page is not a blank screen
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      expect(bodyHTML.length).toBeGreaterThan(100);

      // Memory Leak Verification: check that page loading time does not degrade exponentially.
      // We average the last 3 load times to ensure no progressive performance degradation (> 8s).
      if (pageLoadTimes.length >= 3) {
        const lastThreeTimes = pageLoadTimes.slice(-3);
        const avgLastThree = lastThreeTimes.reduce((a, b) => a + b, 0) / 3;
        expect(avgLastThree).toBeLessThan(8000); 
      }

      stepIndex = (stepIndex + 1) % navigationSteps.length;
      iterationCount++;
    }

    console.log(`Extreme navigation stress test finished successfully. Total page loads: ${iterationCount}`);
  });
});
