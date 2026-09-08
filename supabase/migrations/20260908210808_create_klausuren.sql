-- PROJ-5: Probeklausuren-Hub
-- "klausuren": Bezeichnung/Datum/Quelle/Note + Drei-Stufen-Nacharbeitsmodell
--   (stufe1_text, stufe2_text, nachschreiben_erledigt). Status (Korrektur
--   ausstehend/Korrigiert), Gesamtpunkte und Bestanden-Badge werden nie
--   gespeichert, sondern beim Laden live aus den Teilen berechnet (siehe
--   Tech Design).
-- "klausur_teile": mind. 1 Zeile pro Klausur, ein Teil deckt ein Fach mit
--   eigenen Punkten ab (ermöglicht sowohl den 1-Fach-Fall als auch
--   kombinierte Klausurtage mit mehreren Fächern). Update erfolgt per
--   Delete-then-Insert (analog Themen-Zuordnung), daher keine UPDATE-Policy
--   nötig.
-- "klausur_teile_themen": Verknüpfungstabelle (ein Teil kann mehrere Themen
--   haben), identisches Muster zu "karteikarten_themen"/
--   "uebungsaufgaben_themen", nur eine Ebene tiefer verschachtelt (Teil →
--   Klausur → Nutzer).

create table if not exists public.klausuren (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bezeichnung text not null check (char_length(btrim(bezeichnung)) > 0 and char_length(bezeichnung) <= 200),
  datum date not null,
  quelle text not null default '' check (char_length(quelle) <= 200),
  note text not null default '' check (char_length(note) <= 50),
  stufe1_text text not null default '' check (char_length(stufe1_text) <= 2000),
  stufe2_text text not null default '' check (char_length(stufe2_text) <= 2000),
  nachschreiben_erledigt boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.klausuren enable row level security;

create policy "Nutzer sieht eigene Klausuren"
  on public.klausuren for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Klausuren an"
  on public.klausuren for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeitet eigene Klausuren"
  on public.klausuren for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer löscht eigene Klausuren"
  on public.klausuren for delete
  using (auth.uid() = user_id);

create index if not exists klausuren_user_id_idx on public.klausuren (user_id);
create index if not exists klausuren_datum_idx on public.klausuren (datum);

create table if not exists public.klausur_teile (
  id uuid primary key default gen_random_uuid(),
  klausur_id uuid not null references public.klausuren(id) on delete cascade,
  fach_id text not null references public.faecher(id),
  max_punkte numeric check (max_punkte >= 0),
  erreichte_punkte numeric check (erreichte_punkte >= 0),
  constraint erreichte_nicht_ueber_max check (
    max_punkte is null or erreichte_punkte is null or erreichte_punkte <= max_punkte
  )
);

alter table public.klausur_teile enable row level security;

create policy "Nutzer sieht Teile eigener Klausuren"
  on public.klausur_teile for select
  using (exists (
    select 1 from public.klausuren k
    where k.id = klausur_id and k.user_id = auth.uid()
  ));

create policy "Nutzer legt Teile eigener Klausuren an"
  on public.klausur_teile for insert
  with check (exists (
    select 1 from public.klausuren k
    where k.id = klausur_id and k.user_id = auth.uid()
  ));

create policy "Nutzer löscht Teile eigener Klausuren"
  on public.klausur_teile for delete
  using (exists (
    select 1 from public.klausuren k
    where k.id = klausur_id and k.user_id = auth.uid()
  ));

create index if not exists klausur_teile_klausur_id_idx on public.klausur_teile (klausur_id);
create index if not exists klausur_teile_fach_id_idx on public.klausur_teile (fach_id);

create table if not exists public.klausur_teile_themen (
  teil_id uuid not null references public.klausur_teile(id) on delete cascade,
  thema_id uuid not null references public.themen(id) on delete cascade,
  primary key (teil_id, thema_id)
);

alter table public.klausur_teile_themen enable row level security;

create policy "Nutzer sieht Themenzuordnung eigener Teile"
  on public.klausur_teile_themen for select
  using (exists (
    select 1 from public.klausur_teile kt
    join public.klausuren k on k.id = kt.klausur_id
    where kt.id = teil_id and k.user_id = auth.uid()
  ));

create policy "Nutzer legt Themenzuordnung eigener Teile an"
  on public.klausur_teile_themen for insert
  with check (exists (
    select 1 from public.klausur_teile kt
    join public.klausuren k on k.id = kt.klausur_id
    where kt.id = teil_id and k.user_id = auth.uid()
  ));

create policy "Nutzer löscht Themenzuordnung eigener Teile"
  on public.klausur_teile_themen for delete
  using (exists (
    select 1 from public.klausur_teile kt
    join public.klausuren k on k.id = kt.klausur_id
    where kt.id = teil_id and k.user_id = auth.uid()
  ));

create index if not exists klausur_teile_themen_thema_id_idx on public.klausur_teile_themen (thema_id);
