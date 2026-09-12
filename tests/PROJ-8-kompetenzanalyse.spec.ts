import { expect, test } from "@playwright/test";

// Wie bei PROJ-1/2/3/6/7 enthält diese committete Suite bewusst nur Pfade,
// die ohne echte Zugangsdaten laufen (kein Secret im Repo). Der
// authentifizierte Ablauf (3-Ebenen-Drilldown, Stufenverteilung,
// Klausurreife, Größte Blockaden, Kalibrierung, Breadcrumb-Navigation,
// Responsive) wird live gegen das echte Supabase-Projekt verifiziert.

test.describe("PROJ-8: Kompetenzanalyse", () => {
  test("AC: nicht eingeloggter Zugriff auf /kompetenzanalyse leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/kompetenzanalyse");
    await expect(page).toHaveURL("/login?redirect=%2Fkompetenzanalyse");
  });

  test("Sicherheit: /kompetenzanalyse ist wie jede andere geschützte Route standardmäßig verweigert, kein Opt-out über Query-Strings", async ({
    page,
  }) => {
    await page.goto("/kompetenzanalyse?redirect=%2Fdashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fkompetenzanalyse");
  });
});
