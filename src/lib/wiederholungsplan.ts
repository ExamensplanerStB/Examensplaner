/**
 * Aggregationslogik für den Wiederholungsplan (PROJ-7) — führt fällige/
 * geplante Wiederholungen aus Karteikarten (PROJ-3), Übungsaufgaben (PROJ-4)
 * und Probeklausuren (PROJ-5) zu einer einheitlichen, nach Fälligkeit
 * sortierten Liste zusammen. Reine Aggregation über bereits bestehende
 * Domänenobjekte — keine eigene Tabelle, keine neue Datumslogik.
 */

import { diffTage, heuteISO, naechsteFaelligkeit } from "./karteikarten-intervall";
import type { Karteikarte } from "./karteikarten";
import { worst } from "./uebungsaufgaben-wiederholung";
import { letzteReviewVon, type Uebungsaufgabe, type UebungsaufgabeReview } from "./uebungsaufgaben";
import { PARAMETER as KLAUSUR_PARAMETER, faecherVon, type Klausur, type KlausurTeil } from "./klausuren";

export { diffTage, heuteISO };

export type WiederholungsArt = "karteikarte" | "uebungsaufgabe" | "klausur";
export type WiederholungsGruppe = "ueberfaellig" | "heute" | "diese_woche" | "spaeter";

export const GRUPPE_LABEL: Record<WiederholungsGruppe, string> = {
  ueberfaellig: "Überfällig",
  heute: "Heute fällig",
  diese_woche: "Diese Woche",
  spaeter: "Später",
};

interface WiederholungsEintragBasis {
  id: string;
  faelligkeitsdatum: string;
  gruppe: WiederholungsGruppe;
  fachIds: string[];
}

export interface KarteikarteEintrag extends WiederholungsEintragBasis {
  art: "karteikarte";
  karte: Karteikarte;
}

export interface UebungsaufgabeEintrag extends WiederholungsEintragBasis {
  art: "uebungsaufgabe";
  aufgabe: Uebungsaufgabe;
  nacharbeitEmpfohlen: boolean;
}

export interface KlausurEintrag extends WiederholungsEintragBasis {
  art: "klausur";
  klausur: Klausur;
}

export type WiederholungsEintrag = KarteikarteEintrag | UebungsaufgabeEintrag | KlausurEintrag;

/**
 * Dringlichkeits-Gruppe anhand des Abstands zwischen Fälligkeitsdatum und
 * heute — rollierendes 7-Tage-Fenster für "Diese Woche" (heute+1 bis
 * heute+7), keine Kalenderwoche (siehe Decision Log).
 */
export function gruppeVon(faelligkeitsdatumISO: string, heute: string = heuteISO()): WiederholungsGruppe {
  const differenz = diffTage(heute, faelligkeitsdatumISO);
  if (differenz < 0) return "ueberfaellig";
  if (differenz === 0) return "heute";
  if (differenz <= 7) return "diese_woche";
  return "spaeter";
}

export interface WiederholungsplanQuellen {
  karten: Karteikarte[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
  klausuren: Klausur[];
  teile: KlausurTeil[];
}

/**
 * Baut die vereinheitlichte, nach Fälligkeit aufsteigend sortierte Liste
 * aller Einträge. Enthält bewusst auch "spaeter"-Einträge (weit in der
 * Zukunft) — die Standardansicht blendet sie aus, "Alle anzeigen" zeigt sie
 * zusätzlich (Filterung erfolgt im WiederholungsplanManager).
 */
export function wiederholungsEintraegeVon(
  quellen: WiederholungsplanQuellen,
  heute: string = heuteISO()
): WiederholungsEintrag[] {
  const eintraege: WiederholungsEintrag[] = [];

  for (const karte of quellen.karten) {
    eintraege.push({
      id: karte.id,
      art: "karteikarte",
      karte,
      faelligkeitsdatum: karte.wdhDatum,
      gruppe: gruppeVon(karte.wdhDatum, heute),
      fachIds: [karte.fachId],
    });
  }

  for (const aufgabe of quellen.aufgaben) {
    if (aufgabe.pflichtWdhDatum === null) continue;
    const letzteReview = letzteReviewVon(aufgabe.id, quellen.reviews);
    const nacharbeitEmpfohlen =
      letzteReview !== null && worst(letzteReview.fachlich, letzteReview.klausurtechnik) <= 2;
    eintraege.push({
      id: aufgabe.id,
      art: "uebungsaufgabe",
      aufgabe,
      nacharbeitEmpfohlen,
      faelligkeitsdatum: aufgabe.pflichtWdhDatum,
      gruppe: gruppeVon(aufgabe.pflichtWdhDatum, heute),
      fachIds: [aufgabe.fachId],
    });
  }

  for (const klausur of quellen.klausuren) {
    if (klausur.nachschreibenErledigt) continue;
    const teileDerKlausur = quellen.teile.filter((t) => t.klausurId === klausur.id);
    // Vorausschauend berechnet (nicht erst ab Fälligkeit wie im Probeklausuren-
    // Hub selbst) — siehe PROJ-7 Decision Log.
    const faelligkeitsdatum = naechsteFaelligkeit(klausur.datum, KLAUSUR_PARAMETER.NACHSCHREIBEN_TAGE);
    eintraege.push({
      id: klausur.id,
      art: "klausur",
      klausur,
      faelligkeitsdatum,
      gruppe: gruppeVon(faelligkeitsdatum, heute),
      fachIds: faecherVon(teileDerKlausur),
    });
  }

  return eintraege.sort((a, b) =>
    a.faelligkeitsdatum < b.faelligkeitsdatum ? -1 : a.faelligkeitsdatum > b.faelligkeitsdatum ? 1 : 0
  );
}

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

/** Einheitliche Meldung für fehlgeschlagene Server-Kommunikation (analog PROJ-3–5). */
export const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";
