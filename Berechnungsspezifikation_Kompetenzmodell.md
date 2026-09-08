# Berechnungsspezifikation – Kompetenzmodell 2.0 (Examensplaner StB)

Übergabedokument für den Umbau des bestehenden Planers. Ersetzt die bisherige
prozentbasierte Kompetenzberechnung (gewichteter Durchschnitt 10/20/30/40) durch
ein Stufenmodell mit zwei Messdimensionen: **Niveau** und **Haltbarkeit**.
Die Dimension "Evidenzmenge" (Mindestanzahl von Belegen) entfällt bewusst.

Bezugssystem: bestehende Hubs Theorie, Klausurtechnik, Übungsaufgaben,
Probeklausuren; zentraler Themenkatalog; Supabase-Backend laut bestehendem Schema.

---

## 0. Grundprinzipien

1. Ein Thema hat keinen Prozentwert, sondern eine **Stufe 0–4**.
2. Eine Stufe gilt als erreicht, wenn die zugehörigen Belege das geforderte
   **Niveau** haben UND ihre **Haltbarkeit** nicht abgelaufen ist. Beide
   Bedingungen konjunktiv – kein Mittelwert, keine Gewichtung.
3. Belege **verfallen**: Wird die vom Wiederholungsalgorithmus gesetzte
   Fälligkeit (zzgl. Karenz) überschritten, gilt der Beleg als nicht mehr
   gehalten und die Stufe fällt automatisch zurück. Die Vergessenskurve ist
   damit direkt im Modell abgebildet – keine separate Simulation nötig.
4. **Subsumtionsregel**: Prüfungsnähere Belege decken die darunterliegenden
   Stufen implizit mit ab (Details in Abschnitt 5.3).
5. Alle Schwellen sind **Parameter** (Abschnitt 1), keine Hardcodes. Sie werden
   über die Kalibrierungs-Views (Abschnitt 9) empirisch überprüfbar.

---

## 1. Parameter (konfigurierbar, mit Default-Werten)

| Parameter | Default | Bedeutung |
|---|---|---|
| `NIVEAU_SCHWELLE` | 4 | Mindestbewertung (1–5-Skala), damit ein Beleg zählt |
| `START_INTERVALL` | 1 Tag | Erstes Wiederholungsintervall nach Anlage einer Karte |
| `GRADUIERUNG` | 3 Tage (Bew. 4) / 4 Tage (Bew. 5) | Intervall nach dem ersten erfolgreichen Abruf |
| `FAKTOR_5` | 2,5 | Intervallmultiplikator bei Bewertung 5 |
| `FAKTOR_4` | 2,0 | Intervallmultiplikator bei Bewertung 4 |
| `FAKTOR_3` | 1,0 | Bewertung 3: Intervall bleibt unverändert |
| `FUZZ` | ±15 % | Zufallsrauschen auf jedes neue Intervall |
| `KARENZ_FAKTOR` | 0,25 | Karenzzeit = 25 % des Intervalls (min. `KARENZ_MIN`) |
| `KARENZ_MIN` | 2 Tage | Untergrenze der Karenzzeit |
| `INTERVALL_MAX` | 120 Tage | Absolute Obergrenze eines Intervalls |
| `FREISTELLUNG_CAP` | 21 Tage | Intervall-Obergrenze innerhalb der Freistellungsphase |
| `FREISTELLUNG_START` | Prüfungsdatum − 84 Tage | Beginn der Freistellungsphase (12 Wochen) |
| `UEB_HALTBARKEIT` | 56 Tage | Gültigkeitsdauer eines Übungsaufgaben-Belegs (8 Wochen) |
| `UEB_WDH_BEI_3` | 7 Tage | Wiederholungsabstand nach Worst-Wert 3 |
| `UEB_WDH_BEI_12` | 5 Tage | Wiederholungsabstand nach Worst-Wert 1–2 (nach Nacharbeit) |
| `UEB_WDH_FINAL` | 21 Tage | Abstand der letzten (2.) Wiederholung |
| `UEB_WDH_MAX` | 2 | Maximale Anzahl Wiederholungen derselben Aufgabe |
| `KLAUSUR_HALTBARKEIT` | 180 Tage | Gültigkeitsdauer eines Klausurteil-Belegs (6 Monate) |
| `BESTEHEN_QUOTE` | 0,40 | Bestehensniveau (Anteil erreichter Punkte) — korrigiert 2026-09-09, siehe PROJ-5 Decision Log |
| `BESTEHEN_SICHER` | 0,55 | Bestehensniveau mit Sicherheitsaufschlag – maßgeblich für Stufe 4 |
| `NACHSCHREIBEN_TAGE` | 75 | Bestehende Stufe-3-Erinnerung Probeklausuren (unverändert) |

