# PROJ-2: Zentraler Themenkatalog

## Status: Deployed
**Created:** 2026-08-13
**Last Updated:** 2026-09-05

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Route `/themen` und das RLS-Muster

## User Stories
- Als Lukas möchte ich pro Fach neue Themen anlegen können, damit ich meine Karteikarten, Übungsaufgaben und Probeklausuren später danach einordnen kann.
- Als Lukas möchte ich gewarnt werden, wenn ein Themenname (unabhängig von Groß-/Kleinschreibung) innerhalb eines Fachs bereits existiert, damit keine Dopplungen durch unterschiedliche Schreibweisen entstehen.
- Als Lukas möchte ich ein bestehendes Thema auf der Themenverwaltungs-Seite umbenennen können, damit ich Tippfehler korrigieren kann, ohne die zugrunde liegende Zuordnung zu verlieren.
- Als Lukas möchte ich, dass eine Umbenennung automatisch überall dort sichtbar wird, wo das Thema bereits verwendet wird (z.B. bei bestehenden Karteikarten), damit ich Bezeichnungen konsistent halten kann, ohne jeden Eintrag einzeln anzupassen.
- Als Lukas möchte ich ein Thema auf der Themenverwaltungs-Seite löschen können, mit einer Sicherheitsabfrage davor, damit ich nicht versehentlich Themen entferne.
- Als Lukas möchte ich jedem Thema eine Klausurrelevanz (hoch/mittel/niedrig) zuweisen können, damit ich auf einen Blick sehe, welche Themen für das Examen besonders wichtig sind.
- Als Lukas möchte ich alle Themen gruppiert nach den 3 Klausurtagen und 11 Fächern auf einen Blick sehen, damit ich den Überblick über meinen Themenkatalog behalte.
- Als Entwickler (Claude Code) möchte ich eine zentrale, RLS-geschützte `themen`-Datenquelle haben, damit PROJ-3, PROJ-4 und PROJ-5 künftig konsistent darauf referenzieren können.
- Als Entwickler (Claude Code) möchte ich ein einheitliches technisches Muster für die Themenzuordnung (Datenmodell + UI-Komponente) etablieren, damit Karteikarten, Übungsaufgaben und Probeklausuren die Verknüpfung zu Themen identisch umsetzen, statt drei eigenständige Lösungen für dasselbe Konzept zu bauen.

## Out of Scope
- Verwaltung der 11 Fächer selbst (Name, Zuordnung zum Klausurtag) — diese sind laut PRD fest vorgegeben und in dieser Version nicht durch den Nutzer editierbar
- Die wiederverwendbare Mehrfachauswahl-Komponente (Chip-Eingabefeld), mit der Themen einer Karteikarte/Übungsaufgabe/Probeklausur zugeordnet werden — wird erst mit PROJ-3 (Karteikarten-Hub) gebaut, wenn das erste Formular sie tatsächlich braucht. **Vorgabe für PROJ-3:** Diese Komponente muss sowohl die Auswahl bereits angelegter Themen als auch die Neuanlage eines Themas direkt im Formular unterstützen (analog Design-Prototyp) — neu angelegte Themen erhalten dabei automatisch die Standard-Klausurrelevanz „Mittel". **Vorgabe für PROJ-4 und PROJ-5:** Beide übernehmen exakt dieselbe Komponente und dasselbe Zuordnungsmuster (Fremdschlüssel auf `themen.id`) aus PROJ-3 unverändert — keine eigenständige Neuentwicklung für Übungsaufgaben oder Probeklausuren
- Die eigentlichen Zuordnungstabellen zwischen Themen und Karteikarten/Übungsaufgaben/Probeklausuren — entstehen jeweils in PROJ-3/4/5
- Anzeige der Anzahl betroffener Einträge beim Löschen eines Themas ("Thema wird in X Einträgen verwendet") — technisch erst möglich, sobald PROJ-3/4/5 Fremdschlüssel auf `themen` anlegen; PROJ-2 zeigt vorerst nur einen generischen Bestätigungsdialog
- Der "Themen verwalten"-Button im Header der Hub-Seiten (wie im Design-Prototyp) — kommt mit PROJ-3/4/5, sobald diese Seiten existieren. Die eigenständige Route `/themen` bleibt jedoch dauerhaft bestehen (nicht nur Übergangslösung bis die Hubs existieren) — sie ist und bleibt der einzige Ort, an dem Themen umbenannt, gelöscht oder in der Klausurrelevanz eingestuft werden können
- Bearbeitung der Klausurrelevanz an anderer Stelle als der `/themen`-Seite — auch das künftige Chip-Eingabefeld in PROJ-3/4/5 erlaubt nur Auswahl/Neuanlage von Themen, keine Änderung der Klausurrelevanz
- Zusammenführen (Merge) von zwei versehentlich doppelt angelegten Themen — falls die Duplikatsprüfung durch stark abweichende Schreibweisen umgangen wird, bleibt nur manuelles Löschen/Neuanlegen
- Sortieren/Umsortieren der Themenreihenfolge per Drag & Drop
- Import/Export von Themenlisten
- Cross-Fach-Themen (ein Thema, das mehreren Fächern gleichzeitig zugeordnet ist) — jedes Thema gehört genau zu einem Fach
- Verwendung der Klausurrelevanz in der Kompetenzanalyse-Berechnung (PROJ-8) — hier wird nur das Datenfeld geschaffen, die fachliche Verknüpfung zur Berechnung ist Teil der PROJ-8-Spezifikation

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er `/themen` direkt aufruft, dann wird er zu `/login?redirect=/themen` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt und öffnet `/themen`, wenn die Seite lädt, dann werden alle 3 Klausurtage mit ihren jeweiligen Fächern angezeigt, jedes Fach mit seinen bestehenden Themen inkl. ihrer Klausurrelevanz
- [ ] Angenommen ein Fach hat noch keine Themen, wenn die Seite lädt, dann erscheint für dieses Fach der Hinweistext „Noch keine Themen"
- [ ] Angenommen der Nutzer wählt ein Fach und tippt einen neuen, in diesem Fach noch nicht existierenden Themennamen ein, wenn er auf „Hinzufügen" klickt (oder Enter drückt), dann wird das Thema mit der Standard-Klausurrelevanz „Mittel" angelegt und erscheint sofort unter dem gewählten Fach
- [ ] Angenommen der Nutzer tippt einen Themennamen ein, der (Groß-/Kleinschreibung sowie führende/folgende Leerzeichen ignoriert) bereits im gewählten Fach existiert, wenn er auf „Hinzufügen" klickt, dann wird die Aktion verhindert, eine Fehlermeldung „Dieses Thema existiert bereits in [Fach]" erscheint, und kein Duplikat wird angelegt
- [ ] Angenommen das Eingabefeld für einen neuen Themennamen ist leer oder enthält nur Leerzeichen, dann bleibt der „Hinzufügen"-Button deaktiviert
- [ ] Angenommen der Nutzer tippt einen Themennamen, der bereits (unter beliebiger Schreibweise) in einem anderen Fach existiert, wenn er auf „Hinzufügen" klickt, dann wird das Thema ohne Fehlermeldung angelegt (Duplikatsprüfung gilt nur innerhalb desselben Fachs)
- [ ] Angenommen ein Thema existiert, wenn der Nutzer auf `/themen` die Klausurrelevanz ändert (hoch/mittel/niedrig), dann wird die neue Einstufung sofort gespeichert und angezeigt
- [ ] Angenommen ein Thema existiert, wenn der Nutzer die Umbenennen-Aktion nutzt, einen neuen Namen einträgt und bestätigt, dann wird der Themenname aktualisiert, ohne dass sich die Themen-ID oder die Klausurrelevanz ändert
- [ ] Angenommen ein Thema wurde umbenannt und ist bereits einer Karteikarte/Übungsaufgabe/Probeklausur zugeordnet (sobald PROJ-3/4/5 existieren), dann zeigen diese Einträge automatisch den neuen Namen, ohne dass an den Einträgen selbst etwas geändert werden muss (Referenzierung über die unveränderte Themen-ID)
- [ ] Angenommen der neue Name beim Umbenennen kollidiert (Groß-/Kleinschreibung egal) mit einem anderen bestehenden Thema im selben Fach, wenn der Nutzer speichert, dann wird die Änderung verhindert und eine Fehlermeldung angezeigt
- [ ] Angenommen ein Thema existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor das Thema entfernt wird
- [ ] Angenommen der Bestätigungsdialog zum Löschen ist geöffnet, wenn der Nutzer abbricht, dann bleibt das Thema (inkl. Klausurrelevanz) unverändert erhalten
- [ ] Angenommen der Bestätigungsdialog zum Löschen ist geöffnet, wenn der Nutzer bestätigt, dann wird das Thema entfernt und verschwindet sofort aus der Liste
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Hinzufügen/Umbenennen/Löschen/Einstufen eines Themas fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und der vorherige Zustand bleibt unverändert sichtbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die `themen`-Tabelle zuzugreifen, dann verweigert RLS jeden Zugriff (keine Zeile wird zurückgegeben)

