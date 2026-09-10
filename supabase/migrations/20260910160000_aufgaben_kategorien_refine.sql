-- PROJ-6 Refine (2026-09-10): Feste Kategorien entfernt, Kategorie-Löschen.
-- Siehe features/PROJ-6-todo-liste.md, Decision Log "Refine 2026-09-10".

-- Feste Kategorien gibt es im Anwendungscode nicht mehr — die zugehörige
-- Spalte entfällt. "drop column" entfernt dabei automatisch auch alle
-- Constraints, die diese Spalte referenzieren — sowohl den eigenen
-- Check-Constraint der Spalte als auch den Mutual-Exclusivity-Check
-- "kategorie_fest is null or eigene_kategorie_id is null" (Postgres kennt
-- dessen system-generierten Namen nicht vorab zuverlässig, daher hier
-- bewusst kein explizites "drop constraint" mit geratenem Namen).
-- eigene_kategorie_id ist damit das einzige Kategoriefeld und wird
-- entsprechend umbenannt.
alter table public.aufgaben
  drop column if exists kategorie_fest;

alter table public.aufgaben
  rename column eigene_kategorie_id to kategorie_id;

alter index if exists aufgaben_eigene_kategorie_id_idx rename to aufgaben_kategorie_id_idx;

-- Löschen eigener Kategorien ist jetzt Teil des MVP (vorher bewusst ohne
-- Policy = per RLS verweigert). Die Zuordnung auf betroffenen Aufgaben wird
-- bereits durch die bestehende "on delete set null"-Fremdschlüssel-Regel auf
-- aufgaben.kategorie_id entfernt — kein zusätzlicher Anwendungscode nötig.
create policy "Nutzer löscht eigene Aufgaben-Kategorien"
  on public.aufgaben_kategorien for delete
  using (auth.uid() = user_id);