---

## 2. Wiederholungsalgorithmus Karteikarten (Hubs Theorie & Klausurtechnik)

Ersetzt das bisherige starre Mapping (1→1 / 2→3 / 3→9 / 4→27 / 5→81 Tage) durch
einen multiplikativen, zustandsbasierten Algorithmus nach SM-2-Vorbild
(Ziel-Behaltensrate ~90 %, expandierende Intervalle, Reset bei Lapse).

### 2.1 Zustand pro Item

Jedes Item (Frage/Karteikarte) führt:

- `intervall` (Tage, Dezimalwert intern, gerundet bei Terminvergabe)
- `wdh_count` (Anzahl bisheriger Bewertungen)
- `bewertung` (letzte Bewertung 1–5)
- `wdh_datum` (nächste Fälligkeit)

### 2.2 Übergangsfunktion

Bei jeder Bewertung `b` eines Items:

```
wenn wdh_count == 0:                        // Erstbewertung bei Anlage
    wenn b >= 4:   intervall = GRADUIERUNG(b)   // 3 bzw. 4 Tage
    wenn b == 3:   intervall = 2
    wenn b <= 2:   intervall = START_INTERVALL  // 1 Tag
sonst:                                      // Folgebewertungen
    wenn b == 5:   intervall = intervall * FAKTOR_5
    wenn b == 4:   intervall = intervall * FAKTOR_4
    wenn b == 3:   intervall = intervall * FAKTOR_3   // bleibt gleich
    wenn b <= 2:   intervall = START_INTERVALL        // Lapse: Reset

intervall = intervall * zufall(1 - FUZZ, 1 + FUZZ)
intervall = min(intervall, INTERVALL_MAX)
wenn heute >= FREISTELLUNG_START:
    intervall = min(intervall, FREISTELLUNG_CAP)
intervall = min(intervall, tage_bis(pruefungsdatum) - 1)   // nie über den Termin hinaus
intervall = max(intervall, 1)

wdh_datum = heute + runden(intervall)
wdh_count = wdh_count + 1
```

Beispielverläufe (ohne Fuzz):
- Kette aus 4ern: 1 → 3 → 6 → 12 → 24 → 48 → 96 Tage
- Kette aus 5ern: 1 → 4 → 10 → 25 → 63 → 120 (Cap)
- 4, 4, 3, 4: 1 → 3 → 6 → 6 → 12 Tage
- 4, 4, 2 (Lapse): 1 → 3 → 6 → 1 (Reset), danach neuer Aufbau

### 2.3 Historie

Jede Bewertung wird zusätzlich als Zeile in einer neuen Tabelle `reviews`
protokolliert (Abschnitt 7). Das aktuelle Item-Feld `bewertung` spiegelt nur den
letzten Stand; die Historie wird für Verlaufsdiagramme und Kalibrierung benötigt.

---

## 3. Wiederholungslogik Übungsaufgaben

Kriteriumsbasiert, maximal `UEB_WDH_MAX` Wiederholungen derselben Aufgabe.
Mindestabstand 5–7 Tage, damit die konkrete Musterlösung nicht mehr aus dem
Wortgedächtnis abrufbar ist (Vermeidung des Recognition-Artefakts).

`worst = min(fachlich, technik)` der jeweiligen Bearbeitung.