## Edge Cases
- Was passiert, wenn der Nutzer einen extrem langen Themennamen eingibt? → Validierungsfehler mit Zeichenlimit-Hinweis (Limit wird in `/architecture` festgelegt)
- Wie verhält sich die Duplikatsprüfung bei Sonder-/Leerzeichen-Varianten (z.B. „AO §370" vs. „AO  § 370")? → Nur exakte Übereinstimmung nach Trimmen und Groß-/Kleinschreibung wird erkannt; abweichende Schreibweisen werden nicht automatisch erkannt (siehe Out of Scope: kein Merge-Flow)
- Was zeigt `/themen`, bevor die Daten vom Server geladen sind? → Kurzer Ladezustand (Skeleton), kein Flackern
- Was passiert, wenn zwei Browser-Tabs gleichzeitig geöffnet sind und in beiden ein Thema angelegt/gelöscht/umbenannt wird? → Kein Konflikt-Handling in dieser Version (nur ein Nutzer, kein Concurrent-Editing-Schutz); die zuletzt gespeicherte Aktion gewinnt, Seite muss ggf. manuell neu geladen werden
- Wie reagiert die Anwendung, wenn ein Thema gelöscht wird, während der Nutzer gerade die Umbenennen-Aktion für dasselbe Thema in einem anderen Tab offen hat? → Kein Sonderfall in dieser Version (Single-User, geringe Wahrscheinlichkeit); die zweite Aktion schlägt mit der generischen Verbindungsfehlermeldung fehl, falls die Zeile nicht mehr existiert
- Ändert sich die Klausurrelevanz rückwirkend für bereits ausgewertete Kompetenzanalyse-Daten? → Nicht Teil von PROJ-2; die Verrechnung ist Sache der PROJ-8-Spezifikation

