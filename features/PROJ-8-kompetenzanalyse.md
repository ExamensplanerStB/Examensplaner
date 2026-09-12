# PROJ-8: Kompetenzanalyse

## Status: In Review
**Created:** 2026-09-11
**Last Updated:** 2026-09-12

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — Auth-Schutz der Route, RLS-Muster
- PROJ-2 (Zentraler Themenkatalog) — Themen und Fächer (inkl. `klausurtag`-Gruppierung 1/2/3) als Bezugssystem
- PROJ-3 (Karteikarten-Hub) — liefert Theorie-/Klausurtechnik-Belege inkl. Intervall-/Gültigkeitsdaten und Fehlernotizen
- PROJ-4 (Übungsaufgaben-Hub) — liefert Übungsaufgaben-Belege (`worst`, offene Pflicht-Wiederholungen, Fehlernotizen)
- PROJ-5 (Probeklausuren-Hub) — liefert Klausurteile (Punkte/Quote, Themen-Zuordnung) und Stufe-1-/Stufe-2-Nacharbeitstexte

## User Stories
- Als Lukas möchte ich auf einen Blick sehen, wie weit ich in jedem der 11 Fächer bin (Stufenverteilung 0–4), damit ich meine Lernzeit priorisieren kann, ohne jedes Thema einzeln durchzugehen.
- Als Lukas möchte ich pro Fach sehen, wie meine Probeklausuren ausgefallen sind und ob sich das verbessert (Klausurreife), getrennt von der reinen Stufenverteilung, damit ich Theorie-Fortschritt nicht mit echter Klausurfestigkeit verwechsle.
- Als Lukas möchte ich in ein Fach hineinklicken und die Themen nach Dringlichkeit sortiert sehen (größte Blockade zuerst), damit ich sofort weiß, woran ich als Nächstes arbeiten sollte.
- Als Lukas möchte ich bei einem einzelnen Thema sehen, welche der vier Säulen (Theorie, Klausurtechnik, Übung, Probeklausur) gerade gültig, verfallen oder noch nicht belegt ist, damit ich genau weiß, was die nächste Stufe blockiert.
- Als Lukas möchte ich bei einem Thema eine konkrete Handlungsempfehlung inkl. wiederkehrender Fehlermuster aus meinen Fehlernotizen sehen, damit ich nicht nur weiß, dass ich schwach bin, sondern was ich konkret üben sollte.
- Als Lukas möchte ich die größten Blockaden über alle Fächer hinweg als priorisierte Liste sehen, damit ich beim Öffnen der Kompetenzanalyse sofort einen Startpunkt habe, statt selbst zu suchen.
- Als Lukas möchte ich, sobald genug Klausuren vorliegen, sehen, ob das Stufen-Modell tatsächlich vorhersagt, ob ich bestehe, und ob ich mich bei Übungsaufgaben systematisch über- oder unterschätze, damit ich dem Modell vertrauen kann statt es blind zu glauben.

## Out of Scope
- Kompetenzentwicklungsdiagramm (Stufenverlauf über die Zeit als Liniendiagramm) — die tägliche Snapshot-Erfassung (`stufen_verlauf`) läuft ab Feature-Livegang mit, die Visualisierung selbst folgt erst in einem späteren `/refine`, sobald genug Wochen Historie vorliegen
- Parameter-Einstellungsseite für Schwellenwerte (`NIVEAU_SCHWELLE`, `BESTEHEN_QUOTE`, `BESTEHEN_SICHER`, `ABLAUF_WARN` etc.) — feste Default-Werte im Code, analog zur bereits in PROJ-3 getroffenen Entscheidung; keine `parameter`-Tabelle
- Dashboard-Widgets (Stufenverteilung-Mini-Übersicht, Top-3-Schwachstellen auf dem Dashboard) — eigenständiges Feature PROJ-9; PROJ-8 stellt nur die zugrunde liegenden Berechnungen (Fach-Stufenverteilung, priorisierte Schwachstellen-Liste) bereit, die PROJ-9 wiederverwendet
- KI-gestützte Fehleranalyse/-Chat — explizites Non-Goal der gesamten Version (PRD); Fehlermuster-Erkennung erfolgt ausschließlich über deterministisches Keyword-Matching
- Bearbeiten/Anlegen von Karteikarten, Übungsaufgaben oder Probeklausuren direkt aus der Kompetenzanalyse heraus — reine Analyse-/Leseansicht, Bearbeitung erfolgt weiterhin im jeweiligen Hub
- Eigener Menüpunkt für Kalibrierung — erscheint als Card am Ende von Ebene 1, kein separates Nav-Item
- Rückwirkende Befüllung von `stufen_verlauf` vor Feature-Livegang — Kalibrierung (Prädiktive Validität) kann Klausuren vor dem Livegang-Datum daher nicht auswerten; das Snapshot-System beginnt bei 0
- Wiederholungsplan-Integration (z.B. Verlinkung einzelner fälliger Wiederholungen aus der Kompetenzanalyse heraus) — eigenständiges Feature PROJ-7, keine Änderung daran

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er `/kompetenzanalyse` direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er über die Navigation auf „Kompetenzanalyse" klickt, dann lädt Ebene 1 (Fächer-Übersicht) mit allen 11 Fächern, gruppiert nach den 3 Klausurtagen
- [ ] Angenommen keinerlei Lerndaten existieren (weder Karteikarten noch Übungsaufgaben noch Probeklausuren), wenn Ebene 1 lädt, dann zeigen alle Fächer den Status „keine Daten" (graue Ampel) statt einer Stufenangabe

### Ebene 1 — Fächer-Übersicht
- [ ] Angenommen Themen in unterschiedlichen Stufen existieren, wenn Ebene 1 lädt, dann zeigt die Stufenverteilung pro Fach einen gestapelten Balken mit einem Segment je Stufe (0–4), proportional zur Anzahl Themen dieser Stufe
- [ ] Angenommen ein Fach hat mindestens ein Thema mit vorhandenen Daten, dann zeigt die Fachzeile zusätzlich die Durchschnittsstufe (Ø, eine Nachkommastelle)
- [ ] Angenommen ein Fach hat keine einzige Probeklausur, dann erscheint es nicht in der Klausurreife-Liste (kein leerer Eintrag)
- [ ] Angenommen ein Fach hat mindestens eine Probeklausur, dann zeigt die Klausurreife-Card Anzahl geschriebener Klausuren, Anteil bestandener Klausuren (Quote ≥ `BESTEHEN_QUOTE`) und den Trend der letzten 3 Klausuren gegenüber den 3 davor
- [ ] Angenommen ein Fach hat weniger als 6 Klausuren, dann zeigt der Trend „–" statt einer Prozentangabe (nicht genug Vergleichsdaten)
- [ ] Angenommen die jüngste Klausur eines Fachs liegt mehr als 6 Wochen zurück, dann zeigt die Klausurreife-Card den Hinweis „Fach braucht frische Klausur"
- [ ] Angenommen mehrere Themen mit Stufe < 4 existieren, wenn Ebene 1 lädt, dann zeigt „Größte Blockaden" die 6 Themen mit dem höchsten Priowert (Berechnungsspezifikation Abschnitt 8), inkl. Fach, Blockade-Text und Stufen-Badge
- [ ] Angenommen der Nutzer klickt auf ein Fach oder ein Thema aus „Größte Blockaden", dann navigiert er zur passenden Ebene 2 bzw. Ebene 3

