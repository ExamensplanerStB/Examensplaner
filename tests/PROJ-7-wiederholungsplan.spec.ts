import { expect, test } from "@playwright/test";

// Wie bei PROJ-1/2/3/6 enthält diese committete Suite bewusst nur Pfade, die
// ohne echte Zugangsdaten laufen (kein Secret im Repo). Die authentifizierten
// Abläufe (Aggregation, Gruppierung/Grenzfälle, Filter, Navigation zu den
// Hubs, "Nachschreiben erledigt" inkl. Fehlerfall, XSS, Responsive) sind live
// gegen das echte Supabase-Projekt getestet — siehe QA Test Results in
// features/PROJ-7-wiederholungsplan.md.

test.describe("PROJ-7: Wiederholungsplan", () => {
  test("AC: nicht eingeloggter Zugriff auf /wiederholungsplan leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/wiederholungsplan");
    await expect(page).toHaveURL("/login?redirect=%2Fwiederholungsplan");
  });

  test("Sicherheit: /wiederholungsplan ist wie jede andere geschützte Route standardmäßig verweigert, kein Opt-out über Query-Strings", async ({
    page,
  }) => {
    await page.goto("/wiederholungsplan?redirect=%2Fdashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fwiederholungsplan");
  });
});