## Technical Requirements (optional)
- Security: `themen`-Tabelle ist RLS-geschützt nach dem in PROJ-1 etablierten Muster (kein Zugriff ohne gültige Session, Zugriff nur auf eigene Daten)
- Security: Die 11 Fächer und ihre Zuordnung zu den 3 Klausurtagen (Verfahrensrecht/Ertragsteuern/Bilanzsteuerrecht) sind feste Referenzdaten gemäß PRD, nicht über die UI editierbar
- Datenmodell: Jedes Thema hat neben Name und Fach-Zuordnung eine Klausurrelevanz (hoch/mittel/niedrig, Standard bei Neuanlage: mittel)
- Datenmodell: Künftige Hub-Tabellen (PROJ-3/4/5) müssen Themen über die Themen-ID referenzieren (Fremdschlüssel), nicht über eine Kopie des Namens — nur so wirkt sich ein Umbenennen automatisch überall aus, ohne Folge-Updates in den Hub-Tabellen
- Datenmodell: Die technische Umsetzung der Themenzuordnung (Aufbau der Zuordnungstabelle UND die verwendete UI-Komponente) ist für Karteikarten, Übungsaufgaben und Probeklausuren identisch — PROJ-3 etabliert das Muster einmalig, PROJ-4 und PROJ-5 übernehmen es unverändert statt eigener Lösungen
- Performance: Laden der Themenübersicht < 300ms (analog Auth-Check-Vorgabe aus PROJ-1)

## Open Questions
- [x] Zeichenlimit für Themennamen — in `/architecture` auf 100 Zeichen festgelegt (siehe Technical Decisions)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Themen können später mehreren Karteikarten/Übungsaufgaben/Probeklausur-Teilen gleichzeitig zugeordnet werden (Mehrfachauswahl statt Einzel-Dropdown) | Entspricht dem validierten Design-Prototyp (Chip-Eingabefeld); ein einzelner Eintrag kann fachlich mehrere Themen berühren (z.B. eine Klausur-Teilaufgabe zu AO und FGO) | 2026-08-13 |
| Themenverwaltung erhält eine eigenständige, dauerhaft bestehende Route `/themen` | Hub-Seiten (PROJ-3/4/5) existieren noch nicht; PROJ-2 muss eigenständig nutzbar und testbar sein. Bleibt auch nach PROJ-3/4/5 der einzige Ort für Umbenennen/Löschen/Klausurrelevanz-Einstufung | 2026-08-13 |
| Umbenennen und Löschen von Themen sind ausschließlich auf `/themen` möglich | Nutzerentscheidung: zentrale, kontrollierte Verwaltung statt verteilter Bearbeitungsmöglichkeiten in jedem Hub | 2026-08-13 |
| Löschen eines Themas erfordert einen Bestätigungsdialog | Schutz vor versehentlichem Datenverlust; einfacher als der Prototyp (der keinen Dialog zeigt) | 2026-08-13 |
| Duplikatsprüfung für Themennamen gilt pro Fach (case-insensitive), nicht global | Entspricht dem Prototyp-Verhalten; verschiedene Fächer dürfen gleichnamige Themen haben, ohne dass das als Duplikat gilt | 2026-08-13 |
| Jedes Thema erhält eine Klausurrelevanz (hoch/mittel/niedrig), nur über `/themen` editierbar | Nutzerentscheidung: sichtbare Priorisierung der Themen für die Prüfungsvorbereitung, zentral gepflegt statt verteilt | 2026-08-13 |
| Neue Themen erhalten automatisch die Klausurrelevanz „Mittel", keine Pflichtabfrage beim Anlegen | Hält das schnelle Anlegen eines Themas (auch später inline aus einem Hub-Formular heraus) reibungslos; Einstufung kann jederzeit auf `/themen` nachgetragen werden | 2026-08-13 |
| Umbenennen aktualisiert automatisch alle referenzierenden Einträge, da Hub-Tabellen künftig per Themen-ID (nicht Namenskopie) referenzieren müssen | Nutzerentscheidung: eine Umbenennung soll überall wirken, ohne Einträge einzeln anzupassen; etabliert das Referenzierungsmuster für PROJ-3/4/5 | 2026-08-13 |
| Die wiederverwendbare Mehrfachauswahl-Komponente (ThemaFeld) wird NICHT in PROJ-2 gebaut, sondern erst in PROJ-3 — muss dort aber sowohl Neuanlage als auch Auswahl bestehender Themen unterstützen | Ohne ein Hub-Formular, das sie einbindet, wäre die Komponente ungenutzter Code; die Anforderung „Neuanlage UND Auswahl bestehender Themen" wird hier für PROJ-3 festgehalten, damit sie beim Schreiben der PROJ-3-Spezifikation nicht verloren geht | 2026-08-13 |
| Die technische Umsetzung der Themenzuordnung (Datenmodell + UI-Komponente) muss in PROJ-3, PROJ-4 und PROJ-5 identisch sein, nicht drei unabhängige Lösungen | Nutzerentscheidung: verhindert inkonsistente Implementierungen desselben Konzepts über die drei Hubs hinweg; PROJ-3 (zuerst gebaut) etabliert das Muster, PROJ-4 und PROJ-5 übernehmen es unverändert | 2026-08-13 |
| Der Lösch-Bestätigungsdialog zeigt in PROJ-2 noch keine Anzahl betroffener Einträge | Mangels existierender Hub-Tabellen wäre die Zahl aktuell immer 0; die Zählung wird als Folgearbeit in PROJ-3/4/5 ergänzt, sobald diese Fremdschlüssel auf `themen` anlegen | 2026-08-13 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Die 11 Fächer werden als eigene, feste Datenbanktabelle (`faecher`) angelegt statt im Anwendungscode hinterlegt | Ermöglicht künftigen Features (Wiederholungsplan PROJ-7, Kompetenzanalyse PROJ-8) sauberes Verknüpfen/Filtern nach Fach und Klausurtag direkt in der Datenbank; die Datenbank selbst stellt sicher, dass jedes Thema wirklich einem gültigen Fach zugeordnet ist, statt sich auf Code-Constants zu verlassen | 2026-08-13 |
| Eindeutigkeit von Themennamen pro Fach (case-insensitive) wird als Datenbank-Regel erzwungen, nicht nur im Formular geprüft | Verhindert doppelte Themen zuverlässig, auch bei gleichzeitigen Anfragen — konsistent mit dem "keine Dopplungen"-Ziel aus der Spezifikation | 2026-08-13 |
| Themenname ist auf 100 Zeichen begrenzt | Löst die offene Frage aus der Spezifikation; ausreichend für auch längere Themenbezeichnungen (Praxisbeispiele aus dem Prototyp liegen bei ca. 40 Zeichen), verhindert aber ausufernde Eingaben in der Chip-Darstellung | 2026-08-13 |
| Alle Aktionen auf `/themen` (Hinzufügen, Umbenennen, Löschen, Klausurrelevanz ändern) laufen über Server Actions, keine eigenen API-Routen | Konsistent mit dem in PROJ-1 etablierten Muster (Login lief bereits über eine Server Action); Zugangsdaten/Mutationen werden serverseitig verarbeitet, kein Aufbau einer separaten REST-API nötig | 2026-08-13 |
| RLS auf `themen` folgt exakt dem PROJ-1-Muster (`user_id = auth.uid()`); `faecher` ist für jeden eingeloggten Nutzer lesbar, aber ohne Schreibrechte für den Nutzer | Konsistent mit der bereits abgenommenen Sicherheitsarchitektur; `faecher` ist reine Referenzdatenquelle, keine persönlichen Nutzerdaten | 2026-08-13 |
| Schema (Tabellen `faecher` + `themen`) und die Seed-Daten der 11 Fächer werden über eine versionierte Supabase-CLI-Migration angelegt | Gleiches Vorgehen wie bei der `profiles`-Tabelle in PROJ-1 — nachvollziehbare, im Repo versionierte Historie | 2026-08-13 |
| Keine neuen npm-Pakete nötig — Formulare nutzen react-hook-form + Zod (aus PROJ-1), UI nutzt die bereits installierten shadcn/ui-Komponenten Select, AlertDialog, Badge, Skeleton | Alle benötigten Bausteine sind bereits im Projekt vorhanden; PRD-Vorgabe "shadcn/ui first" | 2026-08-13 |
| Fach-zu-Klausurtag-Zuordnung der Seed-Daten (K1 Verfahrensrecht: AO/FGO/USt/BewG/ErbSt · K2 Ertragsteuern: ESt/KSt/GewSt/IntStR · K3 Bilanzsteuerrecht: Bilanz/UmwStR) per Web-Recherche gegen § 37 Abs. 3 StBerG, BStBK und Steuerberaterkammer München geprüft, nicht ungeprüft aus dem Prototyp übernommen | Gesetzestext definiert nur grobe Prüfungsgebiete, keine klausurscharfe Einzelfach-Zuordnung; bei Umwandlungssteuerrecht widersprachen sich Sekundärquellen (Tag 2 vs. Tag 3) — Nutzer hat als StB-Kandidat die Zuordnung zu Tag 3 (wie Prototyp) verbindlich bestätigt | 2026-08-13 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/themen (geschützte Route — Zugriff nur eingeloggt, sonst Redirect zu /login,
          gesichert durch die bestehende Middleware aus PROJ-1)
