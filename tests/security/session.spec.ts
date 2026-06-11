import { test, expect } from "@playwright/test";
import { setupConsoleGate } from "../helpers/gate";
import { ensureTestUser, sql } from "../helpers/db";

test.describe("Security - Session Validation", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleGate(page);
  });



  test("Redirecting to login when session is missing (unauthenticated access)", async ({ page }) => {
    // 1. Try to navigate directly to CRM dashboard without logging in
    await page.goto("/crm/dashboard");

    // 2. Assert redirection to login page
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Redirecting to login when token is garbage or invalid", async ({ page, context }) => {
    // 1. Set a corrupted/expired Supabase auth token cookie
    await context.addCookies([
      {
        name: "sb-soqjlmnphdubaxvhfvpj-auth-token",
        value: "garbage_token_value_xyz",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 2. Try to load the pipeline dashboard
    await page.goto("/crm/pipeline");

    // 3. Assert redirection to login
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Blocking access when user profile is deleted/suspended from DB", async ({ page }) => {
    // We already have "unprofiled@cyh.com" created in Supabase Auth but deleted from "crm_users"
    await page.goto("/login");
    await page.fill('input[name="email"]', "unprofiled@cyh.com");
    await page.fill('input[name="password"]', "CYH123456!");
    await page.click('button:has-text("Ingresar")');

    // Assert that they remain blocked on login with the expected warning message
    await expect(page).toHaveURL(/\/login/);
    const errorAlert = page.locator("div:has-text('Acceso Denegado')").first();
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Su usuario no está registrado en el sistema");
  });
});