```
wenn worst >= 4:
    keine Wiederholung dieser Aufgabe.
    Beleg gültig für UEB_HALTBARKEIT (56 Tage).
    Nach Ablauf: KEIN Wiederholungstermin für dieselbe Aufgabe, sondern
    Empfehlungs-Flag "Thema braucht frische Anwendungsevidenz"
    (zu decken durch neue Aufgabe zum Thema oder Klausurteil).

wenn worst == 3:
    pflicht_wdh = heute + UEB_WDH_BEI_3 (7 Tage), idealerweise als Abwandlung.
    Ergebnis der Wiederholung:
        worst >= 4  → erledigt, Beleg gültig (56 Tage ab Wiederholungsdatum)
        worst <= 3  → Hinweis "Rückstufung in Theorie/Schema-Arbeit";
                      letzte Wiederholung nach UEB_WDH_FINAL (21 Tagen)

wenn worst <= 2:
    Empfehlung: erst Nacharbeit (Fehleranalyse, betroffene Karteikarten),
    pflicht_wdh = heute + UEB_WDH_BEI_12 (5 Tage) als Kontrolle der Nacharbeit.
    Danach identisch zur Zeile darüber (2. Wiederholung nach 21 Tagen, max. 2).
```

Offene Pflicht-Wiederholungen blockieren Stufe 3 (siehe 5.2). Nach Ausschöpfen
von `UEB_WDH_MAX` wird die Aufgabe geschlossen; weitere Evidenz nur über neue
Aufgaben.

---

## 4. Haltbarkeit: Gültigkeitsstatus eines Belegs

Zentrale Hilfsfunktion, überall identisch verwendet:

```
karenz(item)  = max(KARENZ_MIN, item.intervall * KARENZ_FAKTOR)

gueltig(karteikarten_item) =
    item.bewertung >= NIVEAU_SCHWELLE
    UND heute <= item.wdh_datum + karenz(item)

gueltig(uebungs_beleg) =
    beleg.worst >= NIVEAU_SCHWELLE
    UND heute <= beleg.datum + UEB_HALTBARKEIT
    UND keine offene pflicht_wdh für diese Aufgabe

gueltig(klausurteil_beleg) =
    teil.punkte / teil.max_punkte >= BESTEHEN_SICHER
    UND heute <= klausur.datum + KLAUSUR_HALTBARKEIT
```

Ein Item mit letzter Bewertung ≤ 3 ist unmittelbar ungültig (Niveau verfehlt).
Ein Item mit Bewertung ≥ 4, dessen Fälligkeit + Karenz überschritten ist, ist
ungültig (Haltbarkeit abgelaufen) – es zählt erst wieder nach erneutem
erfolgreichem Abruf. Es gibt keinen Zwischenzustand und keine anteilige Wertung.

---

## 5. Stufenlogik pro Thema

### 5.1 Direkte Kriterien

| Stufe | Kriterium (Niveau + Haltbarkeit) |
|---|---|
| **1 – Theorie bekannt** | Mind. 1 Theorie-Item zum Thema existiert UND **alle** Theorie-Items des Themas sind gültig i. S. v. Abschnitt 4 |
| **2 – Schema abrufbar** | Mind. 1 Klausurtechnik-Item zum Thema existiert UND **alle** Klausurtechnik-Items des Themas sind gültig |
| **3 – Anwendung gelingt** | Die **jüngste** Übungsaufgabe zum Thema hat `worst >= 4`, ist ≤ 56 Tage alt UND es existiert keine offene Pflicht-Wiederholung einer Aufgabe dieses Themas |
| **4 – klausurfest** | Der **jüngste** Klausurteil zum Thema erreicht `>= BESTEHEN_SICHER` und ist ≤ 180 Tage alt |

Anmerkungen:
- "Alle Items" bei Stufe 1/2 ist ein **Niveau**-Kriterium, keine Mengenanforderung:
  Eine einzige gültige Karte reicht, aber eine einzige verfehlte Karte (Bewertung
  ≤ 3 oder überfällig) verhindert die Stufe – eine Lücke im Schema ist eine Lücke.
- Bei Stufe 3 zählt die jüngste Aufgabe (aktueller Zustand), nicht der
  Durchschnitt der Historie. Frühe Fehlversuche belasten den Status nicht.

### 5.2 Berechnung der Themen-Stufe

```
stufe(thema) = höchstes n ∈ {1..4}, für das gilt:
    kriterium(n) direkt erfüllt ODER durch Subsumtion (5.3) gedeckt
sonst 0.
```

Zusätzlich wird ein Flag `basis_broeckelt` gesetzt, wenn die angezeigte Stufe n
erreicht ist, aber ein direktes Kriterium einer Stufe < n nicht mehr erfüllt und
auch nicht subsumiert ist (z. B. Stufe 4 über einen Klausurteil, aber die
Schema-Karteikarten sind inzwischen verfallen). Das Flag erzeugt eine
Handlungsempfehlung, keine Rückstufung.