└── Themenverwaltungs-Seite
    ├── Seitentitel + Kurzbeschreibung
    │
    ├── Neues-Thema-Formular
    │   ├── Fach-Auswahl (Dropdown, alle 11 Fächer)
    │   ├── Themenname-Eingabefeld (max. 100 Zeichen)
    │   └── "Hinzufügen"-Button (deaktiviert bei leerem/nur-Leerzeichen-Namen)
    │
    ├── Themenübersicht (gruppiert, analog Design-Prototyp)
    │   └── Je Klausurtag (K1 Verfahrensrecht / K2 Ertragsteuern / K3 Bilanzsteuerrecht)
    │       └── Je Fach im Klausurtag
    │           ├── Fach-Titel
    │           └── Themen-Liste als Chips (oder Hinweistext "Noch keine Themen")
    │               └── Je Thema
    │                   ├── Themenname (per Umbenennen-Aktion editierbar)
    │                   ├── Klausurrelevanz-Auswahl (hoch/mittel/niedrig)
    │                   └── Löschen-Aktion → öffnet Bestätigungsdialog
    │
    ├── Lösch-Bestätigungsdialog (Abbrechen / Löschen)
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung fehlgeschlagen"-Hinweis bei Netzwerkfehlern)
```

### Data Model (in plain language)
```
Tabelle "faecher" (feste Referenzdaten, 11 Zeilen, einmalig per Migration
angelegt und befüllt, nicht über die UI editierbar):
- id
- name        → z.B. "Einkommensteuer"
- kuerzel     → z.B. "ESt"
- klausurtag  → 1, 2 oder 3 (Verfahrensrecht / Ertragsteuern / Bilanzsteuerrecht)

Tabelle "themen" (vom Nutzer gepflegt):
- id
- fach_id          → verweist auf "faecher"
- name              → max. 100 Zeichen
- klausurrelevanz   → hoch / mittel / niedrig, Standard bei Neuanlage: mittel
- user_id           → verweist auf den eingeloggten Nutzer (RLS-Muster aus PROJ-1)
- created_at

Eindeutigkeitsregel: Innerhalb desselben Fachs darf ein Themenname
(Groß-/Kleinschreibung ignoriert) nur einmal vorkommen — von der
Datenbank selbst erzwungen, nicht nur im Formular geprüft.

Zugriffsregel (Row Level Security):
- "themen": ein Nutzer sieht und bearbeitet ausschließlich eigene Themen
  (exakt das Muster aus PROJ-1: user_id = eingeloggter Nutzer)
- "faecher": für jeden eingeloggten Nutzer lesbar, vom Nutzer nicht
  veränderbar (feste Referenzdaten)

