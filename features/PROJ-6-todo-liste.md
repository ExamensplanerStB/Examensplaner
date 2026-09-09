# PROJ-6: Todo-Liste

## Status: Planned
**Created:** 2026-09-09
**Last Updated:** 2026-09-09

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Route und das RLS-Muster

## User Stories
- Als Lukas möchte ich eine Aufgabe mit Titel und optional Datum anlegen, damit ich mir Aufgaben und Fristen für die Examensvorbereitung merken kann, ohne sie extern zu notieren.
- Als Lukas möchte ich eine Aufgabe einer Kategorie (z.B. Wiederholung, Frist/Prüfung) und einer Priorität zuordnen, damit ich auf einen Blick erkenne, worum es sich handelt und wie dringend sie ist.
- Als Lukas möchte ich eine Aufgabe mit einem Klick als erledigt markieren, damit ich meinen Fortschritt sehe, ohne sie sofort zu löschen.
- Als Lukas möchte ich meine Aufgaben nach Offen/Erledigt/Alle filtern und nach Zeit, Priorität oder Kategorie sortieren, damit ich die Liste je nach Situation unterschiedlich einsehen kann.
- Als Lukas möchte ich sofort erkennen, welche offenen Aufgaben überfällig sind, damit ich sie nicht aus Versehen liegen lasse.
- Als Lukas möchte ich für eine Aufgabe mit Datum wählen, ob sie ganztägig ist oder zu einer festen Uhrzeit stattfindet, damit die Angabe später im Kalender (PROJ-9) korrekt dargestellt werden kann.

## Out of Scope
- Eigene Kalenderansicht (Wochen-/Monatsraster, Drag & Drop zum Verschieben/Verlängern) — vollständig Teil von PROJ-9 (Dashboard, das bereits einen eigenen „Wochenkalender"-Punkt führt und von PROJ-6 abhängt); PROJ-6 liefert dafür nur kalenderfertige Daten (Datum, Zeittyp, Kategorie, „Im Kalender anzeigen"-Flag)
- Eigener Eintragstyp „Termin" (kalenderspezifische Einträge ohne Checkbox/Priorität, z.B. feste Termine wie im Prototyp „Vorlesung/Seminar" als Ereignis) — ohne existierende Kalenderansicht wäre er aktuell nirgends sichtbar; kann bei Bedarf zusammen mit PROJ-9 ergänzt werden
- Dritter Zeitzustand „Ohne Uhrzeit" (Datum ohne Ganztägig-/Zeitslot-Angabe) — reduziert auf die zwei im Feature-Titel genannten Zustände Ganztägig/Zeitslot
- Verknüpfung mit dem Themenkatalog (Fach/Thema, PROJ-2) — Aufgaben sind nicht Teil der Kompetenzanalyse (PROJ-8 wertet ausschließlich PROJ-3/4/5 aus) und brauchen daher keine Themen-Zuordnung
- Wiederkehrende Aufgaben/Serientermine — nicht Teil des MVP
- Erinnerungen/Benachrichtigungen (Push, E-Mail, Browser-Notifications) — keine Notification-Infrastruktur im Projekt vorhanden
- Verwalten (Umbenennen/Löschen) eigener Kategorien nach dem Anlegen — MVP unterstützt nur das Anlegen; Verwaltung kann später ergänzt werden, analog zur Themenverwaltung in PROJ-2
- Aufnahme von Aufgaben in den hub-übergreifenden Wiederholungsplan (PROJ-7) — dieser aggregiert ausschließlich fällige Wiederholungen aus Karteikarten/Übungsaufgaben/Probeklausuren, keine Todos
- Mehrfachauswahl/Stapel-Aktionen, Import/Export, Offline-Nutzung, Bilder/Anhänge — analog PROJ-3/4/5 nicht Teil des MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Todo-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn die Todo-Liste lädt, dann werden alle eigenen Aufgaben geladen und mit dem Standardfilter „Offen" sowie der Standardsortierung „Zeit" angezeigt
- [ ] Angenommen es existieren noch keine Aufgaben, wenn der Hub lädt, dann erscheint der Hinweis „Keine Aufgaben" statt einer leeren Liste