### 5.3 Subsumtionsregel

Prüfungsnähere Evidenz deckt niedrigere Stufen implizit:

```
Stufe 1 gilt auch als gedeckt, wenn: jüngste Übungsaufgabe des Themas
    fachlich >= 4 und <= 56 Tage alt
Stufe 2 gilt auch als gedeckt, wenn: jüngste Übungsaufgabe des Themas
    technik  >= 4 und <= 56 Tage alt
Stufen 1–3 gelten als gedeckt, wenn: Stufe-4-Kriterium direkt erfüllt ist
    (dann greift ggf. das Flag basis_broeckelt für verfallene Karteikarten)
```

Konsequenz: Wer ein Thema direkt über Übungsaufgaben nachweist, muss nicht
zwingend Karteikarten dazu führen. Das Modell zählt den Nachweis, nicht den Weg.

### 5.4 Rückfall-Verhalten (automatisch, keine Sonderlogik)

Da die Stufe bei jedem Aufruf aus den Gültigkeitsfunktionen berechnet wird
(kein gespeicherter Stufenwert), führt jeder Verfall automatisch zum Rückfall:
Läuft der Stufe-3-Beleg ab und die Karteikarten sind noch gültig, zeigt das
Thema wieder Stufe 2. Für die Kompetenzentwicklung im Zeitverlauf wird die
berechnete Stufe täglich in eine Snapshot-Tabelle `stufen_verlauf` geschrieben
(thema_id, datum, stufe) – daraus entsteht das Verlaufsdiagramm.

---

## 6. Probeklausuren: teilaufgabenweise Erfassung

Die bisherige pauschale Zuordnung der Gesamtquote auf alle Klausur-Themen
entfällt. Neue Struktur:

- Eine Klausur besteht aus 1–n **Teilen** (`klausur_teile`).
- Jeder Teil: Bezeichnung (z. B. "Teil I – ErbSt"), Themen (Mehrfachauswahl aus
  dem Themenkatalog), Maximalpunkte, erreichte Punkte.
- Stufe-4-Evidenz entsteht **pro Teil** für die dort zugeordneten Themen
  (Quote = teil.punkte / teil.max_punkte).
- Die Klausur-Gesamtquote (Summe der Teile) dient nur der Fach-Ebene (Abschn. 7)
  und der Notenanzeige. Das Drei-Stufen-Nacharbeitsmodell (Stufe 1/2/3 der
  Nacharbeit) bleibt unverändert auf Klausur-Ebene.
- UI: Beim Anlegen einer Klausur können Teile optional erfasst werden. Ohne
  Teile erzeugt die Klausur KEINE themenscharfe Stufe-4-Evidenz, sondern nur
  Fach-Evidenz – bewusste Entscheidung gegen Fehlattribution.

---

## 7. Datenbank-Änderungen (Supabase)

Bestehende Tabellen ergänzen:

```
theorie, klausurtechnik:
    + intervall        numeric   (Tage, aktueller Intervallzustand)
    + wdh_count        int       (Anzahl Bewertungen)
    (bewertung = letzte Bewertung; wdh_datum wie bisher)

uebungen:
    + pflicht_wdh_datum  date    (null = keine offene Wiederholung)
    + status             text    ('offen' | 'erledigt' | 'geschlossen')
    (wdh_count wie bisher, gedeckelt durch UEB_WDH_MAX)

klausuren:
    unverändert; erreichte_punkte/max_punkte bleiben für Fach-Ebene
```

Neue Tabellen:

```
reviews:         id, user_id, item_typ ('theorie'|'klausurtechnik'|'uebung'),
                 item_id, datum, bewertung, bewertung_2 (nur Übung: technik),
                 intervall_danach
klausur_teile:   id, user_id, klausur_id (FK), nr, bezeichnung,
                 themen text[], max_punkte int, punkte int
stufen_verlauf:  id, user_id, thema_id (FK), datum, stufe int,
                 basis_broeckelt bool   (täglicher Snapshot, Unique auf
                 thema_id+datum)
parameter:       key, value  (alle Werte aus Abschnitt 1, pro User)
```

Row Level Security auf allen neuen Tabellen wie im Bestand.

---

## 8. Fach-Ebene: zwei getrennte Kennzahlen