Wichtig für PROJ-3/4/5: Künftige Tabellen (Karteikarten, Übungsaufgaben,
Probeklausuren) verweisen auf ein Thema über dessen "id", nicht über eine
Kopie des Namens — dadurch wirkt sich ein Umbenennen automatisch überall
aus, ohne dass diese Tabellen angefasst werden müssen.

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, zentral
und über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **`faecher` als eigene Datenbanktabelle statt Code-Konstante:** erlaubt sauberes Verknüpfen/Filtern nach Fach und Klausurtag direkt in der Datenbank für künftige Features (Wiederholungsplan, Kompetenzanalyse), und die Datenbank erzwingt selbst, dass jedes Thema einem gültigen Fach zugeordnet ist.
- **Eindeutigkeit auf Datenbankebene statt nur im Formular:** zuverlässiger Schutz vor Duplikaten, auch bei gleichzeitigen Anfragen.
- **Server Actions statt eigener API-Routen:** konsistent mit dem bereits abgenommenen Muster aus PROJ-1 (Login-Formular); Mutationen laufen serverseitig, keine separate REST-API nötig.
- **RLS-Muster 1:1 aus PROJ-1 übernommen:** etabliertes, bereits geprüftes Sicherheitsmuster, keine neue Logik nötig.
- **Supabase-CLI-Migration für Schema + Seed-Daten:** gleiches, bereits bewährtes Vorgehen wie bei der `profiles`-Tabelle — nachvollziehbare Versionshistorie im Repo.
- **Themen-ID als Referenzpunkt für künftige Hub-Tabellen:** technische Grundlage dafür, dass Umbenennen sich automatisch überall auswirkt (Anforderung aus der Spezifikation).

### Dependencies
- Keine neuen npm-Pakete — react-hook-form, Zod und die benötigten shadcn/ui-Komponenten (Select, AlertDialog, Badge, Skeleton, Input, Button) sind bereits im Projekt installiert
- Supabase CLI (lokales Werkzeug, kein npm-Paket) — bereits aus PROJ-1 im Einsatz, für die neue Migration

## Frontend Implementation Notes (Frontend Developer)

**Umgesetzt (2026-08-13):**
- `/themen` (`src/app/themen/page.tsx`): Seitentitel, Kurzbeschreibung, rendert `ThemenManager`
- `src/components/themen/themen-manager.tsx`: hält den Themen-Zustand, Gruppierung nach Klausurtag → Fach, gemeinsamer Lösch-Bestätigungsdialog (shadcn `AlertDialog`)
- `src/components/themen/neues-thema-form.tsx`: Fach-Auswahl (gruppiert nach K1/K2/K3, shadcn `Select`) + Themenname-Eingabe, react-hook-form + Zod (gleiches Muster wie `login-form.tsx` aus PROJ-1), „Hinzufügen" deaktiviert bei leerem Feld
- `src/components/themen/thema-chip.tsx`: Chip mit Inline-Umbenennen (Stift-Icon → Eingabefeld, Enter/Escape), Klausurrelevanz-Auswahl (kompakter, farblich abgestufter `Select`: Hoch = gefüllt/primary, Mittel = secondary, Niedrig = outline — bewusst NICHT die Ampelfarben aus dem Design-System verwendet, da diese im Design-System für Kompetenzgrad reserviert sind und sonst mit PROJ-8 kollidieren würden), Löschen-Trigger
- `src/lib/klausurtage.ts`: Platzhalter-Referenzdaten der 11 Fächer/3 Klausurtage (siehe Hinweis unten) + Typen (`Fach`, `Klausurtag`, `Thema`, `Klausurrelevanz`)
- `src/lib/schemas/thema.ts`: Zod-Schema für Themenname (1–100 Zeichen, getrimmt) und das Neues-Thema-Formular
- Duplikatsprüfung (case-insensitive, getrimmt, pro Fach) und Umbenennen-Kollisionsprüfung laufen bereits vollständig client-seitig gegen den lokalen Zustand
- Alle im Frontend sinnvoll testbaren Acceptance Criteria demonstriert: gruppierte Übersicht, Leerer-Zustand pro Fach, Anlegen mit Standard-Klausurrelevanz „Mittel", Duplikat-Blockade pro Fach, gleicher Name in anderem Fach erlaubt, Umbenennen (ID/Klausurrelevanz bleiben unverändert), Umbenennen-Kollision blockiert, Klausurrelevanz ändern, Lösch-Dialog (Abbrechen erhält, Bestätigen entfernt), 100-Zeichen-Limit, „Hinzufügen" deaktiviert bei leerem Feld
- AC1 (Redirect bei fehlender Session) ist bereits durch die bestehende Middleware aus PROJ-1 automatisch erfüllt, keine neue Logik nötig — per `curl` gegen den laufenden Dev-Server verifiziert: `GET /themen` ohne Session → `307` zu `/login?redirect=%2Fthemen`

**Bewusst noch nicht umgesetzt (folgt in /backend):**
- Komplett lokaler React-Zustand, keine echte Persistenz — Themen gehen bei Neuladen der Seite verloren; wird durch echte Supabase-Anbindung (Server Actions statt lokalem State) ersetzt
- `faecher`- und `themen`-Tabellen, Migration, RLS existieren noch nicht — `src/lib/klausurtage.ts` ist ausdrücklich als Platzhalter markiert und wird ersetzt, sobald der Server Component die echten Fächer aus der Datenbank lädt
- „Verbindung fehlgeschlagen"-Meldung (AC15) kann erst mit einem echten Supabase-Aufruf getestet werden
- Lade-Skeleton ist noch nicht verdrahtet, da es noch keinen echten asynchronen Ladevorgang gibt (analog PROJ-1: Ladezustand war dort ebenfalls erst nach Backend-Anbindung sinnvoll testbar)
- AC10 (Umbenennen wirkt sich auf bereits zugeordnete Karteikarten/Übungsaufgaben/Probeklausuren aus) kann erst getestet werden, sobald PROJ-3/4/5 existieren und per Fremdschlüssel auf `themen.id` referenzieren

