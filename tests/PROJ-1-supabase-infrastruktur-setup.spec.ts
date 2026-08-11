import { expect, test } from "@playwright/test";

test.describe("PROJ-1: Supabase-Infrastruktur-Setup", () => {
  test("AC1: nicht eingeloggter Zugriff auf /dashboard leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fdashboard");
  });

  test("AC4: leeres Formular zeigt Validierungsfehler ohne Server-Anfrage", async ({
    page,
  }) => {
    let actionCalled = false;
    page.on("request", (req) => {
      if (req.method() === "POST") actionCalled = true;
    });

    await page.goto("/login");
    await page.click('button[type="submit"]');

    await expect(page.getByText("E-Mail ist erforderlich")).toBeVisible();
    await expect(page.getByText("Passwort ist erforderlich")).toBeVisible();
    expect(actionCalled).toBe(false);
  });

  test("AC3: falsche Zugangsdaten zeigen generische Fehlermeldung, Passwort wird geleert, E-Mail bleibt erhalten", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "nichtvorhanden@example.com");
    await page.fill('input[name="password"]', "falschespasswort123");
    await page.click('button[type="submit"]');

    await expect(page.getByText("E-Mail oder Passwort ist falsch")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[name="email"]')).toHaveValue(
      "nichtvorhanden@example.com"
    );
    await expect(page.locator('input[name="password"]')).toHaveValue("");
  });

  test("Sicherheit: XSS-Payload im E-Mail-Feld wird nicht ausgeführt", async ({
    page,
  }) => {
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    await page.goto("/login");
    await page.fill(
      'input[name="email"]',
      '"><img src=x onerror=alert(1)>@example.com'
    );
    await page.fill('input[name="password"]', "whatever123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    expect(dialogFired).toBe(false);
  });
});
