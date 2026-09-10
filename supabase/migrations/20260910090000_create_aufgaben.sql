-- PROJ-6: Todo-Liste
-- "aufgaben": eine Zeile pro Todo-Eintrag. Feste Kategorien und Priorität
--   sind Wertelisten im Anwendungscode (siehe Tech Design), nicht eigene
--   Tabellen — kategorie_fest ist daher ein Text-Enum statt einer
--   Fremdschlüssel-Referenz.
-- "aufgaben_kategorien": eigene, vom Nutzer angelegte Kategorien (Ergänzung
--   zu den 4 festen). Flache, separate Tabelle statt gemeinsam mit den
--   festen Kategorien (siehe Tech Design) — vermeidet eine Seed-Migration
--   für nur vier feste Zeilen.
-- Höchstens eines von aufgaben.kategorie_fest/eigene_kategorie_id ist
-- gleichzeitig gesetzt (Check-Constraint, siehe unten).

create table if not exists public.aufgaben_kategorien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) > 0 and char_length(name) <= 60),
  -- Feste Farbpalette statt freiem Farbwähler (siehe Tech Design) — Werte
  -- müssen mit KATEGORIE_PALETTE in src/lib/aufgaben.ts übereinstimmen.
  farbe text not null check (farbe in (
    '#2A6FDB', '#1F8A5B', '#C77D2A', '#B5384E',
    '#7A4FCF', '#0E8C9E', '#C0392B', '#5E6470'
  )),
  created_at timestamptz not null default now()
);

alter table public.aufgaben_kategorien enable row level security;

create policy "Nutzer sieht eigene Aufgaben-Kategorien"
  on public.aufgaben_kategorien for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Aufgaben-Kategorien an"
  on public.aufgaben_kategorien for insert
  with check (auth.uid() = user_id);

-- Kein Update/Delete für Nutzer: MVP unterstützt nur das Anlegen eigener
-- Kategorien (siehe Spec, Out of Scope) — keine Policy dafür = per RLS
-- verweigert.

-- Duplikatsprüfung pro Nutzer, Groß-/Kleinschreibung ignoriert (identisches
-- Prinzip wie bei "themen" in PROJ-2).
create unique index if not exists aufgaben_kategorien_user_name_unique
  on public.aufgaben_kategorien (user_id, lower(btrim(name)));

create index if not exists aufgaben_kategorien_user_id_idx on public.aufgaben_kategorien (user_id);

create table if not exists public.aufgaben (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titel text not null check (char_length(btrim(titel)) > 0 and char_length(titel) <= 200),
  datum date,
  zeittyp text check (zeittyp in ('ganztag', 'zeitslot')),
  start_zeit time,
  end_zeit time,
  kategorie_fest text check (kategorie_fest in ('vorlesung', 'lernen', 'wiederholung', 'frist')),
  eigene_kategorie_id uuid references public.aufgaben_kategorien(id) on delete set null,
  prioritaet text not null default 'keine' check (prioritaet in ('hoch', 'mittel', 'niedrig', 'keine')),
  erledigt boolean not null default false,
  -- Datenfeld für die spätere Kalenderdarstellung in PROJ-9 (siehe Spec) —
  -- hat innerhalb von PROJ-6 selbst keine Auswirkung.
  im_kalender boolean not null default true,
  created_at timestamptz not null default now(),

  -- Zeittyp nur sinnvoll, wenn ein Datum gesetzt ist.
  check (zeittyp is null or datum is not null),
  -- Start-/Endzeit nur bei Zeittyp "zeitslot", dann aber beide zwingend.
  check ((zeittyp = 'zeitslot') = (start_zeit is not null and end_zeit is not null)),
  check (start_zeit is null or end_zeit is null or end_zeit > start_zeit),
  -- Höchstens eine der beiden Kategorie-Referenzen gleichzeitig gesetzt.
  check (kategorie_fest is null or eigene_kategorie_id is null)
);

alter table public.aufgaben enable row level security;

create policy "Nutzer sieht eigene Aufgaben"
  on public.aufgaben for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Aufgaben an"
  on public.aufgaben for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeitet eigene Aufgaben"
  on public.aufgaben for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer löscht eigene Aufgaben"
  on public.aufgaben for delete
  using (auth.uid() = user_id);

create index if not exists aufgaben_user_id_idx on public.aufgaben (user_id);
create index if not exists aufgaben_datum_idx on public.aufgaben (datum);
create index if not exists aufgaben_eigene_kategorie_id_idx on public.aufgaben (eigene_kategorie_id);
