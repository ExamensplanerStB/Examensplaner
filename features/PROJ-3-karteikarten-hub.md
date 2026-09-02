# PROJ-3: Karteikarten-Hub

## Status: Planned
**Created:** 2026-09-02
**Last Updated:** 2026-09-02

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Hub-Route und das RLS-Muster
- PROJ-2 (Zentraler Themenkatalog) — Karteikarten referenzieren Themen über `themen.id`; die wiederverwendbare `ThemaFeld`-Komponente (Chip-Mehrfachauswahl mit Inline-Neuanlage), die PROJ-2 für PROJ-3 vorgesehen hat, wird hier erstmals gebaut und dann unverändert an PROJ-4/PROJ-5 weitergegeben

## User Stories
- Als Lukas möchte ich neue Karteikarten mit Frage, Fach, mindestens einem Thema, Typ (Theorie/Klausurtechnik) und einer Selbsteinschätzung anlegen können, damit ich mein Wissen in kleine, gezielt abrufbare Einheiten zerlege.
- Als Lukas möchte ich jede fällige Karte in einer fokussierten Session nacheinander abrufen — Frage lesen, aus dem Gedächtnis antworten, dann meine vorherige Fehlernotiz/Quelle zum Abgleich aufdecken und mich neu einschätzen —, damit ich echtes Retrieval Practice statt passives Wiederlesen betreibe.
- Als Lukas möchte ich, dass das nächste Wiederholungsintervall automatisch aus meiner Selbsteinschätzung berechnet wird (wachsende Abstände bei wiederholtem Erfolg, Reset bei Misserfolg), damit sich meine Lernzeit auf das konzentriert, was am dringendsten wieder aufgefrischt werden muss.
- Als Lukas möchte ich eine Fehlernotiz zu einer Karte hinterlegen können, die standardmäßig verborgen bleibt und erst per Klick sichtbar wird, damit ich beim erneuten Abrufen nicht unbewusst an die Lösung erinnert werde.
- Als Lukas möchte ich auf einen Blick sehen, ob eine Karte aktuell als „gültig" (sicher abrufbar) oder „verfallen" gilt, damit ich erkenne, wo mein Wissen tatsächlich brüchig geworden ist, statt mich auf eine veraltete Bewertung zu verlassen.
- Als Lukas möchte ich Karten nach Fach und Typ filtern und nach Fälligkeit oder Fach sortieren können, damit ich gezielt in einem Themenbereich üben kann.
- Als Entwickler (Claude Code) möchte ich jede Bewertung zusätzlich in einer Historientabelle protokollieren, damit PROJ-8 (Kompetenzanalyse) später Verlaufsdiagramme und Kalibrierung bauen kann, ohne dass rückwirkend Daten fehlen.

## Out of Scope
- Bloom'sche Taxonomie als eigenes Klassifikationsfeld — bewusst nicht umgesetzt (siehe Decision Log); es existiert nur die 5-stufige Selbsteinschätzung
- Freistellungsphase-Deckelung und „Intervall nie über das Prüfungsdatum hinaus" (Abschnitt 2.2 der Berechnungsspezifikation) — verschoben, da noch kein Prüfungsdatum-Feld existiert; wird nachgezogen, sobald PROJ-9 (Dashboard) das editierbare Prüfungsdatum bereitstellt
- Ein editierbares Prüfungsdatum-Feld selbst — gehört fachlich zum Dashboard (PROJ-9), nicht zum Karteikarten-Hub
- Eine Parameter-Einstellungsseite für die Wiederholungs-Parameter (START_INTERVALL, FAKTOR_5, FUZZ etc.) — feste Default-Werte im Code, keine UI
- Kalibrierungs-Auswertungen (Abschnitt 9 der Berechnungsspezifikation: prädiktive Validität, Selbstbewertungs-Bias) — setzen ≥ 10 erfasste Probeklausuren mit Teilen voraus (PROJ-5/PROJ-8 existieren noch nicht), eigenständiges künftiges Feature
- Verlaufsdiagramme über die `reviews`-Historie — PROJ-3 schreibt nur die Rohdaten, Visualisierung ist Teil von PROJ-8
- Themen-Stufenlogik (Stufe 0–4 pro Thema, Subsumtionsregel, Fach-Ebene-Kennzahlen, Abschnitte 5/8 der Berechnungsspezifikation) — vollständig Teil von PROJ-8; PROJ-3 berechnet Gültigkeit nur pro einzelner Karte (Abschnitt 4)
- Wiederholungsplan (hub-übergreifende Aggregation aller fälligen Wiederholungen über Karteikarten/Übungsaufgaben/Probeklausuren hinweg, inkl. "als erledigt markieren" unabhängig von einer Bewertung) — eigenständiges Feature PROJ-7
- Wiederholungslogik für Übungsaufgaben und Probeklausuren (Abschnitte 3 und 6 der Berechnungsspezifikation) — Teil von PROJ-4 bzw. PROJ-5
- Mehrfachauswahl/Stapel-Aktionen (Bulk-Löschen, Bulk-Bewerten) für Karteikarten
- Import/Export von Karteikarten
- Offline-Nutzung ohne Internetverbindung
- Bilder/Anhänge an Karteikarten (nur Text)
- Zeitmessung während der Fokuseinheit (Lernzeittracking ist laut PRD P2/Non-Goal dieser Version)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Karteikarten-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn der Karteikarten-Hub lädt, dann werden alle eigenen Karten geladen und entsprechend der aktuellen Filter/Sortierung angezeigt (Standard: alle Typen, alle Fächer, sortiert nach Fälligkeit)
- [ ] Angenommen es existieren noch keine Karten, wenn der Hub lädt, dann erscheint der Hinweis „Keine Karten" statt einer leeren Liste

