import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser } from "../helpers/db";

test.describe("Performance - Real Latency & Network Degradation", () => {
  test.beforeAll(async () => {
    await ensureTestUser("admin@cyh.com", "admin", "CYH Super Admin");
  });

  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);

    // Login once
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL("**/crm/dashboard");
  });

  test("Slow 3G Emulation - Skeletons or content loads successfully", async ({ page }) => {
    // 1. Create a CDP Session to emulate Slow 3G network conditions
    // Slow 3G: 2000ms latency, download: 400Kbps, upload: 400Kbps
    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
      latency: 2000,
    });

    // 2. Navigate to /crm/leads with cache-busting timestamp
    await page.goto(`/crm/leads?t=${Date.now()}`, { waitUntil: "commit" });

    // 3. Verify that either the skeleton loader or the final table is visible (handles fast server rendering chunks)
    await expect(page.locator(".animate-pulse").or(page.locator("table")).first()).toBeVisible({ timeout: 10000 });

    // 4. Wait for the final content (e.g. table headers or directory page) to load completely
    await page.waitForSelector("table", { timeout: 25000 });
    await expect(page.locator("h2:has-text('Leads Pipeline')")).toBeVisible();
  });

  test("Fast 3G Emulation - Normal loading behavior", async ({ page }) => {
    // Fast 3G: 500ms latency, download: 1.5Mbps, upload: 750Kbps
    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (1.5 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      latency: 500,
    });

    await page.goto(`/crm/leads?t=${Date.now()}`);
    await page.waitForSelector("table", { timeout: 15000 });
    await expect(page.locator("h2:has-text('Leads Pipeline')")).toBeVisible();
  });

  test("Varying high latencies (5000ms & 10000ms) - Navigation stays responsive", async ({ page }) => {
    test.setTimeout(60000);
    const context = page.context();
    const client = await context.newCDPSession(page);

    // Test with 5000ms
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (100 * 1024) / 8,
      uploadThroughput: (100 * 1024) / 8,
      latency: 5000,
    });

    await page.goto(`/crm/pipeline?t=${Date.now()}`, { waitUntil: "commit" });
    await expect(page.locator(".animate-pulse").or(page.locator("h1:has-text('Pipeline Comercial')")).first()).toBeVisible({ timeout: 15000 });
    
    // Test with 10000ms - change emulation dynamically
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (50 * 1024) / 8,
      uploadThroughput: (50 * 1024) / 8,
      latency: 10000,
    });
    
    // Navigate to dashboard and verify it remains responsive
    await page.goto(`/crm/dashboard?t=${Date.now()}`, { waitUntil: "commit" });
    await expect(page.locator(".animate-pulse").or(page.locator("h1")).first()).toBeVisible({ timeout: 20000 });
  });

  test("Offline Mode - Graceful failure behavior", async ({ page }) => {
    // 1. Go offline
    const context = page.context();
    const client = await context.newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    });

    // 2. Attempt navigation. Playwright should throw a connection error or fail to load.
    // We expect the app NOT to throw TypeError / ReferenceError / Hydration mismatches.
    try {
      await page.goto(`/crm/leads?t=${Date.now()}`, { timeout: 5000 });
    } catch (err: any) {
      // Expect it to be a network error (like net::ERR_INTERNET_DISCONNECTED) and NOT a JS error
      expect(err.message).toContain("net::ERR_INTERNET_DISCONNECTED");
    }
  });
});