### Ebene 2 — Themen-Liste eines Fachs
- [ ] Angenommen der Nutzer öffnet ein Fach, dann zeigt Ebene 2 alle Themen dieses Fachs, sortiert nach Priowert absteigend (dringendste zuerst)
- [ ] Angenommen ein Fach hat noch keine Themen im Themenkatalog, dann zeigt Ebene 2 den Hinweis „Keine Themen — lege Themen unter /themen an" statt einer leeren Liste
- [ ] Angenommen der Nutzer ist auf Ebene 2, wenn er auf „Kompetenzanalyse" im Breadcrumb klickt, dann kehrt er zu Ebene 1 zurück

### Ebene 3 — Themendetail
- [ ] Angenommen der Nutzer öffnet ein Thema, dann zeigt Ebene 3 die aktuelle Stufe (0–4) als Badge sowie eine 4-Segment-Anzeige (eine je Stufe 1–4), die zeigt, welche Stufen erreicht sind
- [ ] Angenommen für ein Thema ist Stufe n erreicht, aber ein direktes Kriterium einer Stufe < n ist weder erfüllt noch subsumiert, dann erscheint der „Basis bröckelt"-Hinweis
- [ ] Angenommen ein Thema hat Stufe < 4, dann zeigt die Detailseite einen Blockade-Hinweis, der benennt, was zur nächsten Stufe fehlt (z.B. „Stufe 3 blockiert: jüngste Übung erreicht Worst < 4 oder ist älter als 56 Tage")
- [ ] Angenommen ein Thema hat Stufe 4 ohne „Basis bröckelt", dann zeigt die Detailseite die Empfehlung, das Thema mit den fälligen Wiederholungen warm zu halten, statt eines Blockade-Hinweises
- [ ] Angenommen der Nutzer öffnet ein Thema, dann zeigt die Säulen-Übersicht für jede der vier Säulen (Theorie, Klausurtechnik, Übungsaufgaben, Probeklausur) getrennt den Gültigkeitsstatus (gültig/verfallen/keine Daten) mit Detailtext
- [ ] Angenommen mindestens eine Fehlernotiz zu einem Thema existiert (aus Karteikarten, Übungsaufgaben oder Probeklausuren-Nacharbeit), dann erscheinen alle chronologisch (neueste zuerst) mit Hub-Badge und Datum
- [ ] Angenommen eine Probeklausur hat einen Stufe-1- oder Stufe-2-Nacharbeitstext, dann erscheint dieser Text unter jedem Thema, das in mindestens einem Teil dieser Klausur zugeordnet ist
- [ ] Angenommen keine Fehlernotizen zu einem Thema existieren, dann zeigt die Detailseite „Keine Fehlernotizen — sauber gearbeitet."
- [ ] Angenommen mindestens ein Fehlermuster-Keyword (vergessen/unklar/verwechsel/schema/schritt) in den Fehlernotizen eines Themas vorkommt, dann erscheint eine entsprechende Musterzeile in der Handlungsempfehlung
- [ ] Angenommen für ein Thema weder Blockade noch „Basis bröckelt" noch ein Fehlermuster vorliegt, dann zeigt die Handlungsempfehlung den Standardtext „Solide Basis. Halte das Thema mit den fälligen Wiederholungen warm."

### Stufen-Snapshot (Datengrundlage für spätere Kalibrierung/Trend)
- [ ] Angenommen seit dem letzten gespeicherten Snapshot eines Themas ist mindestens ein Kalendertag vergangen, dann wird spätestens beim nächsten Aufruf der Kompetenzanalyse für dieses Thema genau ein neuer Eintrag in `stufen_verlauf` (thema_id, datum, stufe, basis_broeckelt) angelegt
- [ ] Angenommen für ein Thema existiert an einem Datum bereits ein Snapshot, dann wird kein zweiter Eintrag für denselben Tag angelegt

### Kalibrierung
- [ ] Angenommen weniger als `KALIBRIERUNG_MIN_KLAUSUREN` (10) Probeklausuren mit mindestens einem Teil existieren, dann zeigt die Kalibrierungs-Card „Noch nicht genug Daten (x/10 Klausuren)" statt einer Auswertung
- [ ] Angenommen mindestens 10 Probeklausuren mit Teilen existieren und für die zugeordneten Themen liegt ein Snapshot vom Vortag der jeweiligen Klausur vor, dann zeigt die Prädiktive-Validität-Auswertung eine Matrix Stufe × Ergebnis (bestanden/nicht bestanden je Klausurteil)
- [ ] Angenommen für einen Klausurteil kein Snapshot vom Vortag existiert (z.B. weil die Klausur vor Feature-Livegang geschrieben wurde), dann wird dieser Teil aus der Prädiktive-Validität-Matrix ausgeschlossen, ohne einen Fehler zu erzeugen
- [ ] Angenommen mindestens 10 Probeklausuren mit Teilen existieren, dann zeigt die Selbstbewertungs-Bias-Auswertung je Thema mit ausreichenden Daten die Differenz zwischen durchschnittlichem `worst`-Wert der Übungsaufgaben (8 Wochen vor der jeweiligen Klausur) und der erzielten Teilquote

### Fehler & Sicherheit
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Laden der Kompetenzanalyse fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" statt einer leeren oder falschen Anzeige
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf `stufen_verlauf` zuzugreifen, dann verweigert RLS jeden Zugriff

## Edge Cases
- Thema wird ausschließlich über Übungsaufgaben oder Probeklausuren nachgewiesen, ohne dazugehörige Karteikarten (Subsumtionsregel, Abschnitt 5.3) → Stufe wird trotzdem korrekt berechnet, keine Karteikarten-Pflicht
- Ein komplett unbearbeitetes Thema (keine Belege in irgendeinem Hub) erhält denselben Priowert wie ein aktiv zurückgefallenes Stufe-0-Thema und kann daher ebenfalls in „Größte Blockaden" erscheinen — Unterscheidung erfolgt nur über das Badge (graues „keine Daten" statt rotem „Stufe 0"), das ist beabsichtigt (Prototyp-Verhalten)
- Probeklausur wurde ohne Teile angelegt (reine Fach-Evidenz, siehe PROJ-5) → liefert keine Themen-Stufe-4-Evidenz für einzelne Themen, fließt aber in die Klausurreife des Fachs ein
- Zwei Teile derselben oder unterschiedlicher Klausuren sind demselben Thema zugeordnet → für Stufe 4 zählt nur der insgesamt jüngste Teil dieses Themas, nicht eine Kombination mehrerer Teile
- Ein Thema hat mehrere Fehlernotizen mit widersprüchlichem Ton (z.B. eine gute und eine schlechte Bewertung kurz hintereinander) → alle erscheinen chronologisch, keine Filterung oder Gewichtung nach „relevanter" Notiz
- Nutzer besucht die Kompetenzanalyse mehrmals am selben Tag → Snapshot wird nur beim ersten Aufruf des Tages je Thema geschrieben, weitere Aufrufe ändern nichts
- Themenkatalog wird nachträglich um ein neues Thema ergänzt, das noch keine Belege hat → erscheint in Ebene 2 mit Stufe 0 / „keine Daten", keine Sonderbehandlung
- Kalibrierung erreicht die 10-Klausuren-Schwelle genau während der Nutzer auf der Seite ist → Anzeige aktualisiert sich erst beim nächsten Laden der Seite, kein Live-Update nötig (Single-User-Konvention wie PROJ-1–5)
- Zwei Browser-Tabs gleichzeitig geöffnet, in einem wird eine Karteikarte bewertet, während im anderen die Kompetenzanalyse offen ist → keine Live-Aktualisierung, ein Reload zeigt den neuen Stand (Single-User-Konvention wie PROJ-1–5)

## Technical Requirements (optional)
- Security: Keine neuen Schreibpfade außer dem Snapshot-Schreiben in `stufen_verlauf`; alle Lesezugriffe respektieren die bestehenden RLS-Policies der Quelltabellen (`auth.uid() = user_id`)
- Datenmodell: Einzige neue Tabelle ist `stufen_verlauf` (thema_id, datum, stufe, basis_broeckelt), RLS nach etabliertem Muster, eindeutig auf thema_id+datum; keine `parameter`- oder projektübergreifende `reviews`-Sammel-Tabelle (bereits durch hub-eigene Reviews-Tabellen in PROJ-3/PROJ-4 abgedeckt)
- Berechnung: Stufe wird bei jedem Laden aus den Rohdaten berechnet (kein gespeicherter „aktueller" Stufenwert außer dem täglichen Snapshot für Kalibrierung/späteren Trend) — konsistent mit dem in PROJ-3/PROJ-4 etablierten Prinzip
- Algorithmus: Gültigkeits-, Stufen-, Fach-Ebene- und Kalibrierungslogik folgen `Berechnungsspezifikation_Kompetenzmodell.md`, Abschnitte 4, 5, 8, 9 vollständig. Relevante Parameter:

  | Parameter | Wert | Bedeutung |
  |---|---|---|
  | `NIVEAU_SCHWELLE` | 4 | Mindestbewertung, damit ein Beleg zählt |
  | `KARENZ_FAKTOR` / `KARENZ_MIN` | 0,25 / 2 Tage | Karenzzeit für Karteikarten-Gültigkeit |
  | `UEB_HALTBARKEIT` | 56 Tage | Gültigkeitsdauer eines Übungsaufgaben-Belegs |
  | `KLAUSUR_HALTBARKEIT` | 180 Tage | Gültigkeitsdauer eines Klausurteil-Belegs |
  | `BESTEHEN_QUOTE` | 0,40 | Bestehensniveau (korrigiert, siehe PROJ-5 Decision Log) |
  | `BESTEHEN_SICHER` | 0,55 | Bestehensniveau mit Sicherheitsaufschlag — Stufe-4-Kriterium |
  | `ABLAUF_WARN` | 7 Tage | Schwelle für „läuft bald ab" im Priowert |
  | `KALIBRIERUNG_MIN_KLAUSUREN` | 10 | Mindestanzahl Klausuren mit Teilen, ab der Kalibrierung angezeigt wird |

- Priowert: `prio(thema) = (4 - stufe) * 2 + (2 wenn basis_broeckelt) + (2 wenn Stufe-3-Beleg in <= ABLAUF_WARN Tagen abläuft) + (1 wenn offene Pflicht-Wiederholung überfällig)` (Abschnitt 8)
- Fehlermuster-Keywords: „vergess", „unklar", „verwechsel", „schema"/"schritt" — deterministisches, Kleinschreibung-normalisiertes Substring-Matching auf den Fehlernotiz-Text, bis zu 3 Empfehlungszeilen pro Thema, analog Prototyp
- Wiederverwendung: Ampel-/Badge-Komponenten aus dem Design-System sowie bereits etablierte Gültigkeitsfunktionen aus `karteikarten-intervall.ts`, `uebungsaufgaben-wiederholung.ts`, `klausuren-berechnung.ts` werden wiederverwendet statt dupliziert
- Performance: Laden der Fächer-Übersicht (Ebene 1, 11 Fächer) < 500ms (etwas großzügiger als PROJ-1–5, da hier über alle Hubs aggregiert wird)

## Open Questions
- [x] Genauer Auslösemechanismus für den täglichen Stufen-Snapshot — in `/architecture` festgelegt: Server-Aktion beim Öffnen der Seite (kein Cron-Job), siehe Tech Design
- [x] Zeichenlimits/Pagination für die Fehlernotizen-Liste bei sehr vielen Einträgen — in `/architecture` festgelegt: keine Pagination, einfache scrollbare Liste (Single-User-Datenmengen), siehe Tech Design

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-8 implementiert das vollständige Kompetenzmodell 2.0 (Abschnitte 4/5/8/9 der Berechnungsspezifikation) und ersetzt das alte gewichtete Prozentmodell (10/20/30/40 %) vollständig | Bereits von PROJ-3/PROJ-4/PROJ-5 in ihren Specs/Decision Logs vorausgesetzt; löst den in der PRD offen markierten Punkt endgültig auf | 2026-09-11 |
| Kalibrierung (Abschnitt 9) wird jetzt gebaut, nicht auf später verschoben, aber hinter einer Datenschwelle (`KALIBRIERUNG_MIN_KLAUSUREN` = 10) versteckt | Vermeidet eine separate Spec/einen separaten `/refine`-Durchlauf später; die Anzeige beginnt automatisch zu funktionieren, sobald genug echte Klausurdaten vorliegen | 2026-09-11 |
| Kompetenzentwicklungsdiagramm (Trend-Visualisierung) wird auf einen späteren `/refine`-Durchlauf verschoben, die tägliche Snapshot-Erfassung (`stufen_verlauf`) läuft aber ab Feature-Livegang mit | Trennt Datenerhebung (muss früh beginnen, sonst fehlt später Historie unwiederbringlich) von der Visualisierung (kann jederzeit nachgezogen werden); ohne diese Trennung hätte die parallel entschiedene Kalibrierung (Prädiktive Validität) nie funktionsfähige Daten gehabt | 2026-09-11 |
| Kalibrierung erscheint als Card am Ende von Ebene 1, kein eigener Menüpunkt | Nutzer sieht sie automatisch beim gewohnten Öffnen der Kompetenzanalyse, ohne dass ein Diagnose-Feature einen zusätzlichen Navigationspunkt beansprucht | 2026-09-11 |
| Ein Klausur-weiter Stufe-1-/Stufe-2-Nacharbeitstext wird allen Themen aller Teile dieser Klausur zugeordnet (nicht teil-spezifisch aufgeteilt) | Der Text bezieht sich inhaltlich auf die ganze Klausur, nicht auf einen einzelnen Teil — eine künstliche Aufteilung wäre nicht durch die Datenlage gedeckt | 2026-09-11 |
| 3-Ebenen-Drilldown-UI folgt 1:1 der im Prototyp bereits validierten Struktur (Fächer-Übersicht → Themen-Liste → Themendetail) | Bereits ausgearbeitetes, konsistentes UX-Muster; kein Grund, das Rad neu zu erfinden (kein pixelgenauer Rebuild nötig, siehe PRD Non-Goals, aber gleiche Funktionalität) | 2026-09-11 |
| Fehlermuster-Erkennung nutzt ausschließlich deterministisches Keyword-Matching (kein KI/NLP) | Konsistent mit PRD-Non-Goal „Keine KI-Integration in dieser Version"; deckt sich mit dem bereits im Prototyp erprobten Ansatz | 2026-09-11 |
| Keine Parameter-Einstellungsseite; alle Schwellenwerte (inkl. der neuen `BESTEHEN_QUOTE`, `BESTEHEN_SICHER`, `ABLAUF_WARN`, `KALIBRIERUNG_MIN_KLAUSUREN`) bleiben Code-Konstanten | Konsistent mit der bereits in PROJ-3 getroffenen Entscheidung; Single-User-Kontext ohne Bedarf für Laufzeit-Konfiguration | 2026-09-11 |
| Dashboard-Mini-Widgets (Stufenverteilung, Top-3-Schwachstellen) sind nicht Teil dieser Spec | Eigenständiges Feature PROJ-9, das laut INDEX.md ohnehin von PROJ-8 abhängt; PROJ-8 muss nur die zugrunde liegenden Berechnungsfunktionen bereitstellen, nicht die Dashboard-Darstellung | 2026-09-11 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Gleiches Architekturmuster wie Wiederholungsplan (PROJ-7): Server Component lädt alle Quelldaten, reine Berechnungsfunktion(en) werten aus, eine Client-Komponente übernimmt Ebene-1/2/3-Navigation. Kein eigener API-Bereich | Kompetenzanalyse ist strukturell dieselbe Art von hub-übergreifender, rein lesender Auswertungsseite wie der bereits gebaute Wiederholungsplan — kein Grund für ein anderes Muster | 2026-09-12 |
| Bestehende Gültigkeitsfunktionen aus `karteikarten-intervall.ts`, `uebungsaufgaben-wiederholung.ts` und `klausuren-berechnung.ts` werden aufgerufen statt in der Kompetenzanalyse neu implementiert | Verhindert, dass das Gültig/Verfallen-Badge im jeweiligen Hub und die Stufenberechnung der Kompetenzanalyse auseinanderlaufen; einzige Quelle der Wahrheit pro Beleg-Typ | 2026-09-12 |
| `klausuren-berechnung.ts` wird um `BESTEHEN_SICHER`, `KLAUSUR_HALTBARKEIT` und eine Gültigkeitsprüfung für einen einzelnen Klausurteil ergänzt, statt eine Kopie in einer neuen Datei anzulegen | Diese Werte gehören inhaltlich zu Klausuren (Abschnitt 4 der Berechnungsspezifikation), nicht zur Kompetenzanalyse selbst; Wiederverwendung statt Duplikation, analog Karteikarten/Übungsaufgaben | 2026-09-12 |
| Stufen-Snapshot wird über eine Server-Aktion geschrieben, die beim Öffnen der Kompetenzanalyse ausgelöst wird (upsert, eindeutig auf Thema+Datum) — kein Cron-Job, kein separater Zeitplan-Dienst | Löst die offene Frage aus der Spec zugunsten der einfachsten Lösung ohne zusätzliche Infrastruktur; passt zum Kontext „kein Budget, Single-User, tägliche Nutzung erwartet". Tage ohne Seitenaufruf bleiben ohne Snapshot — für die Kalibrierung unkritisch, da sie fehlende Tage ohnehin überspringt (siehe Spec) | 2026-09-12 |
| Kalibrierung (Prädiktive Validität + Selbstbewertungs-Bias) ist eine reine Berechnungsfunktion ohne gespeichertes Ergebnis, wird bei jedem Laden neu berechnet | Konsistent mit dem Prinzip „nichts Berechnetes wird gespeichert" aus PROJ-3/PROJ-4, keine Sonderregel nur für Kalibrierung nötig | 2026-09-12 |
| Keine Pagination der Fehlernotizen-Liste in Ebene 3 — einfache scrollbare Liste | Löst die zweite offene Frage aus der Spec; bei realistischen Single-User-Datenmengen pro Thema ist eine vollständige Liste ausreichend performant, analog den bestehenden Listen in PROJ-3–5 | 2026-09-12 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponentenstruktur

```
/kompetenzanalyse (neue Seite)
├── Breadcrumb (nur ab Ebene 2/3 sichtbar: „Kompetenzanalyse / [Fach] / [Thema]")
├── EBENE 1 – Fächer-Übersicht (Startzustand)
│   ├── Fächer-Sidebar — 11 Fächer gruppiert nach Klausurtag K1/K2/K3, Ampel-Punkt +
│   │   Ø-Stufe je Fach, klickbar → Ebene 2
│   ├── Stufenverteilung-Card — gestapelter Balken je Fach (Segmente Stufe 0–4) + Legende
│   ├── Klausurreife-Card — je Fach mit ≥ 1 Klausur: Anzahl, Bestehens-Quote, Trend,
│   │   ggf. „braucht frische Klausur"
│   ├── Größte-Blockaden-Liste — Top 6 Themen nach Priowert, klickbar → Ebene 3
│   └── Kalibrierungs-Card (unten) — entweder „noch nicht genug Daten (x/10)" oder die
│       zwei Auswertungen (Prädiktive Validität, Selbstbewertungs-Bias)
├── EBENE 2 – Themen-Liste eines Fachs
│   ├── Kopfzeile (Fach-Name, Klausurtag-Badge, Gesamt-Ø-Stufe)
│   └── Themen-Liste, sortiert nach Priowert — je Zeile: Name, Stufen-Segmente,
│       Stufen-Badge, Beleganzahl, klickbar → Ebene 3
└── EBENE 3 – Themendetail
    ├── Kopfzeile (Fach, Thema, großes Stufen-Badge)
    ├── 4-Segment-Stufenanzeige + „Basis bröckelt"-Warnung (falls zutreffend) +
    │   Blockade-Hinweis
    ├── Vier-Säulen-Liste (Theorie/Klausurtechnik/Übung/Probeklausur) je mit
    │   Gültig/Verfallen/Keine-Daten-Status
    ├── Handlungsempfehlungs-Card (Blockade-Text + Fehlermuster-Zeilen + Standardtext)
    └── Fehlernotizen-Liste, chronologisch, mit Hub-Badge
```

Wiederverwendet werden die bestehenden Design-System-Bausteine (Card, Badge/Ampel, Breadcrumb, Select). Neu sind nur zwei kleine, Kompetenzanalyse-spezifische Anzeige-Bausteine: der gestapelte Stufenbalken und die 4-Segment-Stufenanzeige — beides reine Darstellungskomponenten ohne eigene Logik.

### B) Datenmodell (in einfacher Sprache)

Die Kompetenzanalyse besitzt fast keine eigenen Daten. Sie liest, was in den Hubs Karteikarten (PROJ-3), Übungsaufgaben (PROJ-4) und Probeklausuren (PROJ-5) bereits gespeichert ist, und berechnet daraus bei jedem Seitenaufruf live: Stufe, Blockade, Priowert, Klausurreife, Fehlermuster. Nichts davon wird zusätzlich gespeichert — dasselbe Prinzip wie beim bereits gebauten Wiederholungsplan.

Einzige neue, tatsächlich gespeicherte Information: **Stufen-Snapshot**, eine Zeile pro Thema und Kalendertag:
- Welches Thema
- Welches Datum
- Welche Stufe (0–4) hatte das Thema an diesem Tag
- War die Basis zu diesem Zeitpunkt schon „bröckelnd"?

Reine Historie für die spätere Kalibrierung (Prädiktive Validität) und einen noch nicht gebauten Trend-Chart — wird beim Öffnen der Kompetenzanalyse automatisch höchstens einmal pro Tag und Thema angelegt, nie überschrieben oder bearbeitet. Geschützt nach demselben Zugriffsmuster wie alle anderen Tabellen (jeder Nutzer sieht nur eigene Zeilen).

### C) Technische Entscheidungen (Begründung für PM)

1. **Gleiches Muster wie Wiederholungsplan (PROJ-7), kein neuer API-Bereich:** Die Seite lädt serverseitig alle nötigen Daten, eine reine Berechnungsfunktion wertet sie aus, eine interaktive Komponente übernimmt Navigation (Ebene 1/2/3) und Darstellung.
2. **Bestehende Gültigkeits-Logik wird wiederverwendet, nicht dupliziert:** Kompetenzanalyse ruft die bereits getesteten Funktionen aus den drei Hubs auf, statt sie neu zu schreiben — verhindert, dass das Gültig/Verfallen-Badge im Hub und die Stufenberechnung in der Kompetenzanalyse jemals auseinanderlaufen.
3. **`klausuren-berechnung.ts` wird um die fehlenden Werte ergänzt** (`BESTEHEN_SICHER`, `KLAUSUR_HALTBARKEIT`, Gültigkeitsprüfung für einen einzelnen Klausurteil) statt einer Kopie an anderer Stelle — diese Werte gehören inhaltlich zu Klausuren.
4. **Snapshot-Schreiben läuft beim Öffnen der Seite, kein Cron-Job:** Eine kleine, eigene Server-Aktion (gleiches Muster wie die bereits bestehenden Aktionen je Hub) prüft beim Laden, ob für jedes Thema heute schon ein Snapshot existiert, und legt ihn sonst an. Einfachste Lösung ohne zusätzliche Infrastruktur — passt zum Kontext „kein Budget, Single-User, tägliche Nutzung erwartet".
5. **Kalibrierung ist ebenfalls eine reine Berechnungsfunktion**, kein gespeichertes Auswertungsergebnis — wird bei jedem Laden neu berechnet.
6. **Keine Pagination der Fehlernotizen-Liste:** Bei realistischer Nutzung durch einen einzelnen Nutzer bleibt die Anzahl pro Thema klein; eine einfache scrollbare Liste reicht, analog zu PROJ-3–5.

### D) Abhängigkeiten (zu installierende Pakete)

Keine neuen Pakete. Die App hat bereits alles Nötige (Next.js, Supabase-Client, shadcn/ui, Vitest). Es kommt lediglich eine neue Datenbank-Tabelle (`stufen_verlauf`) sowie neue reine Berechnungsdateien hinzu — keine neue Bibliothek.

## Frontend Implementation Notes (Frontend Developer)

**Umgesetzt (2026-09-12):**
- `src/lib/kompetenzanalyse.ts`: reine Berechnungsfunktionen nach Berechnungsspezifikation Abschnitt 5 + 8 — `themaStufeVon` (Stufe 0–4 inkl. Subsumtionsregel + `basisBroeckelt`-Flag), `blockadeVon`/`blockadeKurztext`, `priowertVon`, `sortierteThemenNachPrio`/`groesseBlockaden`, `fachVerteilungVon`, `klausurreifeVon`, `saeulenVon` (Vier-Säulen-Status für Ebene 3), `fehlernotizenVon`, `fehlermusterVon` (Keyword-Matching), `empfehlungenVon`. Ruft ausschließlich die bereits bestehenden Gültigkeitsfunktionen aus `karteikarten-intervall.ts`/`uebungsaufgaben-wiederholung.ts`/`klausuren-berechnung.ts` auf (Tech-Design-Vorgabe), keine eigene Gültigkeitslogik pro Beleg.
- `src/lib/klausuren-berechnung.ts` + `src/lib/klausuren.ts`: ergänzt um `BESTEHEN_SICHER` (0,55), `KLAUSUR_HALTBARKEIT` (180 Tage) und `istTeilGueltig`/`istTeilGueltigVon` (Gültigkeitsprüfung eines einzelnen Klausurteils als Stufe-4-Beleg) — wie im Tech Design vorgesehen, keine Kopie in einer neuen Datei.
- `src/lib/kalibrierung.ts`: `anzahlKlausurenMitTeilen`/`kalibrierungBereit` (10er-Schwelle), `praediktiveValiditaetVon` (Matrix Stufe × Ergebnis, Abschnitt 9A), `selbstbewertungsBiasVon`/`durchschnittsBiasVon` (Abschnitt 9B). `StufenSnapshot`-Typ bereits vollständig definiert, obwohl die zugehörige Tabelle noch nicht existiert (siehe unten).
- UI: `src/components/kompetenzanalyse/` — `stufen-ui.tsx` (AmpelDot, StufenBalken, StufenSegmente, StufenLegende, Ampel-Farbmapping), `faecher-uebersicht.tsx` (Ebene 1: Fächer-Sidebar gruppiert nach Klausurtag, Stufenverteilung, Klausurreife, Größte Blockaden), `themen-liste.tsx` (Ebene 2), `thema-detail.tsx` (Ebene 3: Stufen-Segmente, Blockade-/Basis-bröckelt-Hinweis, Vier-Säulen-Status, Handlungsempfehlung, Fehlernotizen), `kalibrierungs-card.tsx`, `kompetenzanalyse-manager.tsx` (Client-Komponente, hält Ebene-1/2/3-Navigation als lokalen State, berechnet alle abgeleiteten Daten per `useMemo`).
- `src/app/kompetenzanalyse/page.tsx`: async Server Component, lädt live aus den bereits produktiven PROJ-2/3/4/5-Tabellen (`faecher`, `themen`, `karteikarten`(+`_themen`), `uebungsaufgaben`(+`_themen`,`_reviews`), `klausuren`, `klausur_teile`(+`_themen`)) — identisches Lade-/Fehlerbehandlungsmuster wie `wiederholungsplan/page.tsx` (PROJ-7).
- `tests/PROJ-8-kompetenzanalyse.spec.ts`: committeter Playwright-Test für den nicht eingeloggten Redirect (analog PROJ-1/2/3/6/7 — bewusst ohne echte Zugangsdaten im Repo).

**Bewusst noch nicht umgesetzt (folgt in `/backend`):**
- `stufen_verlauf` existiert als Tabelle noch nicht (keine Migration, keine RLS) — `page.tsx` übergibt daher eine bewusst leere Platzhalter-Konstante `initialSnapshots: StufenSnapshot[] = []` an den Manager, analog zu PROJ-3s leerer `initialKarten`-Konstante vor dessen Backend-Anbindung. Die Snapshot-Schreib-Server-Aktion (täglicher Upsert beim Seitenaufruf, siehe Tech Design) ist ebenfalls noch nicht angebunden.
- Auswirkung: Die Prädiktive-Validität-Auswertung (Abschnitt 9A) kann strukturell korrekt aufgerufen werden, findet aber mangels echter Snapshots aktuell nie eine Übereinstimmung — die Kalibrierungs-Card zeigt bis zur Backend-Anbindung ohnehin die „Noch nicht genug Daten"-Ansicht (0 von 10 Klausuren beim Nutzer), sodass dies aktuell nicht sichtbar ist.
- „Verbindung fehlgeschlagen"-AC (Fehler & Sicherheit) ist bereits mit den bestehenden Tabellen testbar; die RLS-Verweigerung speziell für `stufen_verlauf` erst mit der neuen Tabelle.

**Bewusste Implementierungsentscheidungen (Präzisierungen gegenüber der Spec):**
- **Priowert-Formel folgt dem Berechnungsspezifikations-Text, nicht dem Prototyp-Code:** Der Bonus „+2 wenn Stufe-3-Beleg in ≤ 7 Tagen abläuft" bezieht sich auf den Übungsaufgaben-Beleg (56-Tage-Haltbarkeit), wie im Text von Abschnitt 8 wörtlich beschrieben. Der HTML-Prototyp prüfte an dieser Stelle stattdessen den Klausurteil (Stufe-4-Beleg, 180-Tage-Haltbarkeit) — eine Abweichung zwischen Text und Prototyp-Code. Da die Berechnungsspezifikation laut Decision Log projektweit als maßgeblich gilt (siehe PROJ-5 `BESTEHEN_QUOTE`-Korrektur), folgt die Implementierung dem geschriebenen Text.
- **Klausurreife ist Fach-skaliert:** Bei einer Klausur mit Teilen mehrerer Fächer zählen für die Klausurreife eines Fachs nur dessen eigene Teile (Summe erreichte/max. Punkte dieser Teile), nicht die Gesamtquote der ganzen Klausur. Die Berechnungsspezifikation setzt noch das einfachere Ein-Fach-pro-Klausur-Modell voraus; PROJ-5 hat bereits die flexiblere Teile-Struktur eingeführt. Fach-Skalierung ist die einzige Lesart, die eine kombinierte Klausur nicht künstlich verzerrt.
- **Selbstbewertungs-Bias-Skalierung:** Um den `worst`-Wert (1–5) mit der Klausurteil-Quote (0–100 %) vergleichbar zu machen, wird die Quote linear auf dieselbe 1–5-Skala projiziert (`Quote × 5`). Die Berechnungsspezifikation legt keine exakte Umrechnung fest — dies ist eine bewusste, dokumentierte Annahme (`teilQuoteAlsSkala` in `kalibrierung.ts`).
- **„Anzahl geschriebener Klausuren" vs. „Anteil bestanden":** Erstere zählt alle Klausuren mit mindestens einem Teil dieses Fachs, auch unkorrigierte („Korrektur ausstehend"). Letztere bezieht sich nur auf bereits korrigierte Teile — eine unkorrigierte Klausur kann noch nicht als bestanden/nicht bestanden gelten.

**Gefundenes Datenproblem (kein Code-Bug):** Beim manuellen Verifizieren durch den Nutzer erschienen in „Größte Blockaden" mehrere Themen mit Namen wie `QA-Thema-A-<Timestamp>` — Testfixtures aus einer früheren QA-Session, die nie aus der Live-`themen`-Tabelle entfernt wurden. Kompetenzanalyse zeigte diese korrekt an (sie sind echte, wenn auch unbeabsichtigte Zeilen im Themenkatalog). Vom Nutzer selbst über die bestehende Löschfunktion in `/themen` (PROJ-2) bereinigt; danach bestätigt.

**Getestet:**
- **Unit-Tests (Vitest):** 261/261 grün — davon neu: 31 Tests `kompetenzanalyse.test.ts` (Stufenlogik inkl. Subsumtion und Basis-bröckelt, Blockade, Priowert, Fach-Verteilung, Klausurreife, Fehlernotizen-Aggregation inkl. Klausur→alle-Teile-Themen-Zuordnung, Fehlermuster, Empfehlungen, Säulen-Status), 11 Tests `kalibrierung.test.ts`, 5 neue Tests `klausuren-berechnung.test.ts` (`istTeilGueltig`).
- **`npm run build`:** fehlerfrei (TypeScript + Next.js Turbopack), `/kompetenzanalyse` erscheint korrekt als dynamische Route.
- **`npx playwright test`:** 30/30 grün (inkl. der 4 neuen PROJ-8-Redirect-Assertions über beide Browser-Projekte).
- **Live im Browser verifiziert (vom Nutzer, mit seinem echten Account gegen das echte Supabase-Projekt, da keine Zugangsdaten in dieser Session vorlagen):** Ebene 1 lädt mit korrekten „keine Daten"-Zuständen (graue Ampeln) bei leerer Lerndatenbank, Drilldown Ebene 1 → Fach (Ebene 2) → Thema (Ebene 3) funktioniert, Breadcrumb-Navigation zurück funktioniert. Bestätigt „passt nun" nach Bereinigung der oben genannten QA-Testfixtures.
- **Nicht in dieser Session verifiziert (siehe Bewusst noch nicht umgesetzt):** RLS-Verweigerung für `stufen_verlauf`, Verbindungsfehler-Anzeige mit echtem Netzwerkausfall, Kalibrierung mit ≥ 10 echten Klausuren (Nutzer hat aktuell 0), Responsive-Verhalten auf Tablet/Mobile-Breiten — sollte in `/qa` nachgeholt werden.

## Backend Implementation Notes (Backend Developer)

**Umgesetzt (2026-09-12):**
- `supabase/migrations/20260912090000_create_stufen_verlauf.sql`: neue Tabelle `stufen_verlauf` (`user_id`, `thema_id` FK auf `themen` mit `on delete cascade`, `datum`, `stufe` 0–4, `basis_broeckelt`, `created_at`). RLS aktiviert nach etabliertem Muster: `select`/`insert`-Policy auf `auth.uid() = user_id`, bewusst **keine** Update-/Delete-Policy — ein Snapshot ist unveränderlich, sobald er existiert (identisches Muster zu `karteikarten_reviews` aus PROJ-3). Eindeutiger Index auf `(thema_id, datum)` erzwingt „höchstens ein Snapshot pro Thema und Tag" auf DB-Ebene.
- `src/app/kompetenzanalyse/actions.ts`: neue Server-Aktion `speichereStufenSnapshot(themen, quellen)` — berechnet `themenStufenVon` serverseitig und schreibt sie per `upsert` mit `onConflict: "thema_id,datum", ignoreDuplicates: true` (SQL `ON CONFLICT DO NOTHING`), damit wiederholte Aufrufe am selben Tag nichts verändern (kein Aufruf `UPDATE`). Fehler werden bewusst verschluckt (try/catch), damit ein DB-Problem beim Snapshot-Schreiben nie den Seitenaufruf blockiert.
- **Aufruf direkt aus der Server Component statt über einen Client-Trigger:** `speichereStufenSnapshot` wird in `src/app/kompetenzanalyse/page.tsx` direkt nach dem Laden aller Quelldaten awaited — Server-Aktionen sind normale async Funktionen und können serverseitig direkt aufgerufen werden, nicht nur aus Client-Interaktionen heraus. Das entspricht exakt „Server-Aktion beim Öffnen der Seite" aus dem Tech Design, vermeidet aber einen zusätzlichen Client→Server-Roundtrip nach der Hydration und die damit verbundene Verzögerung/React-StrictMode-Doppelausführung. Kein Abweichen von der Architekturentscheidung, nur eine Präzisierung des Aufrufwegs.
- `src/app/kompetenzanalyse/page.tsx`: lädt jetzt zusätzlich `stufen_verlauf` (für die Kalibrierungs-Card) und übergibt echte Daten statt der bisherigen leeren Platzhalter-Konstante.
- `src/app/kompetenzanalyse/actions.test.ts`: 5 neue Vitest-Tests (kein Supabase-Aufruf ohne Themen/Session, korrekter Upsert inkl. Optionen, Fehler und Exceptions werden verschluckt) — gleiches Mock-Pattern wie die bestehenden `actions.test.ts`-Dateien (`createClient` gemockt, kein echter Netzwerkzugriff).
- Migration erfolgreich auf das echte, verknüpfte Supabase-Projekt angewendet (`npx supabase db push`, vom Nutzer autorisiert/durchgeführt).

**Sicherheit:** Kein neuer API-Bereich (Projekt-Konvention: ausschließlich Server Actions + Server Components, kein `src/app/api/`). Einziger neuer Schreibpfad ist der Snapshot-Upsert, RLS-geschützt wie oben beschrieben. Alle Lesezugriffe in `page.tsx` nutzen ausschließlich bereits bestehende, RLS-geschützte Tabellen.

**Getestet:**
- **Unit-Tests (Vitest):** 266/266 grün (261 aus dem Frontend-Durchlauf + 5 neue für `speichereStufenSnapshot`).
- **`npm run build`:** weiterhin fehlerfrei.
- **`npx supabase db push`:** erfolgreich, Migration `20260912090000_create_stufen_verlauf.sql` auf dem Live-Projekt angewendet (Ausgabe: `"Finished supabase db push."`).
- **Nicht in dieser Session verifiziert:** Snapshot-Schreiben live gegen die neue Tabelle (Nutzer hat aktuell keine Themen mit Belegen, die einen aussagekräftigen Effekt zeigen würden), RLS-Verweigerung für `stufen_verlauf` ohne gültige Session, Kalibrierung mit echten Snapshots über mehrere Tage — sollte in `/qa` nachgeholt bzw. im laufenden Betrieb beobachtet werden, sobald echte Lerndaten vorliegen.

## QA Test Results

**Tested:** 2026-09-12
**App URL:** http://localhost:3000 (Dev-Server), Live-Daten gegen das echte, verknüpfte Supabase-Projekt
**Tester:** QA Engineer (AI)
**Test-Account:** dedizierter, vom Nutzer bereitgestellter Test-Account (nicht das Hauptkonto), mit bereits vorhandenen Altdaten aus früheren QA-Durchläufen (5 Themen in AO/ESt, 1 Probeklausur) — Zugangsdaten nicht persistiert, nur transient in dieser Session verwendet

### Automatisierte Tests
- **Unit-/Integrationstests (Vitest):** 266/266 grün (unverändert seit /backend)
- **`npm run build`:** fehlerfrei
- **E2E (Playwright):** 30/30 grün, inkl. der 2 committeten PROJ-8-Redirect-Tests über beide Browser-Projekte (chromium + Mobile Safari)
- **Datenbank-Diagnose via `npx supabase db query --linked`:**
  - `stufen_verlauf`: nach ca. 15+ Seitenaufrufen am selben Tag existieren exakt 5 Zeilen (eine je Thema des Test-Accounts), alle mit `datum = 2026-09-12` — bestätigt, dass der `ON CONFLICT DO NOTHING`-Upsert korrekt dedupliziert (AC „Stufen-Snapshot" beide Punkte: neuer Eintrag bei Bedarf, kein Zweiteintrag am selben Tag)
  - RLS-Policies auf `stufen_verlauf`: genau eine `select`- und eine `insert`-Policy, beide `auth.uid() = user_id`, keine `update`/`delete`-Policy; `relrowsecurity = true` — exakt wie in der Migration spezifiziert

### Acceptance Criteria Status (32 ACs gesamt)

#### Zugriff & Grundgerüst (3/3)
- [x] Nicht eingeloggt → Redirect zu `/login?redirect=...` (E2E + live)
- [x] Eingeloggt → Ebene 1 lädt mit 11 Fächern, gruppiert nach K1/K2/K3 (live bestätigt)
- [x] Keine Lerndaten → „keine Daten" (graue Ampel) statt Stufenangabe (live bestätigt: 6 von 11 Fächern im Test-Account zeigten dies korrekt)

#### Ebene 1 — Fächer-Übersicht (6/8)
- [x] Gestapelter Balken pro Fach, ein Segment je Stufe (live: AO grauer Balken, ESt farbiger Balken)
- [x] Ø-Stufe-Anzeige bei Fach mit Daten (live: „Ø 0,0" / „Ø 3,0")
- [x] Fach ohne Probeklausur erscheint nicht in der Klausurreife-Liste (live: nur Abgabenordnung gelistet, nicht alle 11)
- [ ] **BUG-1:** Anzahl/Anteil bestanden werden angezeigt, der geforderte **Trend** fehlt komplett in der UI
- [ ] **BUG-1 (Folge):** Trend-„–"-Anzeige bei < 6 Klausuren kann nicht greifen, da keine Trend-UI existiert
- [x] „Fach braucht frische Klausur"-Hinweis vorhanden im Code (`brauchtFrischeKlausur`-Bedingung), im Test-Account nicht auslösbar (Klausur ist 4 Tage alt) — Logik bereits durch `kompetenzanalyse.test.ts` abgedeckt
- [ ] **BUG-2:** „Größte Blockaden" zeigt Thema, Blockade-Text und Stufen-Badge, aber **nicht den Fach-Namen** (AC verlangt ausdrücklich „inkl. Fach")
- [x] Klick auf Fach/Thema in „Größte Blockaden" navigiert korrekt zu Ebene 2/3 (live bestätigt)

#### Ebene 2 — Themen-Liste eines Fachs (3/3)
- [x] Themen sortiert nach Priowert absteigend (live: AO zeigte alle 4 Themen mit Priowert 8 vor Steuerpflicht mit Priowert 2 in ESt-Ansicht separat korrekt)
- [x] „Keine Themen"-Hinweis (Code-Pfad vorhanden, im Test-Account kein Fach ohne Themenkatalog-Eintrag zum Live-Test verfügbar — trivialer Zweig, kein Risiko)
- [x] Breadcrumb „Kompetenzanalyse" führt zurück zu Ebene 1 (live bestätigt)

#### Ebene 3 — Themendetail (10/10)
- [x] Stufe-Badge + 4-Segment-Anzeige (live an 3 verschiedenen Themen bestätigt)
- [x] „Basis bröckelt"-Hinweis: Negativfall live bestätigt (Steuerpflicht: Theorie-Karte verfallen, aber via Übungs-Subsumtion gedeckt → **kein** Bröckeln-Hinweis, korrekt); Positivfall bereits durch 4 gezielte Unit-Tests abgedeckt (im Test-Account nicht ohne künstliche Datumsmanipulation nachstellbar)
- [x] Blockade-Hinweis benennt korrekt das Fehlende (live 2× bestätigt: „Stufe 1 blockiert: eine gültige Theorie-Karte fehlt…", „Stufe 4 blockiert: noch kein Klausurteil…")
- [x] Stufe 4 ohne Bröckeln → „warm halten"-Empfehlung (unit-testabgedeckt; im Test-Account kein Thema auf sauberer Stufe 4, daher nicht live reproduziert)
- [x] Vier-Säulen-Status je Säule (live bestätigt, inkl. „verfallen" bei 0%-Klausurteil und „gültig" bei frischer Übung)
- [x] Fehlernotizen chronologisch mit Hub-Badge + Datum (live bestätigt, korrekt sortiert nach Anlage eines zweiten Eintrags)
- [x] Klausur-Stufe-1/2-Text erscheint bei jedem Thema aller Teile dieser Klausur (live bestätigt: „AO 01 · Stufe 1"-Badge bei Einspruchsverfahren)
- [x] „Keine Fehlernotizen — sauber gearbeitet." (live bestätigt bei Steuerpflicht vor dem Test-Eintrag)
- [x] Fehlermuster-Keyword → Musterzeile in der Handlungsempfehlung (live bestätigt: „vergessen" im Fehlernotiz-Text löste korrekt „wiederkehrendes Vergessen einzelner Tatbestandsmerkmale" aus)
- [x] Kein Blockade/Bröckeln/Muster → Standardtext (unit-testabgedeckt, im Test-Account keine passende Konstellation vorhanden)

#### Stufen-Snapshot (2/2)
- [x] Neuer Eintrag pro Thema/Tag — per DB-Query bestätigt (siehe oben)
- [x] Kein Zweiteintrag am selben Tag — per DB-Query bestätigt (5 Zeilen trotz ~15+ Aufrufen)

#### Kalibrierung (1/4 live, 3/4 unit-testabgedeckt)
- [x] < 10 Klausuren → „Noch nicht genug Daten (x/10)" (live bestätigt: „1/10 Klausuren", korrekt entsprechend der einen echten Klausur im Test-Account)
- [x] Prädiktive-Validität-Matrix / Ausschluss ohne Snapshot / Selbstbewertungs-Bias — nicht live erreichbar (Schwelle von 10 Klausuren im Test-Account nicht praktikabel künstlich zu erzeugen), vollständig durch 11 gezielte Unit-Tests in `kalibrierung.test.ts` abgedeckt

#### Fehler & Sicherheit (2/2, siehe auch Security Audit)
- [x] „Verbindung fehlgeschlagen" — einmalig live beobachtet (siehe Bugs/Beobachtungen unten), Mechanismus identisch zu bereits deployten Hubs
- [x] RLS-Verweigerung für `stufen_verlauf` ohne Session — per direkter Policy-Inspektion bestätigt (siehe oben); kein clientseitiger Supabase-Zugriff in der App vorhanden, der sich anders testen ließe (siehe Security Audit)

### Edge Cases Status
- [x] Subsumtion ohne Karteikarten (Abschnitt 5.3) — **live bestätigt** am Thema „Steuerpflicht": Stufe 3 erreicht ausschließlich über eine Übungsaufgabe, keine Klausurtechnik-Karte vorhanden
- [x] Unbearbeitetes Thema = gleicher Priowert wie aktives Stufe-0-Thema — live bestätigt (Statthaftigkeit/Zuständigkeit Finanzamt, beide „keine Daten", Priowert 8, identisch zu den Stufe-0-Themen)
- [x] Probeklausur ohne Teile — nicht im Test-Account vorhanden, Logik unit-testabgedeckt
- [x] Mehrere Teile demselben Thema zugeordnet — unit-testabgedeckt
- [x] Widersprüchliche Fehlernotizen chronologisch ohne Filterung — unit-testabgedeckt
- [x] Mehrmaliger Aufruf am selben Tag ändert Snapshot nicht — **live per DB-Query bestätigt** (siehe oben)
- [x] Neues Thema ohne Belege — live bestätigt (mehrere „keine Daten"-Themen im Test-Account)
- [x] Kalibrierungs-Schwelle live während Sitzung erreicht — kein Live-Update nötig, Code-Pfad trivial (kein Polling/Subscription implementiert)

### Security Audit Results
- [x] **Authentifizierung:** Kein Zugriff ohne Login (E2E + live bestätigt)
- [x] **Kein clientseitiger Supabase-Zugriff:** `src/lib/supabase/client.ts` wird von keiner einzigen Komponente importiert — die gesamte App (inkl. PROJ-8) ist vollständig serverseitig gerendert. Es gibt keinen Anon-Key/Session-Token im Browser-Bundle und damit keine direkte Client→Supabase-Angriffsfläche für diese Seite
- [x] **RLS auf der neuen Tabelle `stufen_verlauf`:** per SQL-Inspektion bestätigt — RLS aktiviert, exakt `select`/`insert` auf `auth.uid() = user_id`, keine `update`/`delete`-Policy (Historie unveränderlich)
- [x] **XSS-Test:** Testkarteikarte mit Fehlernotiz-Payload `<img src=x onerror="window.__xssFired=true">Fehler vergessen!` angelegt und in der Kompetenzanalyse-Themendetailansicht angezeigt — Skript wurde **nicht** ausgeführt (`window.__xssFired` blieb `undefined`), Payload erschien als reiner Text (React-Escaping via `innerHTML`-Inspektion verifiziert: `&lt;img src=x onerror=...&gt;`). Testkarte anschließend vollständig gelöscht (verifiziert: 0 verbleibend)
- [x] **Fehlermeldungen ohne Detail-Leak:** generische `CONNECTION_ERROR`-Meldung, keine Stacktraces/Interna sichtbar
- [ ] **Autorisierung (Nutzer X sieht nicht Daten von Nutzer Y):** nicht mit einem zweiten echten Account getestet (nur ein Test-Account verfügbar) — Bewertung stützt sich auf Code-Review: identisches, bereits mehrfach auditiertes RLS-Muster wie `karteikarten_reviews` (PROJ-3); kein neuer Autorisierungscode in PROJ-8 selbst
- N/A **Rate Limiting:** kein neuer öffentlich erreichbarer Endpunkt durch PROJ-8 (kein Signup, kein `/api`-Bereich) — nichts Neues zu prüfen

### Regression-Test
- Bestehende E2E-Redirect-Tests für PROJ-1/2/3/6/7 weiterhin grün (30/30 gesamt)
- `/karteikarten` manuell mit einer Anlegen+Löschen-Aktion exercised (für den XSS-Test) — Hub funktioniert unverändert, keine Auffälligkeiten
- Keine Änderungen an bestehenden Hub-Tabellen/-RLS-Policies durch PROJ-8, nur eine additive neue Tabelle — geringes Regressionsrisiko strukturell bereits durch Code-Review abgedeckt

### Bugs Found

#### BUG-1: Klausurreife-Card zeigt keinen Trend an
- **Severity:** High
- **Steps to Reproduce:**
  1. Mindestens eine Probeklausur für ein Fach erfassen
  2. `/kompetenzanalyse` öffnen, Klausurreife-Card ansehen
  3. Erwartet: Anzahl, Anteil bestanden **und Trend der letzten 3 vs. 3 davor** (oder „–" bei < 6 Klausuren)
  4. Tatsächlich: Nur Anzahl („X Kl.") und Anteil („Y % best.") werden angezeigt, keine Trend-Spalte existiert im UI
- **Ursache:** `klausurreifeVon()` in `src/lib/kompetenzanalyse.ts` berechnet `trend` korrekt (unit-testabgedeckt), aber `FaecherUebersicht`-Komponente (`faecher-uebersicht.tsx`) rendert das Feld nirgends
- **Priority:** Fix before deployment

#### BUG-2: „Größte Blockaden" zeigt den Fach-Namen nicht an
- **Severity:** Medium
- **Steps to Reproduce:**
  1. `/kompetenzanalyse` öffnen mit Themen aus mehreren Fächern in der Blockaden-Liste
  2. Erwartet (AC): Zeile zeigt Thema, **Fach**, Blockade-Text und Stufen-Badge
  3. Tatsächlich: Nur Thema-Name und Blockade-Text werden gezeigt, kein Fach — bei gleichnamigen Themen unterschiedlicher Fächer nicht mehr unterscheidbar, ohne draufzuklicken
- **Priority:** Fix before deployment (klein, aber explizit in der Spec gefordert)

### Beobachtungen (kein Bug)
- **Einmaliger transienter Verbindungsfehler:** Beim allerersten Seitenaufruf nach einem frischen Serverstart (kurz nach einem Systemneustart) erschien einmalig „Verbindung fehlgeschlagen"; 3 sofortige Wiederholungen liefen fehlerfrei. Nicht reproduzierbar, vermutlich Kaltstart-Latenz der ersten Server→Supabase-Verbindung. Das zugrunde liegende `Promise.all`-über-10-Tabellen-Muster ist identisch zu PROJ-7 (deployed, ohne bekannte Probleme).
- Im Rahmen dieser Session wurden erneut alte, nicht bereinigte QA-Testfixtures im Test-Account bemerkt (Themen aus früheren QA-Durchläufen) — kein PROJ-8-Bug, lediglich zur Kenntnis: der Test-Account sollte bei Gelegenheit bereinigt oder klar als dauerhafter Fixture-Pool dokumentiert werden.

### Summary
- **Acceptance Criteria:** 29/32 passed (3 durch BUG-1/BUG-2 verletzt)
- **Bugs Found:** 2 total (0 critical, 1 high, 1 medium, 0 low)
- **Security:** Pass — keine Schwachstellen gefunden (XSS getestet und sicher, RLS korrekt konfiguriert, keine clientseitige Angriffsfläche); Autorisierungstest zwischen zwei echten Accounts konnte mangels zweitem Account nicht live durchgeführt werden (Code-Review-Grundlage: identisches auditiertes Muster)
- **Production Ready:** NO
- **Recommendation:** BUG-1 und BUG-2 vor Deployment beheben (beide sind reine Frontend-Anzeige-Lücken, keine Berechnungsfehler — die zugrunde liegenden Daten sind bereits korrekt vorhanden und unit-getestet). Danach erneuten `/qa`-Durchlauf zur Re-Verifikation der beiden Fixes.

## Deployment
_To be added by /deploy_