### Anlegen
- [ ] Angenommen der Nutzer öffnet das Formular für eine neue Karte, wenn er ein Fach wählt, dann wird das Themenfeld aktiv und zeigt ausschließlich Themen dieses Fachs zur Auswahl oder Neuanlage
- [ ] Angenommen Fach, Typ, Frage oder mindestens ein Thema fehlen, wenn der Nutzer speichern möchte, dann wird das Speichern verhindert und für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen Fach, Typ, Frage und mindestens ein Thema sind ausgefüllt, wenn der Nutzer speichert, dann wird die Karte angelegt, erhält ein erstes Intervall gemäß der Erstbewertungs-Formel (Technical Requirements) und erscheint sofort in der Liste
- [ ] Angenommen der Nutzer tippt im Themenfeld einen im gewählten Fach noch nicht existierenden Namen ein, wenn er die Neuanlage-Option wählt, dann wird das Thema mit der Standard-Klausurrelevanz „Mittel" angelegt (PROJ-2-Verhalten) und der Karte direkt zugeordnet

### Listenansicht
- [ ] Angenommen Karten unterschiedlichen Typs existieren, wenn der Nutzer den Typ-Filter (Alle/Theorie/Klausurtechnik) wechselt, dann zeigt die Liste nur noch Karten des gewählten Typs
- [ ] Angenommen mehrere Karten existieren, wenn der Nutzer nach Fach filtert oder die Sortierung (fällig/Fach) ändert, dann aktualisiert sich die Liste entsprechend
- [ ] Angenommen eine Karte hat eine hinterlegte Fehlernotiz, wenn der Nutzer sie nicht aufdeckt, dann bleibt die Fehlernotiz verborgen — nur Frage und Metadaten sind sichtbar
- [ ] Angenommen eine Karte hat eine hinterlegte Fehlernotiz, wenn der Nutzer auf „Fehler aufdecken" klickt, dann werden Fehlernotiz und ggf. Quelle angezeigt; ein erneuter Klick verbirgt sie wieder
- [ ] Angenommen eine Karte hat keine Fehlernotiz, wenn der Nutzer sie aufdeckt, dann erscheint „Keine Fehlernotiz hinterlegt" statt eines leeren Felds

### Bewertung & Intervallberechnung
- [ ] Angenommen eine neu angelegte Karte wird zum ersten Mal bewertet, wenn die Bewertung 4 oder 5 ist, dann wird das Intervall gemäß GRADUIERUNG (3 bzw. 4 Tage, ± Fuzz-Streuung) gesetzt und ein Eintrag in der Bewertungshistorie erstellt
- [ ] Angenommen eine Karte wurde bereits mindestens einmal bewertet, wenn sie erneut mit 4 oder 5 bewertet wird, dann wächst ihr Intervall gegenüber dem vorherigen Wert (Faktor 2,0 bzw. 2,5, ± Fuzz), begrenzt auf maximal 120 Tage
- [ ] Angenommen eine Karte hat ein Intervall von mehr als 1 Tag, wenn sie mit 1 oder 2 bewertet wird, dann wird ihr Intervall unabhängig vom vorherigen Wert auf das Start-Intervall (1 Tag) zurückgesetzt
- [ ] Angenommen eine Karte wird mit 3 bewertet, dann bleibt ihr Intervall gegenüber dem vorherigen Wert unverändert (± Fuzz)
- [ ] Angenommen eine Bewertung wird gespeichert — unabhängig davon, ob inline in der Liste, im Bearbeiten-Formular oder in der Fokuseinheit —, dann wird sie zusätzlich als eigener, unveränderlicher Eintrag in der Bewertungshistorie protokolliert
- [ ] Angenommen eine Karte wird bearbeitet, ohne dass die Selbsteinschätzung geändert wird, dann bleiben Intervall und nächste Fälligkeit unverändert und es entsteht kein neuer Historieneintrag

