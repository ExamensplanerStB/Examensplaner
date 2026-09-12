import { PARAMETER, heuteISO, istBestanden, istTeilGueltig, nachschreibenFaellig } from "./klausuren-berechnung";

export interface KlausurTeil {
  id: string;
  klausurId: string;
  fachId: string;
  themenIds: string[];
  /** null = noch nicht bekannt (vor Korrektur). */
  maxPunkte: number | null;
  erreichtePunkte: number | null;
}

export interface Klausur {
  id: string;
  bezeichnung: string;
  /** ISO-Datum (YYYY-MM-DD). */
  datum: string;
  quelle: string;
  note: string;
  stufe1Text: string;
  stufe2Text: string;
  nachschreibenErledigt: boolean;
  createdAt: string;
}

export type KlausurStatus = "korrektur_ausstehend" | "korrigiert";

export const STATUS_LABEL: Record<KlausurStatus, string> = {
  korrektur_ausstehend: "Korrektur ausstehend",
  korrigiert: "Korrigiert",
};

/** Ein Teil ist vollständig, wenn sowohl Max- als auch Erreichte-Punkte gesetzt sind. */
export function teilVollstaendig(teil: KlausurTeil): boolean {
  return teil.maxPunkte !== null && teil.erreichtePunkte !== null;
}

/**
 * Status ist "korrigiert", sobald ALLE Teile vollständige Punkte haben —
 * sonst "korrektur_ausstehend". Wird nie gespeichert, immer live berechnet
 * (siehe Tech Design).
 */
export function statusVon(teile: KlausurTeil[]): KlausurStatus {
  if (teile.length === 0) return "korrektur_ausstehend";
  return teile.every(teilVollstaendig) ? "korrigiert" : "korrektur_ausstehend";
}

export interface GesamtPunkte {
  max: number;
  erreicht: number;
}

/** Summe der Teile — nur wenn ALLE Teile vollständig sind, sonst `null`. */
export function gesamtPunkteVon(teile: KlausurTeil[]): GesamtPunkte | null {
  if (statusVon(teile) !== "korrigiert") return null;
  return teile.reduce(
    (summe, teil) => ({
      max: summe.max + (teil.maxPunkte ?? 0),
      erreicht: summe.erreicht + (teil.erreichtePunkte ?? 0),
    }),
    { max: 0, erreicht: 0 }
  );
}

/** Bestanden-Status — nur aussagekräftig, wenn die Klausur bereits korrigiert ist. */
export function bestandenVon(teile: KlausurTeil[]): boolean | null {
  const gesamt = gesamtPunkteVon(teile);
  if (!gesamt) return null;
  return istBestanden(gesamt.erreicht, gesamt.max);
}

/** Eindeutige Fach-IDs aller Teile, in der Reihenfolge ihres ersten Auftretens. */
export function faecherVon(teile: KlausurTeil[]): string[] {
  const gesehen = new Set<string>();
  const ergebnis: string[] = [];
  for (const teil of teile) {
    if (!gesehen.has(teil.fachId)) {
      gesehen.add(teil.fachId);
      ergebnis.push(teil.fachId);
    }
  }
  return ergebnis;
}

export function zeigeNachschreibenHinweis(
  klausur: Klausur,
  heute: string = heuteISO()
): boolean {
  return nachschreibenFaellig(klausur.datum, klausur.nachschreibenErledigt, heute);
}

/**
 * Gültigkeit eines einzelnen Teils als Stufe-4-Beleg (Abschnitt 4 der
 * Berechnungsspezifikation, für PROJ-8/Kompetenzanalyse) — ein unvollständiger
 * Teil (Korrektur ausstehend) ist nie gültig.
 */
export function istTeilGueltigVon(
  teil: KlausurTeil,
  klausurDatumISO: string,
  heute: string = heuteISO()
): boolean {
  if (teil.maxPunkte === null || teil.erreichtePunkte === null) return false;
  return istTeilGueltig(teil.erreichtePunkte, teil.maxPunkte, klausurDatumISO, heute);
}

export { PARAMETER };

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

/** Einheitliche Meldung für fehlgeschlagene Server-Kommunikation (analog PROJ-3/4). */
export const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";

/**
 * Kürzt Text für die Verwendung in aria-labels (analog PROJ-3/4): entfernt
 * spitze Klammern und begrenzt die Länge.
 */
export function kurzerText(text: string, maxLength = 60): string {
  const bereinigt = text.trim().replace(/[<>]/g, "");
  if (bereinigt.length <= maxLength) return bereinigt;
  return bereinigt.slice(0, maxLength).trimEnd() + "…";
}
