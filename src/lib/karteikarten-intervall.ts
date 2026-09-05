/**
 * Wiederholungsalgorithmus für Karteikarten (Theorie & Klausurtechnik).
 * Implementiert Berechnungsspezifikation_Kompetenzmodell.md, Abschnitt 2 + 4,
 * ohne die dort beschriebene Freistellungsphase-/Prüfungsdatum-Deckelung
 * (siehe PROJ-3 Out of Scope).
 */

export type Bewertung = 1 | 2 | 3 | 4 | 5;

export const PARAMETER = {
  NIVEAU_SCHWELLE: 4,
  START_INTERVALL: 1,
  GRADUIERUNG: { 4: 3, 5: 4 } as Record<4 | 5, number>,
  FAKTOR: { 3: 1.0, 4: 2.0, 5: 2.5 } as Record<3 | 4 | 5, number>,
  FUZZ: 0.15,
  KARENZ_FAKTOR: 0.25,
  KARENZ_MIN: 2,
  INTERVALL_MAX: 120,
} as const;

const MS_PRO_TAG = 24 * 60 * 60 * 1000;

function heuteOhneUhrzeit(datum: Date): Date {
  return new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
}

function parseISODatum(iso: string): Date {
  const [jahr, monat, tag] = iso.split("-").map(Number);
  return new Date(jahr, monat - 1, tag);
}

function toISODatum(datum: Date): string {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

export function diffTage(vonISO: string, bisISO: string): number {
  const von = parseISODatum(vonISO);
  const bis = parseISODatum(bisISO);
  return Math.round((bis.getTime() - von.getTime()) / MS_PRO_TAG);
}

export function heuteISO(referenz: Date = new Date()): string {
  return toISODatum(heuteOhneUhrzeit(referenz));
}

/**
 * Berechnet das nächste Wiederholungsintervall (in Tagen, mit
 * Nachkommastellen) nach Abschnitt 2.2 der Berechnungsspezifikation.
 *
 * `vorherigesIntervall` ist `null` bei der Erstbewertung einer neu
 * angelegten Karte (wdh_count === 0).
 *
 * `zufall` liefert einen Wert in [0, 1) für die Fuzz-Streuung — per Default
 * `Math.random`, aber injizierbar, damit das Ergebnis in Tests deterministisch
 * bleibt.
 */
export function berechneNaechstesIntervall(
  bewertung: Bewertung,
  vorherigesIntervall: number | null,
  zufall: () => number = Math.random
): number {
  let intervall: number;

  if (vorherigesIntervall === null) {
    if (bewertung >= 4) {
      intervall = PARAMETER.GRADUIERUNG[bewertung as 4 | 5];
    } else if (bewertung === 3) {
      intervall = 2;
    } else {
      intervall = PARAMETER.START_INTERVALL;
    }
  } else {
    if (bewertung <= 2) {
      intervall = PARAMETER.START_INTERVALL;
    } else {
      intervall = vorherigesIntervall * PARAMETER.FAKTOR[bewertung as 3 | 4 | 5];
    }
  }

  // Fuzz: ±FUZZ auf das errechnete Intervall, verhindert dass viele Karten
  // exakt am selben Tag fällig werden.
  const fuzzFaktor = 1 - PARAMETER.FUZZ + zufall() * 2 * PARAMETER.FUZZ;
  intervall *= fuzzFaktor;

  intervall = Math.min(intervall, PARAMETER.INTERVALL_MAX);
  intervall = Math.max(intervall, 1);

  return intervall;
}

/** Kaufmännische Rundung (0,5 Tage aufwärts) — siehe Technical Decisions. */
export function rundeIntervall(intervallTage: number): number {
  return Math.round(intervallTage);
}

/** Nächste Fälligkeit = heute + gerundetes Intervall. */
export function naechsteFaelligkeit(heuteISOStr: string, intervallTage: number): string {
  const heute = parseISODatum(heuteISOStr);
  const faellig = new Date(heute);
  faellig.setDate(faellig.getDate() + rundeIntervall(intervallTage));
  return toISODatum(faellig);
}

/**
 * Karenzzeit = 25 % des Intervalls, mindestens KARENZ_MIN Tage.
 */
export function karenz(intervallTage: number): number {
  return Math.max(PARAMETER.KARENZ_MIN, intervallTage * PARAMETER.KARENZ_FAKTOR);
}

/**
 * Gültigkeits-Logik nach Abschnitt 4 der Berechnungsspezifikation:
 * eine Karte ist gültig, wenn ihre letzte Bewertung mindestens NIVEAU_SCHWELLE
 * erreicht UND ihre Fälligkeit (inkl. Karenzzeit) noch nicht überschritten ist.
 */
export function istGueltig(
  bewertung: Bewertung,
  wdhDatumISO: string,
  intervallTage: number,
  heuteISOStr: string
): boolean {
  if (bewertung < PARAMETER.NIVEAU_SCHWELLE) return false;
  const karenzTage = karenz(intervallTage);
  return diffTage(wdhDatumISO, heuteISOStr) <= karenzTage;
}
