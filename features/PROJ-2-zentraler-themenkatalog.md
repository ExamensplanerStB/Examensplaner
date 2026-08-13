# PROJ-2: Zentraler Themenkatalog

## Status: Planned
**Created:** 2026-08-13
**Last Updated:** 2026-08-13

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
- [ ] Zeichenlimit für Themennamen — wird in `/architecture` festgelegt

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

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