**Getestet im Browser (Playwright, headless Chromium):** Desktop (1440px), Tablet (768px), Mobile (375px). Golden Path (Fach wählen → Thema anlegen → Klausurrelevanz ändern → umbenennen) sowie Edge Cases (Duplikat im selben Fach blockiert, gleicher Name in anderem Fach erlaubt, Umbenennen-Kollision blockiert, Lösch-Dialog Abbrechen/Bestätigen, 100-Zeichen-Limit, leeres Formular) — alle wie erwartet, kein horizontales Overflow auf keiner Breite.

**Hinweis zur Testmethode:** `/themen` ist bereits durch die bestehende Middleware aus PROJ-1 geschützt; ohne Test-Account wurde die Auth-Prüfung in `src/proxy.ts` für die Dauer des Browser-Tests lokal auskommentiert und danach vollständig zurückgesetzt (`git diff` vor dem Commit leer verifiziert) — kein Einfluss auf den committeten Code.

**Bekannte vorbestehende Tooling-Lücke (nicht PROJ-2-spezifisch, siehe auch PROJ-1):** `npm run lint` schlägt weiterhin fehl (fehlendes `eslint.config.js` für Next.js 16). `npm run build` und `npm test` (17/17) laufen fehlerfrei durch.

## Backend Implementation Notes (Backend Developer)

**Umgesetzt (2026-08-13):**
- Migration `supabase/migrations/20260813211609_create_themenkatalog.sql`: `faecher`-Tabelle (11 Fächer, 3 Klausurtage, per Migration befüllt; RLS erlaubt nur SELECT für eingeloggte Nutzer, kein Insert/Update/Delete) und `themen`-Tabelle (RLS-Muster 1:1 aus PROJ-1: `auth.uid() = user_id` für SELECT/INSERT/UPDATE/DELETE, UPDATE zusätzlich mit `WITH CHECK`, damit `user_id` nicht per direktem API-Aufruf umgebogen werden kann). Eindeutigkeits-Index auf `(user_id, fach_id, lower(btrim(name)))` erzwingt die Duplikatsprüfung pro Fach auf Datenbankebene (nicht nur im Formular). Check-Constraints für Namenslänge (1–100 Zeichen, getrimmt) und Klausurrelevanz (`hoch`/`mittel`/`niedrig`)
- `src/app/themen/actions.ts`: Server Actions `addThema`, `renameThema`, `changeKlausurrelevanz`, `deleteThema` — Zod-Validierung vor jedem Supabase-Aufruf, Unique-Constraint-Verletzung (Postgres-Code `23505`) wird in eine sprechende Fehlermeldung mit echtem Fachnamen übersetzt (kleiner Folge-Query auf `faecher`), alle sonstigen Fehler (inkl. Netzwerkfehler) laufen auf die einheitliche „Verbindung fehlgeschlagen"-Meldung (AC15), `revalidatePath("/themen")` nach jeder erfolgreichen Mutation
- `src/app/themen/page.tsx`: jetzt ein async Server Component, lädt Fächer + eigene Themen direkt aus Supabase (RLS filtert `themen` automatisch auf den eingeloggten Nutzer) — keine Platzhalterdaten mehr
- `src/lib/klausurtage.ts`: Platzhalter-Konstante `KLAUSURTAGE` entfernt, durch `groupFaecherByKlausurtag()` ersetzt (gruppiert die aus der DB geladenen Fächer nach den 3 festen, bereits verifizierten Klausurtag-Titeln)
- `ThemenManager`/`NeuesThemaForm`/`ThemaChip` auf die echten Server Actions umgestellt: Hinzufügen zeigt Spinner + deaktivierten Button während der Anfrage, Umbenennen/Klausurrelevanz-Änderung zeigen Fehler inline am Chip, Löschen zeigt Fehler im Bestätigungsdialog (Dialog bleibt bei Fehler offen, statt den vorherigen Zustand zu verlieren)
- 24 neue Vitest-Tests (`src/app/themen/actions.test.ts`, gemockter Supabase-Client nach dem Muster aus `login/actions.test.ts`): Validierung ohne Supabase-Aufruf, Erfolgsfall, Duplikat-Fehlermeldung mit Fachnamen, genereller Verbindungsfehler — für jede der vier Server Actions

**Migration noch nicht auf das Live-Projekt angewendet:** wie schon in PROJ-1 gibt es in dieser Sandbox keinen Zugriff auf Supabase-Projekt-Ref/DB-Passwort. Nutzer wendet die Migration selbst an:
```
npx supabase db push
```
Danach ist `/themen` mit echten, persistenten Daten nutzbar.

**Getestet:**
- `npm run build` und `npm test` (33/33, davon 24 neue Server-Action-Tests) laufen fehlerfrei durch
- Kein Live-Browser-Test möglich, da `faecher`/`themen` erst nach `supabase db push` existieren — Live-Verifikation gegen echte Daten ist Teil von `/qa` (analog PROJ-1, das dort mit einem dedizierten QA-Test-Account gegen das Live-Projekt nachgetestet hat)

**Bekannte vorbestehende Tooling-Lücke (nicht PROJ-2-spezifisch):** `npm run lint` weiterhin ohne Wirkung (siehe PROJ-1/Frontend-Notiz zu `eslint.config.js`).

## QA Test Results