### Gültigkeits-Badge
- [ ] Angenommen eine Karte hat eine Bewertung ≥ 4 und ihre Fälligkeit inkl. Karenzzeit ist nicht überschritten, dann zeigt sie das Badge „Gültig"
- [ ] Angenommen eine Karte hat eine Bewertung < 4 oder ihre Fälligkeit inkl. Karenzzeit ist überschritten, dann zeigt sie das Badge „Verfallen"

### Bearbeiten & Löschen
- [ ] Angenommen eine Karte existiert, wenn der Nutzer auf die Frage oder das Bearbeiten-Icon klickt, dann öffnet sich das Formular vorausgefüllt mit den aktuellen Werten
- [ ] Angenommen eine Karte existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor die Karte inkl. ihrer Bewertungshistorie entfernt wird
- [ ] Angenommen der Lösch-Bestätigungsdialog ist geöffnet, wenn der Nutzer abbricht, dann bleibt die Karte unverändert erhalten

### Fokuseinheit
- [ ] Angenommen der Nutzer öffnet die Fokuseinheit, wenn er Fach- und Typ-Filter wählt, dann zeigt das Setup die Anzahl fälliger/überfälliger Karten für diese Auswahl an
- [ ] Angenommen für die gewählte Filterkombination gibt es keine fälligen Karten, dann ist „Session starten" deaktiviert und der Hinweis „Keine fälligen Karten für diese Auswahl" erscheint
- [ ] Angenommen eine Fokuseinheit läuft, wenn der Nutzer bei der aktuellen Karte auf „Antwort aufdecken" klickt, dann werden vorherige Fehlernotiz und Quelle angezeigt (oder „Keine Referenz hinterlegt", falls beides fehlt) sowie ein optionales Fehlernotiz-Feld und die 5 Bewertungsstufen
- [ ] Angenommen eine Fokuseinheit läuft, wenn der Nutzer eine Bewertungsstufe wählt, dann werden Bewertung und ggf. neue Fehlernotiz gespeichert und automatisch zur nächsten fälligen Karte der Session gewechselt
- [ ] Angenommen alle Karten der Fokuseinheit wurden bewertet, dann erscheint eine Abschluss-Übersicht mit Anzahl gelernter Karten und der Verteilung der vergebenen Bewertungen
- [ ] Angenommen eine Fokuseinheit läuft, wenn der Nutzer sie vorzeitig abbricht, dann bleiben bereits bewertete Karten mit ihrer neuen Bewertung gespeichert und die Session wird geschlossen

### Fehler & Sicherheit
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Anlegen/Bewerten/Bearbeiten/Löschen einer Karte fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und der vorherige Zustand bleibt sichtbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die `karteikarten`- oder `reviews`-Tabelle zuzugreifen, dann verweigert RLS jeden Zugriff

