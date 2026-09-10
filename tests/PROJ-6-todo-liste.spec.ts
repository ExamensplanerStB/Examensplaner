import { expect, test } from "@playwright/test";

// Wie bei PROJ-1/2/3 enthält diese committete Suite bewusst nur Pfade, die
// ohne echte Zugangsdaten laufen (kein Secret im Repo). Die authentifizierten
// Abläufe (Anlegen/Bearbeiten/Löschen/Filter/Sortierung/Überfälligkeit/
// eigene Kategorien, RLS, Persistenz) sind live gegen das echte
// Supabase-Projekt getestet — siehe QA Test Results in
// features/PROJ-6-todo-liste.md.

test.describe("PROJ-6: Todo-Liste", () => {
  test("AC: nicht eingeloggter Zugriff auf /todos leitet zu /login?redirect=... um", async ({
    page,
  }) => {
    await page.goto("/todos");
    await expect(page).toHaveURL("/login?redirect=%2Ftodos");
  });

  test("Sicherheit: /todos ist wie jede andere geschützte Route standardmäßig verweigert, kein Opt-out über Query-Strings", async ({
    page,
  }) => {
    await page.goto("/todos?redirect=%2Fdashboard");
    await expect(page).toHaveURL("/login?redirect=%2Ftodos");
  });
});