**Tested:** 2026-08-13
**App URL:** http://localhost:3000 (Server Actions gegen das echte, verknüpfte Supabase-Live-Projekt)
**Tester:** QA Engineer (AI)
**Browser:** Chromium (Desktop 1440px, Tablet 768px, Mobile 375px), WebKit/Safari-Engine (Desktop + „Mobile Safari"/iPhone-13-Viewport im E2E-Lauf)
**Test-Account:** dedizierter QA-Test-Account (vom Nutzer bereitgestellt, nicht der persönliche Produktiv-Account)

### Migration — 1 Bug gefunden und sofort behoben
Beim ersten `npx supabase db push` durch den Nutzer schlug die Migration fehl: `ERROR: function uuid_generate_v4() does not exist (SQLSTATE 42883)` — die `uuid-ossp`-Extension ist auf diesem Supabase-Projekt nicht aktiviert. Siehe BUG-1. Migration wurde transaktional zurückgerollt (kein Teilzustand in der DB), Fix angewendet, zweiter `db push`-Versuch lief erfolgreich durch (vom Nutzer bestätigt: `faecher` mit 11 Zeilen, `themen` leer angelegt).

### Acceptance Criteria Status

#### AC1: Redirect bei fehlender Session
- [x] `/themen` ohne Session → Redirect zu `/login?redirect=%2Fthemen` (E2E-Test + live in allen 3 Engines verifiziert)

#### AC2: Geladene Seite zeigt alle Klausurtage/Fächer/Themen inkl. Klausurrelevanz
- [x] Live gegen echtes Supabase-Projekt: K1/K2/K3 mit allen 11 Fächern korrekt geladen und gruppiert (Chromium + WebKit)
- [x] Klausurrelevanz wird korrekt aus der DB gelesen und angezeigt

#### AC3: Leerer Zustand pro Fach
- [x] „Noch keine Themen" erscheint korrekt für Fächer ohne Themen (live bestätigt beim frischen Test-Account)

#### AC4: Neues Thema anlegen, Standard-Klausurrelevanz „Mittel"
- [x] Live in Supabase angelegt (nicht nur Client-State) — verifiziert per Seiten-Reload, Thema und Klausurrelevanz „Mittel" blieben erhalten

#### AC5: Duplikat im selben Fach blockiert
- [x] Case-insensitive, getrimmt — DB-Unique-Constraint (Code `23505`) greift tatsächlich, Fehlermeldung „Dieses Thema existiert bereits in [Fach]" korrekt mit echtem Fachnamen

#### AC6: „Hinzufügen" deaktiviert bei leerem Feld
- [x] Bestätigt

#### AC7: Gleicher Name in anderem Fach erlaubt
- [x] Live bestätigt (Duplikatsprüfung ist korrekt pro Fach skaliert, nicht global)

#### AC8: Klausurrelevanz ändern
- [x] Änderung wird sofort gespeichert und übersteht einen Seiten-Reload (echte Persistenz)

#### AC9: Umbenennen, ID/Klausurrelevanz bleiben unverändert
- [x] Live bestätigt: Name geändert, Klausurrelevanz „Hoch" blieb nach dem Umbenennen erhalten

#### AC10: Umbenennen wirkt sich auf zugeordnete Karteikarten/Übungsaufgaben/Probeklausuren aus
- [ ] NICHT TESTBAR: PROJ-3/4/5 existieren noch nicht, keine Hub-Tabelle referenziert `themen.id`. Das zugrunde liegende Muster (Referenzierung über ID statt Namenskopie) ist gelegt; der eigentliche Verhaltens-Test folgt, sobald PROJ-3 existiert

#### AC11: Umbenennen-Kollision blockiert
- [x] Live bestätigt, DB-Constraint greift korrekt auch beim Update

#### AC12–AC14: Lösch-Bestätigungsdialog (öffnen / abbrechen / bestätigen)
- [x] Alle drei Zustände live bestätigt — Abbrechen erhält das Thema, Bestätigen entfernt es tatsächlich aus Supabase (nicht nur aus der UI)

#### AC15: „Verbindung fehlgeschlagen"-Meldung bei Fehlschlag
- [x] Verifiziert über die 8 Verbindungsfehler-Unit-Tests aus `/backend` (gemockter Supabase-Client: generischer Fehler UND fehlende Session → einheitliche Meldung, für alle vier Server Actions)
- [ ] NICHT LIVE REPRODUZIERT: ein echter Netzwerkausfall zwischen Next.js-Server und Supabase lässt sich aus dem Browser heraus nicht auslösen (Server Actions laufen serverseitig) — bewusste Grenze, wie schon bei ähnlichen Fällen in PROJ-1

#### AC16: RLS verweigert Zugriff ohne gültige Session
- [x] App-seitig verifiziert: jede Server Action prüft `auth.getUser()` und bricht ohne Session ab, bevor überhaupt eine Query läuft (Unit-Test „zeigt Verbindungsfehler wenn kein Nutzer in der Session ist")
- [x] Policy-Korrektheit der Migration per Code-Review bestätigt: `themen` hat für SELECT/INSERT/UPDATE/DELETE ausschließlich `auth.uid() = user_id`-Policies, `faecher` hat keine Schreib-Policies für Nutzer
- [ ] Kein vollständiger Black-Box-Test per direktem REST-API-Aufruf ohne Session durchgeführt (gleiche bewusste Grenze wie in PROJ-1: dafür bräuchte es einen Aufruf außerhalb der App mit dem Anon-Key, der in diesem Feature clientseitig nirgends exponiert wird, da alle Mutationen über Server Actions laufen)

### Edge Cases Status

#### EC-1: Extrem langer Themenname
- [x] Clientseitig verhindert (100-Zeichen-`maxLength`, live getestet)
- [x] Serverseitig per Zod-Schema verifiziert (Unit-Test)
- [ ] DB-CHECK-Constraint selbst nicht direkt exerziert (nur per Code-Review der Migration bestätigt) — echte Verletzung würde Zod bereits vorher abfangen, DB-Regel ist bewusstes Defense-in-Depth

#### EC-2: Sonder-/Leerzeichen-Varianten werden nicht als Duplikat erkannt
- [x] Erwartetes Verhalten per Code-Review bestätigt (`lower(btrim(name))`-Vergleich, keine Fuzzy-Erkennung) — entspricht der Spec, kein Bug

#### EC-3: Ladezustand vor dem ersten Rendern
- [x] Kein Flackern beobachtet (Next.js Server Component liefert fertig gerenderte Daten aus, kein Client-seitiger Nachlade-Sprung)

#### EC-4/EC-5: Mehrere Tabs / gleichzeitige Aktionen
- [ ] NICHT GETESTET (laut Spec bewusst kein Konflikt-Handling in dieser Version, Single-User-Kontext)

#### EC-6: Klausurrelevanz rückwirkend für Kompetenzanalyse
- N/A für PROJ-2 (Spec-Aussage: Sache von PROJ-8)

### Security Audit Results
- [x] Authentication: `/themen` ohne Session konsequent verweigert (E2E + live, alle Engines)
- [x] Authorization (RLS): Policies per Code-Review korrekt (`auth.uid() = user_id`), App-Layer verweigert zusätzlich ohne Session — kein Multi-User-Black-Box-Test möglich (nur 1 Account, siehe AC16)
- [x] Input-Validierung / XSS: `<img src=x onerror=alert(1)>` als Themenname live angelegt — React escaped korrekt, kein Script-Alert ausgelöst, Payload erscheint nur als Text
- [x] Fehlermeldungen leaken keine internen Details: Server Actions geben ausschließlich kontrollierte Zod-Meldungen oder die generische Verbindungsfehler-Meldung zurück, nie rohe Supabase-/Postgres-Fehlertexte
- [x] Race Condition (Doppelklick „Hinzufügen"): Button deaktiviert sich synchron beim ersten Klick, ein zweiter Klick kann den nativen disabled-Button gar nicht erst treffen — zusätzliche Absicherung durch den DB-Unique-Constraint (bereits über AC5 verifiziert)
- Rate-Limiting: nicht Teil dieser Spec (Single-User-App, wie in PROJ-1 bewusst entschieden) — kein Gap, sondern bestätigte Produktentscheidung

### Regression Testing (PROJ-1)
- [x] Alle 10 bestehenden PROJ-1-E2E-Tests weiterhin grün (`npm run test:e2e`)
- [x] Login, Dashboard (korrekte E-Mail-Anzeige), Logout, erneuter Schutz nach Logout — live mit dem QA-Account nachgetestet, keine Regression durch PROJ-2

### Automated Tests
- **Unit-Tests (Vitest):** 37/37 grün — 24 Server-Action-Tests (PROJ-2 Backend) + 4 neue Tests für `groupFaecherByKlausurtag` (`src/lib/klausurtage.test.ts`) + 9 bereits bestehende (PROJ-1)
- **E2E-Tests (Playwright):** 14/14 grün — `tests/PROJ-2-zentraler-themenkatalog.spec.ts` (2 neue Tests: Redirect bei fehlender Session, kein Query-String-Opt-out) + 10 bestehende PROJ-1-Tests, über Chromium + Mobile Safari
- Bewusst NICHT in die committete E2E-Suite aufgenommen: authentifizierte Abläufe (Anlegen/Umbenennen/Löschen/Klausurrelevanz), da dafür echte Zugangsdaten nötig wären — genau wie bei PROJ-1 werden diese Pfade nicht mit Secrets im Repo getestet, sondern live während der QA-Session (siehe oben) verifiziert
- `npm run build` läuft fehlerfrei durch. `npm run lint` weiterhin ohne Wirkung (vorbestehende Tooling-Lücke aus PROJ-1, nicht PROJ-2-spezifisch)

### Bugs Found

#### BUG-1: Migration verwendete `uuid_generate_v4()`, obwohl `uuid-ossp` nicht aktiviert war
- **Severity:** High (blockierte die komplette Migration und damit jede Funktion des Features)
- **Steps to Reproduce:**
  1. Migration `20260813211609_create_themenkatalog.sql` mit `id uuid primary key default uuid_generate_v4()` erstellen
  2. `npx supabase db push` gegen ein Supabase-Projekt ausführen, auf dem die `uuid-ossp`-Extension nicht aktiviert ist
  3. Erwartet: Migration wird angewendet
  4. Tatsächlich: `ERROR: function uuid_generate_v4() does not exist (SQLSTATE 42883)`, Migration bricht ab
- **Status:** Gefunden und noch in derselben Session behoben (Wechsel auf `gen_random_uuid()`, seit PostgreSQL 13 fest im Core, keine Extension nötig) — zweiter `db push`-Versuch erfolgreich, vom Nutzer bestätigt
- **Priority:** Bereits gefixt, kein offener Bug mehr

### Summary
- **Acceptance Criteria:** 14/16 vollständig verifiziert, 2 bewusst nicht testbar (AC10 wartet auf PROJ-3/4/5; AC15 nur per Unit-Test statt live reproduzierbar — beides dokumentierte, nachvollziehbare Grenzen, keine offenen Bugs)
- **Bugs Found:** 1 total (1 High, bereits gefixt — 0 offene Bugs)
- **Security:** Pass — keine Findings offen
- **Production Ready:** YES (im Rahmen des Non-Goals „kein Multi-User-Betrieb" — PROJ-2 ist für den persönlichen Gebrauch bereit)
- **Recommendation:** Deploy (bzw. für dieses Projekt: als nächstes `/write-spec PROJ-3`, das auf PROJ-2 aufbaut — siehe Deployment-Abschnitt zur bewussten Deployment-Entscheidung aus PROJ-1)

## Deployment
**Produktions-URL:** https://examensplaner-v2fg.vercel.app
**Deployed:** 2026-09-05 — gemeinsam mit PROJ-1 und PROJ-3 (selbe Next.js-Codebase, ein Deployment). Details zu Pre-Deployment-Fixes, Vercel-Setup und Verifikation siehe Deployment-Abschnitt in PROJ-1.
