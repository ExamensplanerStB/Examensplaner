/**
 * Berechnungslogik für Probeklausuren.
 * Implementiert Berechnungsspezifikation_Kompetenzmodell.md, Abschnitt 1 + 6
 * (Nachschreiben-Fälligkeit, Bestehensquote).
 */

import { diffTage, heuteISO } from "./karteikarten-intervall";

export { diffTage, heuteISO };

export const PARAMETER = {
  NACHSCHREIBEN_TAGE: 75,
  BESTEHEN_QUOTE: 0.4,
  BESTEHEN_SICHER: 0.55,
  KLAUSUR_HALTBARKEIT: 180,
} as const;

/**
 * Nachschreiben ist fällig, wenn seit dem Klausurdatum mindestens
 * NACHSCHREIBEN_TAGE vergangen sind UND es noch nicht als erledigt markiert
 * wurde. Erledigt-Markieren ist jederzeit möglich (siehe Decision Log) —
 * diese Funktion prüft nur, ob der Hinweis angezeigt werden soll.
 */
export function nachschreibenFaellig(
  datumISO: string,
  erledigt: boolean,
  heute: string = heuteISO()
): boolean {
  if (erledigt) return false;
  return diffTage(datumISO, heute) >= PARAMETER.NACHSCHREIBEN_TAGE;
}

/** Bestanden, wenn die Quote (erreichte/max. Punkte) mindestens BESTEHEN_QUOTE erreicht. */
export function istBestanden(erreichtePunkte: number, maxPunkte: number): boolean {
  if (maxPunkte <= 0) return false;
  return erreichtePunkte / maxPunkte >= PARAMETER.BESTEHEN_QUOTE;
}

/**
 * Gültigkeits-Logik für einen einzelnen Klausurteil als Stufe-4-Beleg
 * (Abschnitt 4 der Berechnungsspezifikation, für PROJ-8/Kompetenzanalyse):
 * gültig, wenn die Quote mindestens BESTEHEN_SICHER erreicht UND die
 * KLAUSUR_HALTBARKEIT (180 Tage) seit dem Klausurdatum noch nicht
 * überschritten ist.
 */
export function istTeilGueltig(
  erreichtePunkte: number,
  maxPunkte: number,
  klausurDatumISO: string,
  heute: string = heuteISO()
): boolean {
  if (maxPunkte <= 0) return false;
  if (erreichtePunkte / maxPunkte < PARAMETER.BESTEHEN_SICHER) return false;
  return diffTage(klausurDatumISO, heute) <= PARAMETER.KLAUSUR_HALTBARKEIT;
}