## Edge Cases
- Nutzer bewertet dieselbe Karte mehrmals am selben Tag (z.B. inline in der Liste, dann erneut in der Fokuseinheit) → jede Bewertung zählt als eigenständiges Ereignis, Intervall wird jedes Mal neu ab dem zuletzt gespeicherten Intervall berechnet; kein Schutz vor Mehrfachbewertung am selben Tag in dieser Version
- Karte erreicht durch einen Lapse (Bewertung ≤ 2) einen Reset → Intervall springt auf das Start-Intervall zurück, auch wenn es vorher bereits bei nahe 120 Tagen lag
- Zwei Browser-Tabs gleichzeitig geöffnet, in beiden wird dieselbe Karte bearbeitet/bewertet → kein Konflikt-Handling (Single-User-Konvention wie PROJ-1/PROJ-2), die zuletzt gespeicherte Aktion gewinnt
- Nutzer versucht, ein Thema aus einem anderen Fach als dem gewählten Kartenfach zuzuordnen → nicht möglich, das Themenfeld zeigt ausschließlich Themen des gewählten Fachs (jedes Thema gehört laut PROJ-2 genau zu einem Fach)
- Nutzer ändert das Fach einer bestehenden Karte, sodass ein bisher zugeordnetes Thema nicht mehr zum neuen Fach passt → bisherige Themenzuordnung wird beim Fachwechsel geleert, Nutzer muss neu zuordnen (mind. 1 Thema bleibt Pflicht)
- Extrem lange Frage/Quelle/Fehlernotiz → Validierungsfehler mit Zeichenlimit-Hinweis (genaues Limit wird in `/architecture` festgelegt, analog PROJ-2)
- Fokuseinheit wird gestartet, während parallel in einem anderen Tab dieselbe Karte gelöscht wird → die Bewertung in der laufenden Session schlägt mit der generischen Verbindungsfehlermeldung fehl, falls die Karte nicht mehr existiert (kein Sonderfall, Single-User, geringe Wahrscheinlichkeit)

## Technical Requirements (optional)
- Security: `karteikarten`- und `reviews`-Tabellen sind RLS-geschützt nach dem in PROJ-1 etablierten Muster (`auth.uid() = user_id`)
- Datenmodell: Jede Karte referenziert ihre Themen über `themen.id` (Fremdschlüssel, PROJ-2-Muster), nicht über eine Namenskopie
- Datenmodell: Jede Bewertung wird zusätzlich als eigene, unveränderliche Zeile in einer `reviews`-Tabelle protokolliert (kein Update/Delete durch den Nutzer, nur Insert) — Grundlage für die spätere PROJ-8-Historie/Kalibrierung
- Wiederverwendung: Die Thema-Mehrfachauswahl nutzt die in PROJ-2 vorgegebene `ThemaFeld`-Komponente (Chip-Eingabefeld mit Inline-Neuanlage, siehe `ThemaFeld.dc.html`-Prototyp) unverändert — keine eigenständige Neuentwicklung
- Algorithmus: Intervallberechnung folgt `Berechnungsspezifikation_Kompetenzmodell.md`, Abschnitt 2.1–2.2, **ohne** die dort beschriebene Freistellungsphase-/Prüfungsdatum-Deckelung (siehe Out of Scope). Relevante Default-Parameter:

  | Parameter | Default | Bedeutung |
  |---|---|---|
  | `NIVEAU_SCHWELLE` | 4 | Mindestbewertung (1–5), damit eine Karte als „Gültig" zählt |
  | `START_INTERVALL` | 1 Tag | Intervall bei Erstbewertung ≤ 2 oder bei Lapse-Reset |
  | `GRADUIERUNG` | 3 Tage (Bew. 4) / 4 Tage (Bew. 5) | Intervall nach erstem erfolgreichem Abruf |
  | `FAKTOR_5` | 2,5 | Intervallmultiplikator bei Folgebewertung 5 |
  | `FAKTOR_4` | 2,0 | Intervallmultiplikator bei Folgebewertung 4 |
  | `FAKTOR_3` | 1,0 | Intervall bleibt bei Folgebewertung 3 unverändert |
  | `FUZZ` | ± 15 % | Zufallsrauschen auf jedes neu berechnete Intervall |
  | `KARENZ_FAKTOR` | 0,25 | Karenzzeit = 25 % des Intervalls (Untergrenze `KARENZ_MIN`) |
  | `KARENZ_MIN` | 2 Tage | Untergrenze der Karenzzeit |
  | `INTERVALL_MAX` | 120 Tage | Absolute Obergrenze eines Intervalls |

- Gültigkeits-Logik: `gueltig(item) = item.bewertung >= NIVEAU_SCHWELLE UND heute <= item.wdh_datum + karenz(item)` (Abschnitt 4 der Berechnungsspezifikation), steuert ausschließlich das Karten-Badge — keine Themen-/Fach-Aggregation (das ist PROJ-8)
- Performance: Laden der Kartenliste < 300ms (analog PROJ-1/PROJ-2)