### Anlegen
- [ ] Angenommen der Nutzer öffnet das Formular für eine neue Aufgabe, wenn er nur einen Titel eingibt und speichert, dann wird die Aufgabe ohne Datum, ohne Kategorie und mit Priorität „Keine" angelegt und erscheint sofort in der Gruppe „Ohne Datum"
- [ ] Angenommen der Titel ist leer oder besteht nur aus Leerzeichen, wenn der Nutzer speichern möchte, dann wird das Speichern verhindert und eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen der Nutzer setzt kein Datum, dann ist die Auswahl „Ganztägig/Zeitslot" nicht verfügbar, da sie ohne Datum keine Bedeutung hat
- [ ] Angenommen der Nutzer setzt ein Datum, wenn er zusätzlich „Zeitslot" wählt und eine Start- und Endzeit einträgt, dann wird die Aufgabe mit dieser Zeitspanne gespeichert
- [ ] Angenommen der Nutzer wählt „Zeitslot", wenn die eingetragene Endzeit vor oder gleich der Startzeit liegt, dann wird das Speichern verhindert und eine Validierungsfehlermeldung angezeigt

### Kategorie
- [ ] Angenommen der Nutzer legt eine Aufgabe an, wenn er eine der vier festen Kategorien (Vorlesung/Seminar, Lernsession, Wiederholung, Frist/Prüfung) wählt, dann wird die Aufgabe mit der zugehörigen Kategorie-Farbe in der Liste angezeigt
- [ ] Angenommen der Nutzer klickt auf „Eigene Kategorie anlegen", wenn er einen Namen und eine Farbe aus der Farbauswahl wählt und bestätigt, dann steht die neue Kategorie sofort in der Kategorie-Auswahl zur Verfügung und ist direkt der aktuellen Aufgabe zugeordnet
- [ ] Angenommen der Nutzer gibt für eine eigene Kategorie einen Namen ein, der (unabhängig von Groß-/Kleinschreibung) bereits existiert, dann wird keine doppelte Kategorie angelegt, sondern die bestehende Kategorie der Aufgabe zugeordnet
- [ ] Angenommen eine Aufgabe hat keine Kategorie zugewiesen, dann wird kein Kategorie-Badge angezeigt

### Priorität
- [ ] Angenommen der Nutzer legt eine Aufgabe an, wenn er eine Priorität (Hoch/Mittel/Niedrig) wählt, dann wird die Priorität farblich (Ampel-Rot/Amber/Grün) in der Liste angezeigt
- [ ] Angenommen eine Aufgabe hat die Priorität „Keine" (Standardwert), dann wird kein Prioritäts-Indikator angezeigt

### Status & Überfälligkeit
- [ ] Angenommen eine Aufgabe ist offen, wenn der Nutzer auf die Checkbox klickt, dann wird sie sofort als erledigt markiert, durchgestrichen dargestellt und verschwindet je nach aktivem Filter aus der Ansicht
- [ ] Angenommen eine Aufgabe ist bereits erledigt, wenn der Nutzer erneut auf die Checkbox klickt, dann wird sie wieder als offen markiert
- [ ] Angenommen eine Aufgabe hat ein Datum in der Vergangenheit und ist nicht erledigt, dann wird sie optisch als überfällig hervorgehoben (Ampel-Rot)
- [ ] Angenommen eine Aufgabe hat ein Datum in der Vergangenheit, ist aber bereits erledigt, dann wird sie nicht als überfällig hervorgehoben
- [ ] Angenommen eine Aufgabe hat kein Datum, dann wird sie nie als überfällig markiert

### Bearbeiten & Löschen
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf den Aufgabentext klickt, dann öffnet sich das Formular vorausgefüllt mit den aktuellen Werten
- [ ] Angenommen der Nutzer ändert Werte einer bestehenden Aufgabe, wenn er speichert, dann werden die Änderungen übernommen, das Formular schließt sich und die Liste zeigt sofort den neuen Stand
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor die Aufgabe endgültig entfernt wird
- [ ] Angenommen die API ist beim Speichern nicht erreichbar, wenn der Nutzer das Formular abschickt, dann wird eine Fehlermeldung angezeigt und die Eingaben bleiben im Formular erhalten

