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