Ein Fach erhält keinen Einzelwert mehr, sondern:

1. **Stufenverteilung**: Anzahl Themen des Fachs je Stufe 0–4
   (Darstellung: gestapelter Balken; ersetzt das Spiderweb als Analyse-Ansicht).
2. **Klausurreife** (nur aus Probeklausuren des Fachs):
   - Anzahl geschriebener Klausuren (Zähler Richtung 30–50-Ziel)
   - Anteil der Klausuren mit Gesamtquote >= BESTEHEN_QUOTE
   - Trend: Quoten der letzten 3 Klausuren vs. der 3 davor
   - jüngste Klausur älter als 6 Wochen → Hinweis "Fach braucht frische Klausur"

Beide Kennzahlen werden nebeneinander angezeigt und NICHT miteinander verrechnet.

Dashboard-Priorisierung ("Schwachstellen Top 3") ersetzt die bisherige
Niedrigst-Prozent-Logik durch einen Score:

```
prio(thema) = (4 - stufe) * 2
            + (2 wenn basis_broeckelt)
            + (2 wenn Stufe-3-Beleg in <= 7 Tagen abläuft)
            + (1 wenn offene Pflicht-Wiederholung überfällig)
```

Höchster Score zuerst; Empfehlungstext benennt immer die Blockade zur nächsten
Stufe ("Stufe 3 blockiert: …"), nicht einen abstrakten Schwächewert.

---

## 9. Kalibrierung (Selbstüberprüfung des Modells)

Zwei Auswertungen, verfügbar sobald >= 10 Klausuren mit Teilen erfasst sind:

**A. Prädiktive Validität der Stufen**
Für jeden Klausurteil: Welche Stufe hatten die zugeordneten Themen am Tag vor
der Klausur (aus `stufen_verlauf`)? Ausgabe als Matrix Stufe × Ergebnis
(Quote >= / < BESTEHEN_QUOTE). Erwartung: Stufe-3-Themen bestehen mehrheitlich.
Brechen sie regelmäßig ein → Schwellen zu lax (Hinweis, `NIVEAU_SCHWELLE`- bzw.
Haltbarkeitsparameter zu verschärfen); liegen sie durchweg deutlich darüber →
zu streng.

**B. Selbstbewertungs-Bias**
Vergleich: durchschnittlicher `worst`-Wert der Übungsaufgaben eines Themas in
den 8 Wochen vor einer Klausur vs. erzielte Teilquote desselben Themas.
Systematische Abweichung nach oben = gemessene Kompetenzillusion; Anzeige als
Korrekturhinweis ("Deine Selbstbewertung liegt im Schnitt +0,8 über der
Klausurrealität").

---

## 10. UI-Konsequenzen (Kurzfassung für den Umbau)

- Themendetail: Stufen-Segmentbalken (0–4) statt Prozentzahl; Karte zeigt pro
  Säule den Gültigkeitsstatus (gültig / verfallen / keine Daten) und die
  Blockade zur nächsten Stufe.
- Kompetenzanalyse Ebene 1: gestapelte Stufenverteilungs-Balken pro Fach +
  separate Klausurreife-Card. Spiderweb optional mit Stufenachse 0–4.
- Wiederholungsplan: unverändert in der Struktur; Fälligkeiten kommen jetzt aus
  dem Algorithmus in Abschnitt 2/3. Zusätzlicher Filter "läuft bald ab"
  (Belege, deren Haltbarkeit in <= 7 Tagen endet).
- Probeklausur-Modal: optionaler Abschnitt "Teile erfassen" (wiederholbare
  Zeile: Bezeichnung, Themen, Max-Punkte, Punkte).
- Bestehende Prozent-/Gewichtungslogik und das Mapping 1/3/9/27/81 Tage
  vollständig entfernen.

---

## 11. Migrationshinweise

- Bestehende Items: `intervall` initial aus letzter Bewertung ableiten
  (1→1, 2→1, 3→2, 4→3, 5→4 Tage), `wdh_count` = 1, `wdh_datum` neu berechnen.
- Bestehende Klausuren ohne Teile: nur Fach-Evidenz, keine Themen-Stufe-4.
- `stufen_verlauf` beginnt mit dem Umstellungstag; historische Prozentwerte
  werden nicht rückkonvertiert.
