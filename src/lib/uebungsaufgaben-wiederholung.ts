/**
 * Wiederholungslogik für Übungsaufgaben.
 * Implementiert Berechnungsspezifikation_Kompetenzmodell.md, Abschnitt 3 + 4.
 */

import { diffTage, heuteISO, naechsteFaelligkeit } from "./karteikarten-intervall";

export type Bewertung = 1 | 2 | 3 | 4 | 5;

export const PARAMETER = {
  NIVEAU_SCHWELLE: 4,
  UEB_HALTBARKEIT: 56,
  UEB_WDH_BEI_3: 7,
  UEB_WDH_BEI_12: 5,
  UEB_WDH_FINAL: 21,
  UEB_WDH_MAX: 2,
} as const;

export { diffTage, heuteISO };

/** `worst = min(Fachlich, Klausurtechnik)` — steuert die gesamte Wiederholungslogik. */
export function worst(fachlich: Bewertung, klausurtechnik: Bewertung): Bewertung {
  return Math.min(fachlich, klausurtechnik) as Bewertung;
}

export interface NaechsteWiederholung {
  /** Neue Fälligkeit der Pflicht-Wiederholung, oder `null` wenn keine ansteht. */
  pflichtWdhDatum: string | null;
  /** `true`, wenn UEB_WDH_MAX ausgeschöpft ist, ohne `worst` >= NIVEAU_SCHWELLE zu erreichen. */
  geschlossen: boolean;
}

/**
 * Berechnet die nächste Pflicht-Wiederholung nach einer Bewertung (Abschnitt 3).
 * `wdhAnzahlVorher` ist die Anzahl bereits vorhandener Bewertungen dieser
 * Aufgabe VOR der aktuellen (0 bei der Erstbewertung, 1 nach der ersten
 * Pflicht-Wiederholung usw.).
 */
export function naechstePflichtWdh(
  worstWert: Bewertung,
  wdhAnzahlVorher: number,
  heuteISOStr: string = heuteISO()
): NaechsteWiederholung {
  if (worstWert >= PARAMETER.NIVEAU_SCHWELLE) {
    return { pflichtWdhDatum: null, geschlossen: false };
  }

  if (wdhAnzahlVorher === 0) {
    const tage = worstWert === 3 ? PARAMETER.UEB_WDH_BEI_3 : PARAMETER.UEB_WDH_BEI_12;
    return { pflichtWdhDatum: naechsteFaelligkeit(heuteISOStr, tage), geschlossen: false };
  }

  if (wdhAnzahlVorher < PARAMETER.UEB_WDH_MAX) {
    return {
      pflichtWdhDatum: naechsteFaelligkeit(heuteISOStr, PARAMETER.UEB_WDH_FINAL),
      geschlossen: false,
    };
  }

  return { pflichtWdhDatum: null, geschlossen: true };
}

/**
 * Gültigkeits-Logik nach Abschnitt 4: ein Beleg ist gültig, wenn `worst` die
 * NIVEAU_SCHWELLE erreicht UND die UEB_HALTBARKEIT (56 Tage) seit der
 * Bewertung noch nicht überschritten ist.
 */
export function istGueltig(
  worstWert: Bewertung,
  bewertungsDatumISO: string,
  heuteISOStr: string = heuteISO()
): boolean {
  if (worstWert < PARAMETER.NIVEAU_SCHWELLE) return false;
  return diffTage(bewertungsDatumISO, heuteISOStr) <= PARAMETER.UEB_HALTBARKEIT;
}
