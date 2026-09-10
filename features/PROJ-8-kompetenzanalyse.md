# PROJ-8: Kompetenzanalyse

## Status: Planned
**Created:** 2026-09-11
**Last Updated:** 2026-09-11

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
- [ ] Genauer Auslösemechanismus für den täglichen Stufen-Snapshot (Cron-Job vs. Berechnung beim ersten Seitenaufruf des Tages) — wird in `/architecture` festgelegt
- [ ] Zeichenlimits/Pagination für die Fehlernotizen-Liste bei sehr vielen Einträgen — wird in `/architecture` festgelegt, analog PROJ-2–5

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

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