## Open Questions
- [x] Zeichenlimits für Frage/Quelle/Fehlernotiz — in `/architecture` festgelegt (siehe Technical Decisions): Frage 1.000, Quelle 200, Fehlernotiz 1.000 Zeichen
- [x] Exakte Rundungsregel für `wdh_datum = heute + runden(intervall)` — in `/architecture` auf kaufmännische Rundung festgelegt (siehe Technical Decisions)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| „Bloom-Stufen" aus PRD/INDEX.md werden NICHT als eigenes Klassifikationsfeld umgesetzt — es bleibt bei der 5-stufigen Selbsteinschätzung aus dem Prototyp | Der PRD-Begriff war ungenau; der validierte Prototyp implementiert eine Beherrschungs-/Konfidenz-Skala, keine echte Bloom'sche Taxonomie (Erinnern/Verstehen/Anwenden/Analysieren/Bewerten/Erschaffen). Ein zusätzliches Bloom-Feld hätte keinen erkennbaren MVP-Nutzen | 2026-09-02 |
| Die Intervallberechnung folgt `Berechnungsspezifikation_Kompetenzmodell.md` Abschnitt 2 statt des im Prototyp fest codierten Rating→Tage-Mappings und statt der in INDEX.md genannten 1/3/9/27/81-Sequenz | Nutzer hat diese Datei als maßgeblich benannt; sie ersetzt in Abschnitt 10 explizit das alte 1/3/9/27/81-Mapping durch einen wachsenden, zustandsbasierten Algorithmus nach SM-2-Vorbild — echtes Spaced-Repetition-Wachstum statt eines statischen Lookups | 2026-09-02 |
| Freistellungsphase-Deckelung und Prüfungsdatum-Obergrenze (Abschnitt 2.2) werden in PROJ-3 nicht umgesetzt | Es existiert noch kein Prüfungsdatum-Feld; Nutzer hat entschieden, dass das Prüfungsdatum stattdessen mit PROJ-9 (Dashboard) editierbar hinterlegt wird. Die Deckelung wird nachgezogen, sobald dieses Feld existiert | 2026-09-02 |
| Die Bewertungshistorie (`reviews`-Tabelle) wird bereits mit PROJ-3 angelegt und befüllt, obwohl PROJ-3 selbst noch keine Verlaufsansicht zeigt | Verhindert, dass alle bis zur PROJ-8-Umsetzung gesammelten Bewertungen unwiderruflich fehlen | 2026-09-02 |
| Keine Parameter-Einstellungsseite — feste Default-Werte im Code | „Konfigurierbar" in der Berechnungsspezifikation bezieht sich auf die (in PRD/INDEX nicht vorgesehene) Kalibrierungsauswertung, nicht auf einen MVP-Bedarf | 2026-09-02 |
| Die Fokuseinheit (dedizierter Session-Modus: fällige Karten nacheinander, aufdecken, bewerten) ist Teil von PROJ-3 | Zentral für die im PRD genannten Prinzipien Spaced Repetition und Retrieval Practice; entspricht dem validierten Prototyp | 2026-09-02 |
| Mindestens 1 Thema ist beim Anlegen einer Karte Pflicht (Abweichung vom Prototyp, der dies optional lässt) | Eine themenlose Karte wäre für die themenbasierte Kompetenzanalyse (PROJ-8) unsichtbar; widerspräche dem Kernzweck aus PROJ-2 („damit ich meine Karteikarten … einordnen kann") | 2026-09-02 |
| Löschen einer Karte erfordert einen Bestätigungsdialog (Abweichung vom Prototyp) | Konsistenz mit der bereits in PROJ-2 etablierten Konvention für destruktive Aktionen | 2026-09-02 |
| Jede Karte zeigt ein Gültigkeits-Badge (Gültig/Verfallen) nach der neuen `gueltig()`-Formel statt des alten Prozent-Ampel-Badges (Bewertung × 20 %) | Das alte Prozent-Badge würde nach dem neuen Modell irreführende Ergebnisse zeigen (z.B. eine längst verfallene Top-Bewertung weiterhin als „grün") | 2026-09-02 |
| Änderung der Selbsteinschätzung löst unabhängig vom Ort (Liste, Bearbeiten-Formular, Fokuseinheit) immer denselben Bewertungsalgorithmus + Historieneintrag aus; Änderung anderer Felder ohne Bewertungsänderung löst keine Neuberechnung aus | Konsistentes Verhalten ohne Sonderfälle je nach UI-Einstiegspunkt; reine Metadaten-Bearbeitung soll die Wiederholungsplanung nicht verfälschen | 2026-09-02 |
| Die `ThemaFeld`-Komponente aus dem PROJ-2-Prototyp (Chip-Mehrfachauswahl mit Inline-Neuanlage) wird 1:1 übernommen, keine Neuentwicklung | Bereits in PROJ-2 als verbindliche Vorgabe für PROJ-3 festgehalten | 2026-09-02 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Eine gemeinsame `karteikarten`-Tabelle mit Typ-Feld (theorie/klausurtechnik) statt zwei getrennter Tabellen | Entspricht dem validierten Prototyp (eine gemeinsame, per Typ filterbare Liste); einfacher zu pflegen als zwei parallele Tabellen mit identischer Struktur | 2026-09-02 |
| Eigene `karteikarten_reviews`-Tabelle statt einer generischen, hub-übergreifenden `reviews`-Tabelle | Garantiert per Fremdschlüssel-Kaskade, dass beim Löschen einer Karte automatisch ihre komplette Bewertungshistorie mitgelöscht wird (AC-Anforderung), ohne zusätzliche Aufräum-Logik. Eine polymorphe, hub-übergreifende Tabelle (wie in der Berechnungsspezifikation generisch skizziert) hätte diese referenzielle Integrität nicht automatisch. PROJ-4 kann bei Bedarf nach demselben Muster eine eigene Historientabelle anlegen | 2026-09-02 |
| Verknüpfungstabelle `karteikarten_themen` (Many-to-Many) statt einer einzelnen Themen-Spalte | Eine Karte kann laut Spezifikation mehreren Themen zugeordnet sein; identisches Muster zur Mehrfachauswahl, das PROJ-2 für zukünftige Hubs vorgesehen hat | 2026-09-02 |
| Eine einzige serverseitige „Bewertung speichern"-Aktion, gemeinsam genutzt von Listenansicht, Bearbeiten-Formular und Fokuseinheit (inkl. Erstbewertung beim Anlegen) | Garantiert identisches Verhalten unabhängig vom Einstiegspunkt, statt dreier separater Implementierungen, die auseinanderlaufen könnten | 2026-09-02 |
| Gültigkeits-Badge wird bei jedem Laden aus Bewertung + Fälligkeit + Karenzzeit berechnet, nicht als eigener gespeicherter Wert | Der Status kann allein durch Zeitablauf kippen, auch ohne Nutzeraktion — ein gespeicherter Wert würde sofort veralten. Folgt demselben Prinzip, das die Berechnungsspezifikation für die Themen-Stufe vorschreibt (kein gespeicherter Stufenwert) | 2026-09-02 |
| Route `/karteikarten`, Server Actions statt eigener API-Routen | Konsistent mit dem bereits abgenommenen Muster aus PROJ-1/PROJ-2 | 2026-09-02 |
| RLS-Muster 1:1 aus PROJ-1/PROJ-2 für alle drei neuen Tabellen (`karteikarten`, `karteikarten_themen`, `karteikarten_reviews`) | Bereits geprüftes, etabliertes Sicherheitsmuster, keine neue Logik nötig | 2026-09-02 |
| Zeichenlimits: Frage/Aufgabe 1.000 Zeichen, Quelle 200 Zeichen, Fehlernotiz 1.000 Zeichen | Ausreichend für mehrsätzige Steuerrechts-Sachverhalte bzw. kurze Quellenangaben, verhindert aber ausufernde Eingaben (löst die offene Frage aus der Spezifikation) | 2026-09-02 |
| Rundungsregel für `wdh_datum`: kaufmännische Rundung (0,5 Tage aufwärts) | Einfach, vorhersehbar, keine systematische Verzerrung in eine Richtung (löst die offene Frage aus der Spezifikation) | 2026-09-02 |
| Fokuseinheit als Vollbild-Overlay über dem Hub, ohne eigene URL | Entspricht dem Prototyp-Verhalten; kein zusätzlicher Routing-Aufwand für einen temporären Session-Zustand | 2026-09-02 |
| Keine neuen npm-Pakete oder shadcn/ui-Komponenten nötig | Alle benötigten Bausteine (react-hook-form, Zod, Select/Textarea/Dialog/AlertDialog/Badge/Progress/Skeleton) sind bereits aus PROJ-1/PROJ-2 im Projekt vorhanden | 2026-09-02 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/karteikarten (geschützte Route — Zugriff nur eingeloggt, sonst Redirect zu /login,
               gesichert durch die bestehende Middleware aus PROJ-1)
└── Karteikarten-Hub-Seite
    ├── Kopfzeile: Seitentitel + Kurzbeschreibung + "Themen verwalten"-Link (→ /themen,
    │   von PROJ-2 für PROJ-3 vorgesehen) + "Neue Karteikarte"-Button
    │
    ├── Filter-/Aktionsleiste
    │   ├── Typ-Segment (Alle / Theorie / Klausurtechnik)
    │   ├── Fach-Auswahl (Dropdown, alle 11 Fächer)
    │   ├── Sortierung (Fälligkeit / Fach)
    │   ├── Kartenanzahl (Anzeige)
    │   └── "Fokuseinheit starten"-Button
    │
    ├── Kartenliste
    │   └── Je Karte (Card)
    │       ├── Kopfzeile: Typ-Badge (Theorie/Klausurtechnik), Fach, Themen-Chips,
    │       │   Gültigkeits-Badge (Gültig/Verfallen)
    │       ├── Frage-Text (klickbar → öffnet Bearbeiten-Formular)
    │       ├── Aktionsreihe: Selbsteinschätzung-Auswahl (inline), "Fehler
    │       │   aufdecken/ausblenden"-Button, nächste Fälligkeit (relativ + Datum),
    │       │   Bearbeiten-Icon, Löschen-Icon
    │       └── Aufklappbarer Fehleranalyse-Bereich (nur nach "Fehler aufdecken"
    │           sichtbar; zeigt Fehlernotiz + Quelle, oder "Keine Fehlernotiz hinterlegt")
    │
    ├── Leerer Zustand ("Keine Karten") — wenn Filter keine Treffer liefert
    │
    ├── Neue/Bearbeiten-Karteikarte-Formular (Modal)
    │   ├── Fach-Auswahl
    │   ├── Typ-Auswahl (Theorie/Klausurtechnik) — Pflichtfeld
    │   ├── Themenfeld (ThemaFeld-Komponente — Mehrfachauswahl + Inline-Neuanlage,
    │   │   nur Themen des gewählten Fachs, aktiviert erst nach Fach-Auswahl) — mind. 1 Pflicht
    │   ├── Frage/Aufgabe (Textfeld, mehrzeilig, max. 1.000 Zeichen)
    │   ├── Selbsteinschätzung-Auswahl (1–5, Standard: 3)
    │   ├── Quelle (optionales Textfeld, max. 200 Zeichen)
    │   └── Fehleranalyse (optionales Textfeld, mehrzeilig, max. 1.000 Zeichen)
    │
    ├── Lösch-Bestätigungsdialog (Abbrechen / Löschen)
    │
    ├── Fokuseinheit (Vollbild-Overlay über dem Hub, keine eigene URL)
    │   ├── Setup: Fach-Filter, Typ-Segment, Anzahl fälliger/überfälliger Karten,
    │   │   Start/Abbrechen (Start deaktiviert bei 0 fälligen Karten)
    │   ├── Session läuft: Fortschrittsanzeige, Kartenkopf (Typ/Fach/Themen), Frage,
    │   │   "Antwort aufdecken"-Button → Selbstkontroll-Panel (vorherige Fehlernotiz/
    │   │   Quelle oder "Keine Referenz hinterlegt"), Fehlernotiz-Eingabe (optional),
    │   │   5 Bewertungs-Buttons (je mit Fälligkeits-Vorschau in Tagen)
    │   └── Abschluss: Anzahl gelernter Karten, Verteilung der vergebenen Bewertungen,
    │       "Zurück zum Hub"
    │
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung
        fehlgeschlagen"-Hinweis bei Netzwerkfehlern)
```

### Data Model (in plain language)
```
Tabelle "karteikarten" (vom Nutzer gepflegt, eine gemeinsame Tabelle für
beide Kartentypen, per Typ-Feld unterschieden):
- id
- user_id          → verweist auf den eingeloggten Nutzer (RLS-Muster aus PROJ-1)
- fach_id           → verweist auf "faecher" (PROJ-2)
- typ               → theorie oder klausurtechnik
- frage             → Frage-/Aufgabentext, max. 1.000 Zeichen
- quelle            → optionale Quellenangabe, max. 200 Zeichen
- fehlernotiz       → optionale Fehleranalyse, max. 1.000 Zeichen, in der UI
                       standardmäßig verborgen
- bewertung         → aktuelle Selbsteinschätzung 1–5
- intervall         → aktuelles Wiederholungsintervall in Tagen (intern mit
                       Nachkommastellen, gerundet bei Anzeige/Terminvergabe)
- wdh_anzahl        → Anzahl bisheriger Bewertungen
- wdh_datum         → nächste Fälligkeit (Datum)
- created_at

Tabelle "karteikarten_themen" (Verknüpfungstabelle, da eine Karte mehrere
Themen haben kann — analog dem Mehrfachauswahl-Muster aus PROJ-2):
- karteikarte_id    → verweist auf "karteikarten"; Löschen der Karte entfernt
                       automatisch auch diese Zuordnungen
- thema_id          → verweist auf "themen" (PROJ-2)

Tabelle "karteikarten_reviews" (unveränderliche Historie, eine Zeile pro
Bewertungsereignis — nie aktualisiert oder einzeln gelöscht, nur beim
Löschen der zugehörigen Karte automatisch mitentfernt):
- id
- user_id
- karteikarte_id    → verweist auf "karteikarten"
- datum             → Zeitpunkt der Bewertung
- bewertung         → vergebene Bewertung 1–5
- intervall_danach  → daraus berechnetes neues Intervall

Zugriffsregel (Row Level Security) für alle drei Tabellen: identisches
Muster wie "themen" aus PROJ-1/PROJ-2 — ein Nutzer sieht und bearbeitet
ausschließlich eigene Zeilen (user_id = eingeloggter Nutzer).

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, zentral
und über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **Eine gemeinsame `karteikarten`-Tabelle mit Typ-Feld statt zwei getrennter Tabellen:** entspricht dem validierten Prototyp (eine gemeinsame, filterbare Liste), einfacher zu pflegen als zwei parallele Tabellen mit identischer Struktur.
- **Eigene `karteikarten_reviews`-Tabelle statt einer generischen, hub-übergreifenden `reviews`-Tabelle:** garantiert per Fremdschlüssel-Kaskade, dass beim Löschen einer Karte automatisch auch ihre komplette Bewertungshistorie mitgelöscht wird, ohne zusätzliche Aufräum-Logik. Wenn PROJ-4 später eine eigene Übungsaufgaben-Historie braucht, kann sie nach demselben Muster eine eigene Tabelle anlegen.
- **Verknüpfungstabelle `karteikarten_themen` statt einer einzelnen Themen-Spalte:** eine Karte kann laut Spezifikation mehreren Themen zugeordnet sein — exakt das Muster, das PROJ-2 für zukünftige Hubs vorgesehen hat.
- **Eine einzige serverseitige „Bewertung speichern"-Aktion für alle drei Bewertungs-Einstiegspunkte** (Listenansicht, Bearbeiten-Formular, Fokuseinheit, inkl. Erstbewertung beim Anlegen): garantiert identisches Verhalten unabhängig vom Einstiegspunkt statt dreier separater Implementierungen, die auseinanderlaufen könnten.
- **Gültigkeits-Badge wird bei jedem Laden berechnet, nicht gespeichert:** der Status kann allein durch Zeitablauf kippen, auch ohne Nutzeraktion — ein gespeicherter Wert würde sofort veralten. Folgt demselben Prinzip, das die Berechnungsspezifikation für die Themen-Stufe vorschreibt.
- **Server Actions statt eigener API-Routen, RLS-Muster 1:1 aus PROJ-1/PROJ-2:** konsistent mit dem bereits abgenommenen Muster.
- **`ThemaFeld`-Komponente als eigenständige, wiederverwendbare Komponente:** kein PROJ-3-internes Detail, sondern direkte Grundlage für PROJ-4/PROJ-5, wie in PROJ-2 vorgesehen.
- **Zeichenlimits und Rundungsregel:** lösen die beiden offenen Fragen aus der Spezifikation (siehe Technical Decisions).
- **Fokuseinheit als Vollbild-Overlay ohne eigene URL:** entspricht dem Prototyp-Verhalten, kein zusätzlicher Routing-Aufwand für einen temporären Session-Zustand.

### Dependencies
- Keine neuen npm-Pakete nötig — react-hook-form, Zod und alle benötigten shadcn/ui-Komponenten (Select, Textarea, Dialog, AlertDialog, Badge, Progress, Skeleton) sind bereits aus PROJ-1/PROJ-2 im Projekt installiert
- Supabase CLI (bereits im Einsatz) für die neue Migration

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
