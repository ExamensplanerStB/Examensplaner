import { expect, test } from "@playwright/test";

// Wie bei PROJ-1/PROJ-2 enthält diese committete Suite bewusst nur Pfade, die
// ohne echte Zugangsdaten laufen (kein Secret im Repo). Die authentifizierten
// Abläufe (Anlegen/Bewerten/Bearbeiten/Löschen/Fokuseinheit, RLS, Persistenz)
// sind live gegen das echte Supabase-Projekt getestet — siehe QA Test Results
// in features/PROJ-3-karteikarten-hub.md.

test.describe("PROJ-3: Karteikarten-Hub", () => {
  test("AC1: nicht eingeloggter Zugriff auf /karteikarten leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/karteikarten");
    await expect(page).toHaveURL("/login?redirect=%2Fkarteikarten");
  });

  test("Sicherheit: /karteikarten ist wie jede andere geschützte Route standardmäßig verweigert, kein Opt-out über Query-Strings", async ({
    page,
  }) => {
    await page.goto("/karteikarten?redirect=%2Fdashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fkarteikarten");
  });
});