### Filter & Sortierung
- [ ] Angenommen Aufgaben mit unterschiedlichem Erledigt-Status existieren, wenn der Nutzer zwischen „Offen", „Erledigt" und „Alle" wechselt, dann zeigt die Liste ausschließlich die zum Filter passenden Aufgaben
- [ ] Angenommen die Sortierung „Zeit" ist aktiv, dann werden Aufgaben nach Datum gruppiert (Heute/Morgen/Gestern/Datum, „Ohne Datum" zuletzt) und innerhalb jeder Gruppe nach Uhrzeit sortiert (Aufgaben ohne Uhrzeit zuletzt)
- [ ] Angenommen der Nutzer wählt die Sortierung „Priorität", dann werden Aufgaben innerhalb jeder Datumsgruppe nach Priorität (Hoch → Mittel → Niedrig → Keine) sortiert
- [ ] Angenommen der Nutzer wählt die Sortierung „Kategorie", dann werden Aufgaben innerhalb jeder Datumsgruppe alphabetisch nach Kategoriename sortiert, Aufgaben ohne Kategorie zuletzt
- [ ] Angenommen für den aktiven Filter existieren keine passenden Aufgaben, dann erscheint der Hinweis „Keine Aufgaben" für diesen Filter

### Kalender-Vorbereitung (Datenfeld für PROJ-9)
- [ ] Angenommen der Nutzer legt eine Aufgabe an, dann ist der Schalter „Im Kalender anzeigen" standardmäßig aktiviert und kann vom Nutzer deaktiviert werden
- [ ] Angenommen der Schalter „Im Kalender anzeigen" ist deaktiviert, dann wird dieser Zustand zusammen mit der Aufgabe gespeichert, hat aber innerhalb der Todo-Liste selbst keine sichtbare Auswirkung (wirkt erst in der Kalenderansicht von PROJ-9)

## Edge Cases
- Titel enthält nur Leerzeichen → wird wie ein leeres Pflichtfeld behandelt, Speichern wird verhindert
- Zeitslot mit Endzeit gleich oder vor der Startzeit → Speichern wird verhindert, Validierungsfehlermeldung erscheint
- Netzwerkfehler beim Speichern oder Löschen → Fehlermeldung wird angezeigt, Formular bzw. bestehender Eintrag bleiben unverändert
- Aufgabe ohne Datum wird als erledigt markiert → landet unter dem „Erledigt"-Filter in der Gruppe „Ohne Datum", kann nie als überfällig gelten
- Neue eigene Kategorie mit einem Namen, der (groß-/kleinschreibungsunabhängig) bereits existiert → keine Dublette, bestehende Kategorie wird wiederverwendet
- Zwei Browser-Tabs bearbeiten dieselbe Aufgabe parallel → der zuletzt gespeicherte Stand gewinnt, kein Konflikt-Dialog im MVP
- Datum liegt weit in der Vergangenheit oder Zukunft → uneingeschränkt erlaubt, auch für rückwirkend erfasste Aufgaben

