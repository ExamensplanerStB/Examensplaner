/**
 * Kalibrierung (PROJ-8) — Selbstüberprüfung des Kompetenzmodells.
 * Implementiert Berechnungsspezifikation_Kompetenzmodell.md, Abschnitt 9:
 * (A) Prädiktive Validität der Stufen, (B) Selbstbewertungs-Bias.
 *
 * `stufen_verlauf` existiert als Tabelle erst ab /backend — bis dahin liefert
 * die Seite hier ein leeres `StufenSnapshot[]`, wodurch (A) stets die
 * "noch nicht genug Daten"-Ansicht zeigt (siehe Frontend Implementation
 * Notes). Die Berechnungsfunktionen selbst sind bereits vollständig und
 * getestet, unabhängig von der echten Datenanbindung.
 */

import { naechsteFaelligkeit } from "./karteikarten-intervall";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "./uebungsaufgaben";
import { worst } from "./uebungsaufgaben-wiederholung";
import { PARAMETER as KLAUSUR_PARAMETER } from "./klausuren-berechnung";
import type { Klausur, KlausurTeil } from "./klausuren";
import { PARAMETER as KOMPETENZ_PARAMETER, type Stufe } from "./kompetenzanalyse";

export interface StufenSnapshot {
  themaId: string;
  /** ISO-Datum (YYYY-MM-DD), Tag des Snapshots. */
  datum: string;
  stufe: Stufe;
  basisBroeckelt: boolean;
}

/** Anzahl Probeklausuren mit mindestens einem Teil — Datenschwelle für Kalibrierung. */
export function anzahlKlausurenMitTeilen(klausuren: Klausur[], teile: KlausurTeil[]): number {
  return klausuren.filter((k) => teile.some((t) => t.klausurId === k.id)).length;
}

export function kalibrierungBereit(klausuren: Klausur[], teile: KlausurTeil[]): boolean {
  return anzahlKlausurenMitTeilen(klausuren, teile) >= KOMPETENZ_PARAMETER.KALIBRIERUNG_MIN_KLAUSUREN;
}

export interface PraediktiveValiditaetZelle {
  stufe: Stufe;
  bestanden: number;
  nichtBestanden: number;
}

/**
 * Matrix Stufe × Ergebnis (Abschnitt 9A): für jeden korrigierten Klausurteil
 * und jedes zugeordnete Thema wird geprüft, welche Stufe das Thema laut
 * Snapshot am Vortag der Klausur hatte, und ob der Teil bestanden wurde
 * (Quote >= BESTEHEN_QUOTE). Teile ohne Snapshot vom Vortag (z.B. Klausur vor
 * Feature-Livegang geschrieben) werden übersprungen, nicht als Fehler
 * behandelt.
 */
export function praediktiveValiditaetVon(
  klausuren: Klausur[],
  teile: KlausurTeil[],
  snapshots: StufenSnapshot[]
): PraediktiveValiditaetZelle[] {
  const zellen: Record<Stufe, { bestanden: number; nichtBestanden: number }> = {
    0: { bestanden: 0, nichtBestanden: 0 },
    1: { bestanden: 0, nichtBestanden: 0 },
    2: { bestanden: 0, nichtBestanden: 0 },
    3: { bestanden: 0, nichtBestanden: 0 },
    4: { bestanden: 0, nichtBestanden: 0 },
  };

  for (const teil of teile) {
    if (teil.maxPunkte === null || teil.erreichtePunkte === null || teil.maxPunkte <= 0) continue;
    const klausur = klausuren.find((k) => k.id === teil.klausurId);
    if (!klausur) continue;

    const vortag = naechsteFaelligkeit(klausur.datum, -1);
    const bestanden = teil.erreichtePunkte / teil.maxPunkte >= KLAUSUR_PARAMETER.BESTEHEN_QUOTE;

    for (const themaId of teil.themenIds) {
      const snapshot = snapshots.find((s) => s.themaId === themaId && s.datum === vortag);
      if (!snapshot) continue;
      if (bestanden) zellen[snapshot.stufe].bestanden++;
      else zellen[snapshot.stufe].nichtBestanden++;
    }
  }

  return ([0, 1, 2, 3, 4] as Stufe[]).map((stufe) => ({ stufe, ...zellen[stufe] }));
}

export interface SelbstbewertungsBiasEintrag {
  themaId: string;
  klausurId: string;
  teilId: string;
  /** Ø `worst`-Wert (1–5) der Übungsaufgaben-Bewertungen in den 8 Wochen vor der Klausur. */
  avgWorst: number;
  /**
   * Teilquote auf dieselbe 1–5-Skala projiziert (Quote * 5), um sie mit
   * `avgWorst` vergleichbar zu machen — die Berechnungsspezifikation legt
   * keine exakte Skalierung fest, dies ist eine bewusste Implementierungs-
   * entscheidung (siehe Frontend Implementation Notes).
   */
  teilQuoteAlsSkala: number;
  /** `avgWorst - teilQuoteAlsSkala`; positiv = Selbstüberschätzung. */
  differenz: number;
}

/** Selbstbewertungs-Bias je (Klausurteil, Thema)-Paar (Abschnitt 9B). */
export function selbstbewertungsBiasVon(
  klausuren: Klausur[],
  teile: KlausurTeil[],
  aufgaben: Uebungsaufgabe[],
  reviews: UebungsaufgabeReview[]
): SelbstbewertungsBiasEintrag[] {
  const eintraege: SelbstbewertungsBiasEintrag[] = [];

  for (const teil of teile) {
    if (teil.maxPunkte === null || teil.erreichtePunkte === null || teil.maxPunkte <= 0) continue;
    const klausur = klausuren.find((k) => k.id === teil.klausurId);
    if (!klausur) continue;

    const fensterStart = naechsteFaelligkeit(klausur.datum, -56);

    for (const themaId of teil.themenIds) {
      const aufgabenIds = new Set(aufgaben.filter((a) => a.themenIds.includes(themaId)).map((a) => a.id));
      const relevanteReviews = reviews.filter(
        (r) => aufgabenIds.has(r.uebungsaufgabeId) && r.datum >= fensterStart && r.datum < klausur.datum
      );
      if (relevanteReviews.length === 0) continue;

      const avgWorst =
        relevanteReviews.reduce((summe, r) => summe + worst(r.fachlich, r.klausurtechnik), 0) /
        relevanteReviews.length;
      const teilQuoteAlsSkala = (teil.erreichtePunkte / teil.maxPunkte) * 5;

      eintraege.push({
        themaId,
        klausurId: klausur.id,
        teilId: teil.id,
        avgWorst,
        teilQuoteAlsSkala,
        differenz: avgWorst - teilQuoteAlsSkala,
      });
    }
  }

  return eintraege;
}

/** Durchschnittlicher Bias über alle Einträge; `null` ohne jede Datengrundlage. */
export function durchschnittsBiasVon(eintraege: SelbstbewertungsBiasEintrag[]): number | null {
  if (eintraege.length === 0) return null;
  return eintraege.reduce((summe, e) => summe + e.differenz, 0) / eintraege.length;
}
