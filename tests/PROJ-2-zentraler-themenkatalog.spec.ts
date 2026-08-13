import { expect, test } from "@playwright/test";

// Wie bei PROJ-1 enthält diese committete Suite bewusst nur Pfade, die ohne
// echte Zugangsdaten laufen (kein Secret im Repo). Die authentifizierten
// Abläufe (Anlegen/Umbenennen/Löschen/Klausurrelevanz, RLS, Persistenz) sind
// live gegen das echte Supabase-Projekt getestet — siehe QA Test Results in
// features/PROJ-2-zentraler-themenkatalog.md.

test.describe("PROJ-2: Zentraler Themenkatalog", () => {
  test("AC1: nicht eingeloggter Zugriff auf /themen leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/themen");
    await expect(page).toHaveURL("/login?redirect=%2Fthemen");
  });

  test("Sicherheit: /themen ist wie jede andere geschützte Route standardmäßig verweigert, kein Opt-out über Query-Strings", async ({
    page,
  }) => {
    await page.goto("/themen?redirect=%2Fdashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fthemen");
  });
});