## Open Questions
<!-- Keine offenen Punkte aus dem Interview -->

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein eigenes Kalender-Grid in PROJ-6; nur kalenderfertige Datenfelder (Datum, Zeittyp, Kategorie, „Im Kalender anzeigen") | PROJ-9 (Dashboard) führt „Wochenkalender" bereits als eigenen Punkt und hängt von PROJ-6 ab — klare Trennung Datenhaltung (PROJ-6) vs. Kalenderdarstellung (PROJ-9) | 2026-09-09 |
| Kein eigener Typ „Termin"; nur „Aufgabe" mit optionaler Frist | Ohne existierende Kalenderansicht wäre ein reiner Kalendertermin (nicht in der Liste sichtbar) aktuell nirgends darstellbar | 2026-09-09 |
| Zeittyp auf „Ganztägig" und „Zeitslot" reduziert (kein drittes „Ohne Uhrzeit") | Deckt sich mit dem Feature-Titel in INDEX.md und vereinfacht das Datenmodell | 2026-09-09 |
| Kategorien 1:1 aus dem Prototyp übernommen (4 feste + eigene mit Farbwahl) | Nutzerwunsch; erhält die im Design-System dokumentierte Kalender-Kategorien-Farbcodierung vollständig | 2026-09-09 |
| „Frist" ist keine eigene Entität, sondern eine Aufgabe mit Kategorie „Frist/Prüfung" | Vermeidet ein doppeltes Datenmodell; deckt sich mit dem Prototyp-Verhalten | 2026-09-09 |
| Überfällige offene Aufgaben werden optisch hervorgehoben (Ampel-Rot) | Sichtbarkeit von Fristdruck ist für die Examensvorbereitung wichtig | 2026-09-09 |
| Löschen nur mit Bestätigungsdialog (AlertDialog) | Konsistent mit der bestehenden Konvention in PROJ-3/4/5 | 2026-09-09 |
| Keine Verknüpfung mit dem Themenkatalog (Fach/Thema) | Todos fließen nicht in die Kompetenzanalyse (PROJ-8) ein; Abhängigkeit in INDEX.md listet nur PROJ-1 | 2026-09-09 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Feste Kategorien + Priorität als Wertelisten im Code statt DB-Tabelle | Keine Laufzeit-Änderung nötig; Bezeichnung/Farbe bleiben zentral im Design-System, analog zu Bewertungstypen in PROJ-3/4 | 2026-09-09 |
| Eigene Kategorien in separater flacher Tabelle `aufgaben_kategorien`, statt gemeinsam mit den festen Kategorien | Vermeidet Seed-Migration für nur vier feste Zeilen; klare Trennung über zwei sich ausschließende Felder auf `aufgaben` | 2026-09-09 |
| Route `/todos`, Tabelle `aufgaben` | Route folgt dem Feature-Namen aus Prototyp/INDEX.md, Tabelle folgt der sonst durchgängig deutschen DB-Namenskonvention — gleiche Diskrepanz existiert bereits bei PROJ-5 (`/probeklausuren` → `klausuren`) | 2026-09-09 |
| Eigene Kategorie-Farbe aus fester Palette statt freiem Farbwähler | Verhindert unleserliche/kollidierende Farben, einfacher umzusetzen, entspricht dem Prototyp | 2026-09-09 |
| DB-Check-Constraint `end_zeit > start_zeit` | Verteidigung in der Tiefe zusätzlich zur Zod-Validierung, analog zum Punkte-Check in PROJ-5 | 2026-09-09 |
| Gegenseitiger Ausschluss `kategorie_fest`/`eigene_kategorie_id` nur auf Anwendungsebene | Für Single-User-App ausreichend robust, analog anderer app-seitig durchgesetzter Regeln in PROJ-1–5 | 2026-09-09 |
| Überfällig-Status und Datumsgruppen-Label live berechnet, nie gespeichert; Wiederverwendung von `diffTage`/`heuteISO` aus `karteikarten-intervall.ts` | Beide hängen vom aktuellen Datum ab und würden als gespeicherter Wert veralten; identisches Prinzip wie Nachschreiben-Fälligkeit in PROJ-5 | 2026-09-09 |
| Server Actions statt eigener API-Routen | Konsistent mit dem bereits etablierten Muster in PROJ-1–5 | 2026-09-09 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/todos (geschützte Route — Zugriff nur eingeloggt, sonst Redirect zu /login,
        gesichert durch die bestehende Middleware aus PROJ-1)
└── Todo-Liste-Seite
    ├── Kopfzeile: Seitentitel + Kurzbeschreibung + "+ Aufgabe"-Button
    │
    ├── Filter-/Sortierleiste
    │   ├── Status-Filter (Offen / Erledigt / Alle)
    │   ├── Sortierung (Zeit / Priorität / Kategorie)
    │   └── Zähler ("X offen · Y gesamt")
    │
    ├── Aufgaben-Liste, gruppiert nach Datum (Heute/Morgen/Gestern/Datum,
    │   "Ohne Datum" zuletzt)
    │   └── Je Gruppe: Gruppenlabel + Card
    │       └── Je Aufgabe (Zeile)
    │           ├── Checkbox (Erledigt umschalten)
    │           ├── Titel (klickbar zum Bearbeiten) + Kategorie-Punkt mit Label
    │           ├── Zeit-Anzeige ("Ganztägig" oder "Start–Endzeit Uhr"),
    │           │   Datum rot hervorgehoben, wenn überfällig (offen + Datum
    │           │   in der Vergangenheit)
    │           ├── Prioritäts-Badge (nur wenn Priorität ≠ "Keine")
    │           └── Löschen-Icon
    │
    ├── Leerer Zustand ("Keine Aufgaben") — abhängig vom aktiven Filter
    │
    ├── Neue/Bearbeiten-Aufgabe-Formular (Modal)
    │   ├── Titel (Textfeld, Pflicht, max. 200 Zeichen)
    │   ├── Datum (optionales Datumsfeld)
    │   ├── Kategorie (Auswahl: 4 feste Kategorien + eigene Kategorien +
    │   │   "Eigene Kategorie anlegen" → Inline-Formular mit Namensfeld und
    │   │   Farbauswahl aus fester Palette)
    │   ├── Priorität (Button-Gruppe: Hoch/Mittel/Niedrig/Keine)
    │   ├── "Im Kalender anzeigen"-Schalter (Standard: an)
    │   ├── Zeittyp (Ganztägig/Zeitslot) — erst wähl-/sichtbar, sobald ein
    │   │   Datum gesetzt ist
    │   └── Start-/Endzeit (nur bei Zeittyp "Zeitslot")
    │
    ├── Lösch-Bestätigungsdialog (Abbrechen / Löschen)
    │
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung
        fehlgeschlagen"-Hinweis bei Netzwerkfehlern)
```

### Data Model (in plain language)
```
Feste Kategorien und Priorität sind Wertelisten im Anwendungscode (keine
eigene Tabelle) — analog zu Bewertungstypen wie "Fachlich"/"Klausurtechnik"
in PROJ-3/4. Das hält Bezeichnung und Farbe an einer Stelle im Design-System
gepflegt, statt sie zusätzlich in der Datenbank zu duplizieren:
- Kategorie (fest): Vorlesung/Seminar, Lernsession, Wiederholung,
  Frist/Prüfung — Farben identisch zu den Kalender-Kategorien-Tokens im
  Design-System
- Priorität: Hoch, Mittel, Niedrig, Keine (Standard) — Farben identisch zum
  bestehenden Ampelsystem

Tabelle "aufgaben" (eine Zeile pro Todo-Eintrag):
- id
- user_id            → verweist auf den eingeloggten Nutzer (RLS-Muster aus
                        PROJ-1)
- titel              → Pflichtfeld, max. 200 Zeichen
- datum              → optional
- zeittyp            → "ganztag" oder "zeitslot", nur gesetzt, wenn ein
                        Datum vorhanden ist; sonst leer
- start_zeit / end_zeit → nur gesetzt, wenn zeittyp "zeitslot" ist; end_zeit
                        muss nach start_zeit liegen
- kategorie_fest     → einer von Vorlesung/Seminar, Lernsession,
                        Wiederholung, Frist/Prüfung, oder leer
- eigene_kategorie_id → verweist optional auf "aufgaben_kategorien" (siehe
                        unten); höchstens eines von kategorie_fest/
                        eigene_kategorie_id ist gleichzeitig gesetzt, nie
                        beide
- prioritaet         → Hoch/Mittel/Niedrig/Keine, Standard "Keine"
- erledigt           → true/false, Standard false
- im_kalender        → true/false, Standard true (Datenfeld für PROJ-9,
                        siehe Out of Scope in der Spezifikation)
- created_at

Tabelle "aufgaben_kategorien" (eigene, vom Nutzer angelegte Kategorien):
- id
- user_id            → RLS-Muster aus PROJ-1
- name               → max. 60 Zeichen, Dedupe case-insensitive pro Nutzer
                        (identisches Prinzip wie die Themen-Dedupe in PROJ-2)
- farbe              → eine von mehreren Farben aus einer festen Palette
                        (kein freier Farbwähler), analog zur Farbauswahl im
                        HTML-Prototyp
- created_at

Folgende Werte sind nicht gespeichert, sondern werden bei jedem Laden live
berechnet (identisches Prinzip wie die zeitabhängigen Badges in PROJ-3/4/5 —
ein gespeicherter Wert würde sonst veralten):
- Überfällig-Status = Datum liegt vor heute UND erledigt ist false
- Datumsgruppen-Label (Heute/Morgen/Gestern/Datum) über die bereits
  vorhandenen Datumsfunktionen `diffTage`/`heuteISO` (PROJ-3), nicht neu
  implementiert

Zugriffsregel (Row Level Security) für beide Tabellen: identisches, flaches
Muster wie in PROJ-1–5 — direkt über user_id, kein verschachtelter
Eltern-Check nötig (anders als z.B. bei "klausur_teile" in PROJ-5).

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, zentral
und über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **Feste Kategorien und Priorität als Wertelisten im Code, nicht als Datenbank-Tabelle:** Es gibt keinen Bedarf, sie zur Laufzeit zu ändern; Bezeichnung und Farbe bleiben so an einer Stelle im Design-System gepflegt (analog zu den Bewertungstypen in PROJ-3/4), statt eine zusätzliche Tabelle nur für vier feste Zeilen zu pflegen.
- **Eigene Kategorien als separate, flache Tabelle statt einer gemeinsamen Tabelle mit den festen Kategorien:** Vermeidet eine Migration mit Seed-Daten nur für vier feste Zeilen (wie bei "faecher" in PROJ-2) und hält die Unterscheidung "fest vs. eigen" eindeutig über zwei getrennte, sich gegenseitig ausschließende Felder auf "aufgaben" ab, statt einer Tabelle mit gemischtem Ursprung.
- **Route `/todos`, Tabellenname `aufgaben`:** Die Route folgt dem im Prototyp und in INDEX.md verwendeten Feature-Namen "Todo-Liste"; der Tabellenname folgt der sonst durchgängig deutschen Benennung in der Datenbank (`karteikarten`, `klausuren`, `themen`, `faecher`). Dieselbe Diskrepanz zwischen Routen- und Tabellenname existiert bereits bei PROJ-5 (`/probeklausuren` → Tabelle `klausuren`).
- **Eigene Kategorie-Farbe aus fester Palette statt freiem Farbwähler:** Verhindert unleserliche oder mit dem Design-System kollidierende Farben, deutlich einfacher umzusetzen — identisches Prinzip zur Farbauswahl im HTML-Prototyp.
- **DB-seitiger Check-Constraint für `end_zeit > start_zeit`:** Verteidigung in der Tiefe zusätzlich zur Zod-Validierung — identisches Prinzip wie der Punkte-Check (`erreichte ≤ max`) in PROJ-5.
- **Gegenseitiger Ausschluss von `kategorie_fest`/`eigene_kategorie_id` auf Anwendungsebene (Zod + UI) durchgesetzt, nicht als Datenbank-Constraint:** einfacher umzusetzen, für eine Single-User-App ausreichend robust — analog dazu, wie auch andere Geschäftsregeln in PROJ-1–5 nicht als DB-Constraints, sondern in der Anwendungslogik durchgesetzt werden.
- **Überfällig-Status und Datumsgruppen-Label werden bei jedem Laden live berechnet, nie gespeichert:** identisches Prinzip wie die Nachschreiben-Fälligkeit/Status-Badges in PROJ-3/4/5, da beide vom aktuellen Datum abhängen und als gespeicherter Wert sofort veralten würden. Nutzt dafür die bereits vorhandenen Funktionen `diffTage`/`heuteISO` aus `karteikarten-intervall.ts` statt sie zu duplizieren (siehe bereits in PROJ-5 angewandtes Muster).
- **Keine Verknüpfung zu "faecher"/"themen" (PROJ-2):** deckt sich mit der in der Spezifikation begründeten Out-of-Scope-Entscheidung — Todos sind nicht Teil der Kompetenzanalyse.
- **Server Actions statt eigener API-Routen, RLS-Muster 1:1 aus PROJ-1–5:** konsistent mit dem bereits abgenommenen Muster im gesamten Projekt.

### Dependencies
- Keine neuen npm-Pakete nötig — react-hook-form, Zod und alle benötigten shadcn/ui-Komponenten (Select, Input, Dialog, AlertDialog, Switch, Checkbox, Badge) sind bereits aus PROJ-1–5 im Projekt installiert
- Supabase CLI (bereits im Einsatz) für die neue Migration

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
