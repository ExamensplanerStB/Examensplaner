/**
 * Berechnungslogik für die Kompetenzanalyse (PROJ-8).
 * Implementiert Berechnungsspezifikation_Kompetenzmodell.md, Abschnitt 5 + 8
 * (Stufenlogik pro Thema, Subsumtionsregel, Fach-Ebene-Kennzahlen, Priowert,
 * Fehlermuster-Erkennung). Ruft ausschließlich die bereits bestehenden,
 * getesteten Gültigkeitsfunktionen der drei Hubs auf (siehe Tech Design) —
 * keine eigene Gültigkeitslogik pro Beleg.
 */

import { diffTage, heuteISO, istGueltig as kkIstGueltig } from "./karteikarten-intervall";
import type { Karteikarte } from "./karteikarten";
import { PARAMETER as UEB_PARAMETER, worst } from "./uebungsaufgaben-wiederholung";
import { letzteReviewVon, type Uebungsaufgabe, type UebungsaufgabeReview } from "./uebungsaufgaben";
import { PARAMETER as KLAUSUR_PARAMETER } from "./klausuren-berechnung";
import { istTeilGueltigVon, type Klausur, type KlausurTeil } from "./klausuren";
import type { Fach, Thema } from "./klausurtage";

export { diffTage, heuteISO };

export type Stufe = 0 | 1 | 2 | 3 | 4;

export const STUFE_LABEL: Record<Stufe, string> = {
  0: "Keine Basis",
  1: "Theorie bekannt",
  2: "Schema abrufbar",
  3: "Anwendung gelingt",
  4: "Klausurfest",
};

export const PARAMETER = {
  ABLAUF_WARN: 7,
  KALIBRIERUNG_MIN_KLAUSUREN: 10,
  FRISCHE_KLAUSUR_TAGE: 42,
} as const;

export type AmpelFarbe = "green" | "amber" | "red" | "grey";

/** Stufe -> Ampel-Farbe (0/1 rot, 2/3 gelb, 4 grün); ohne Daten immer grau. */
export function ampelVonStufe(stufe: Stufe, hasData: boolean): AmpelFarbe {
  if (!hasData) return "grey";
  return (["red", "red", "amber", "amber", "green"] as const)[stufe];
}

export interface KompetenzanalyseQuellen {
  themen: Thema[];
  karten: Karteikarte[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
  klausuren: Klausur[];
  teile: KlausurTeil[];
}

export interface JuengsteUebung {
  aufgabe: Uebungsaufgabe;
  review: UebungsaufgabeReview;
}

export interface JuengsterTeil {
  teil: KlausurTeil;
  klausurDatum: string;
}

export interface ThemaStufe {
  thema: Thema;
  stufe: Stufe;
  hasData: boolean;
  basisBroeckelt: boolean;
  kkTheorie: Karteikarte[];
  kkKlausurtechnik: Karteikarte[];
  juengsteUebung: JuengsteUebung | null;
  offenePflichtWdh: boolean;
  offenePflichtUeberfaellig: boolean;
  juengsterTeil: JuengsterTeil | null;
}

function kkGueltig(karte: Karteikarte, heute: string): boolean {
  return kkIstGueltig(karte.bewertung, karte.wdhDatum, karte.intervall, heute);
}

function findeJuengsteUebung(
  aufgabenDesThemas: Uebungsaufgabe[],
  reviews: UebungsaufgabeReview[]
): JuengsteUebung | null {
  let ergebnis: JuengsteUebung | null = null;
  for (const aufgabe of aufgabenDesThemas) {
    const review = letzteReviewVon(aufgabe.id, reviews);
    if (!review) continue;
    if (!ergebnis || review.datum >= ergebnis.review.datum) {
      ergebnis = { aufgabe, review };
    }
  }
  return ergebnis;
}

function findeJuengstenTeil(teileDesThemas: KlausurTeil[], klausuren: Klausur[]): JuengsterTeil | null {
  let ergebnis: JuengsterTeil | null = null;
  for (const teil of teileDesThemas) {
    const klausur = klausuren.find((k) => k.id === teil.klausurId);
    if (!klausur) continue;
    if (!ergebnis || klausur.datum >= ergebnis.klausurDatum) {
      ergebnis = { teil, klausurDatum: klausur.datum };
    }
  }
  return ergebnis;
}

/**
 * Stufe eines Themas nach Abschnitt 5 der Berechnungsspezifikation: direkte
 * Kriterien (5.1) + Subsumtionsregel (5.3). Wird bei jedem Aufruf live
 * berechnet, nie gespeichert (5.4) — außer dem täglichen Snapshot für
 * Kalibrierung/Trend (siehe `kalibrierung.ts`).
 */
export function themaStufeVon(
  thema: Thema,
  quellen: KompetenzanalyseQuellen,
  heute: string = heuteISO()
): ThemaStufe {
  const kkTheorie = quellen.karten.filter((k) => k.typ === "theorie" && k.themenIds.includes(thema.id));
  const kkKlausurtechnik = quellen.karten.filter(
    (k) => k.typ === "klausurtechnik" && k.themenIds.includes(thema.id)
  );
  const aufgabenDesThemas = quellen.aufgaben.filter((a) => a.themenIds.includes(thema.id));
  const teileDesThemas = quellen.teile.filter((t) => t.themenIds.includes(thema.id));

  const juengsteUebung = findeJuengsteUebung(aufgabenDesThemas, quellen.reviews);
  const juengsterTeil = findeJuengstenTeil(teileDesThemas, quellen.klausuren);
  const offenePflichtWdh = aufgabenDesThemas.some((a) => a.pflichtWdhDatum !== null);
  const offenePflichtUeberfaellig = aufgabenDesThemas.some(
    (a) => a.pflichtWdhDatum !== null && diffTage(a.pflichtWdhDatum, heute) > 0
  );

  const c1 = kkTheorie.length > 0 && kkTheorie.every((k) => kkGueltig(k, heute));
  const c2 = kkKlausurtechnik.length > 0 && kkKlausurtechnik.every((k) => kkGueltig(k, heute));

  const uebFrisch = juengsteUebung
    ? diffTage(juengsteUebung.review.datum, heute) <= UEB_PARAMETER.UEB_HALTBARKEIT
    : false;
  const c3 =
    !!juengsteUebung &&
    worst(juengsteUebung.review.fachlich, juengsteUebung.review.klausurtechnik) >= UEB_PARAMETER.NIVEAU_SCHWELLE &&
    uebFrisch &&
    !offenePflichtWdh;

  const c4 = !!juengsterTeil && istTeilGueltigVon(juengsterTeil.teil, juengsterTeil.klausurDatum, heute);

  const sub1 = !!juengsteUebung && juengsteUebung.review.fachlich >= UEB_PARAMETER.NIVEAU_SCHWELLE && uebFrisch;
  const sub2 =
    !!juengsteUebung && juengsteUebung.review.klausurtechnik >= UEB_PARAMETER.NIVEAU_SCHWELLE && uebFrisch;

  const cov1 = c1 || sub1 || c4;
  const cov2 = c2 || sub2 || c4;
  const cov3 = c3 || c4;
  const cov4 = c4;

  const stufe: Stufe = cov4 ? 4 : cov3 ? 3 : cov2 ? 2 : cov1 ? 1 : 0;

  const b1 = c1 || sub1;
  const b2 = c2 || sub2;
  const b3 = c3;
  const basisBroeckelt = (stufe >= 1 && !b1) || (stufe >= 2 && !b2) || (stufe >= 3 && !b3);

  const nData = kkTheorie.length + kkKlausurtechnik.length + aufgabenDesThemas.length + teileDesThemas.length;

  return {
    thema,
    stufe,
    hasData: nData > 0,
    basisBroeckelt,
    kkTheorie,
    kkKlausurtechnik,
    juengsteUebung,
    offenePflichtWdh,
    offenePflichtUeberfaellig,
    juengsterTeil,
  };
}

export function themenStufenVon(
  themen: Thema[],
  quellen: KompetenzanalyseQuellen,
  heute: string = heuteISO()
): ThemaStufe[] {
  return themen.map((thema) => themaStufeVon(thema, quellen, heute));
}

export interface Blockade {
  naechsteStufe: Exclude<Stufe, 0>;
  text: string;
}

/** Blockade-Hinweis nach Abschnitt 5.1: was zur nächsten Stufe fehlt. */
export function blockadeVon(ts: ThemaStufe): Blockade | null {
  if (ts.stufe >= 4) return null;
  const naechsteStufe = (ts.stufe + 1) as Exclude<Stufe, 0>;
  const texte: Record<Exclude<Stufe, 0>, string> = {
    1: "eine gültige Theorie-Karte fehlt oder ist verfallen.",
    2: "eine gültige Klausurtechnik-Karte fehlt oder ist verfallen.",
    3: ts.offenePflichtWdh
      ? "offene Pflicht-Wiederholung einer Übungsaufgabe abarbeiten."
      : ts.juengsteUebung
        ? "jüngste Übung erreicht Worst < 4 oder ist älter als 56 Tage — frische Anwendung nötig."
        : "noch keine Übungsaufgabe zu diesem Thema.",
    4: ts.juengsterTeil
      ? "jüngster Klausurteil unter 55 % oder älter als 6 Monate — neuen Klausurteil schreiben."
      : "noch kein Klausurteil zu diesem Thema erfasst.",
  };
  return { naechsteStufe, text: texte[naechsteStufe] };
}

/** Kompakte Blockade-Zeile für Listenansichten (Ebene 1 "Größte Blockaden"). */
export function blockadeKurztext(ts: ThemaStufe): string {
  const blockade = blockadeVon(ts);
  if (!blockade) return "Klausurfest — warm halten.";
  return `Stufe ${blockade.naechsteStufe} blockiert: ${blockade.text}`;
}

/**
 * Priowert nach Abschnitt 8 — höher = dringender. Folgt dem Wortlaut der
 * Berechnungsspezifikation ("Stufe-3-Beleg"): das ist der Übungsaufgaben-
 * Beleg, dessen 56-Tage-Haltbarkeit bald abläuft. Der Prototyp-Code prüfte an
 * dieser Stelle stattdessen den Klausurteil (Stufe-4-Beleg) — abweichend vom
 * geschriebenen Spezifikationstext. Da die Berechnungsspezifikation laut
 * Decision Log durchgängig als maßgeblich gilt, folgt diese Implementierung
 * dem Text, nicht dem Prototyp-Code (siehe Frontend Implementation Notes).
 */
export function priowertVon(ts: ThemaStufe, heute: string = heuteISO()): number {
  let prio = (4 - ts.stufe) * 2;
  if (ts.basisBroeckelt) prio += 2;

  const stufe3BelegLaeuftBald =
    !!ts.juengsteUebung &&
    worst(ts.juengsteUebung.review.fachlich, ts.juengsteUebung.review.klausurtechnik) >= UEB_PARAMETER.NIVEAU_SCHWELLE &&
    UEB_PARAMETER.UEB_HALTBARKEIT - diffTage(ts.juengsteUebung.review.datum, heute) <= PARAMETER.ABLAUF_WARN;
  if (stufe3BelegLaeuftBald) prio += 2;

  if (ts.offenePflichtUeberfaellig) prio += 1;

  return prio;
}

export function sortierteThemenNachPrio(themenStufen: ThemaStufe[], heute: string = heuteISO()): ThemaStufe[] {
  return [...themenStufen].sort((a, b) => {
    const diff = priowertVon(b, heute) - priowertVon(a, heute);
    if (diff !== 0) return diff;
    return a.stufe - b.stufe;
  });
}

export function groesseBlockaden(alleThemenStufen: ThemaStufe[], limit = 6, heute: string = heuteISO()): ThemaStufe[] {
  return sortierteThemenNachPrio(alleThemenStufen, heute).slice(0, limit);
}

export interface FachVerteilung {
  fach: Fach;
  segmente: { stufe: Stufe; anzahl: number }[];
  gesamt: number;
  /** `null`, wenn kein Thema des Fachs Daten hat. */
  durchschnitt: number | null;
}

export function fachVerteilungVon(fach: Fach, themenStufen: ThemaStufe[]): FachVerteilung {
  const zaehler: Record<Stufe, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  themenStufen.forEach((ts) => {
    zaehler[ts.stufe]++;
  });
  const mitDaten = themenStufen.filter((ts) => ts.hasData);
  const durchschnitt =
    mitDaten.length > 0 ? mitDaten.reduce((summe, ts) => summe + ts.stufe, 0) / mitDaten.length : null;
  return {
    fach,
    segmente: ([0, 1, 2, 3, 4] as Stufe[]).map((stufe) => ({ stufe, anzahl: zaehler[stufe] })),
    gesamt: themenStufen.length,
    durchschnitt,
  };
}

export interface KlausurreifeEintrag {
  fach: Fach;
  /** Anzahl geschriebener Klausuren mit mind. einem Teil dieses Fachs (auch unkorrigierte). */
  anzahl: number;
  /** Anteil bestandener unter den bereits korrigierten Klausuren dieses Fachs (0..1). */
  anteilBestanden: number;
  /** Differenz Ø-Quote der letzten 3 ggü. den 3 davor; `null` bei < 6 korrigierten Klausuren. */
  trend: number | null;
  juengsteAlterTage: number;
  brauchtFrischeKlausur: boolean;
}

interface FachKlausurQuote {
  klausur: Klausur;
  quote: number;
}

/** Fach-skalierte Quote je Klausur: nur die Teile DIESES Fachs innerhalb der Klausur zählen. */
function fachQuotenVon(fach: Fach, klausuren: Klausur[], teile: KlausurTeil[]): FachKlausurQuote[] {
  const ergebnisse: FachKlausurQuote[] = [];
  for (const klausur of klausuren) {
    const teileDesFachs = teile.filter((t) => t.klausurId === klausur.id && t.fachId === fach.id);
    if (teileDesFachs.length === 0) continue;
    const vollstaendig = teileDesFachs.every((t) => t.maxPunkte !== null && t.erreichtePunkte !== null);
    if (!vollstaendig) continue;
    const max = teileDesFachs.reduce((summe, t) => summe + (t.maxPunkte ?? 0), 0);
    const erreicht = teileDesFachs.reduce((summe, t) => summe + (t.erreichtePunkte ?? 0), 0);
    if (max <= 0) continue;
    ergebnisse.push({ klausur, quote: erreicht / max });
  }
  return ergebnisse.sort((a, b) =>
    a.klausur.datum < b.klausur.datum ? -1 : a.klausur.datum > b.klausur.datum ? 1 : 0
  );
}

/** `null`, wenn das Fach noch keine einzige Probeklausur hat (erscheint dann nicht in der Liste). */
export function klausurreifeVon(
  fach: Fach,
  klausuren: Klausur[],
  teile: KlausurTeil[],
  heute: string = heuteISO()
): KlausurreifeEintrag | null {
  const klausurenDesFachs = klausuren.filter((k) => teile.some((t) => t.klausurId === k.id && t.fachId === fach.id));
  if (klausurenDesFachs.length === 0) return null;

  const quoten = fachQuotenVon(fach, klausuren, teile);
  const bestandene = quoten.filter((q) => q.quote >= KLAUSUR_PARAMETER.BESTEHEN_QUOTE).length;
  const anteilBestanden = quoten.length > 0 ? bestandene / quoten.length : 0;

  let trend: number | null = null;
  if (quoten.length >= 6) {
    const avg = (arr: number[]) => arr.reduce((summe, v) => summe + v, 0) / arr.length;
    const letzte3 = quoten.slice(-3).map((q) => q.quote);
    const davor3 = quoten.slice(-6, -3).map((q) => q.quote);
    trend = avg(letzte3) - avg(davor3);
  }

  const juengste = [...klausurenDesFachs].sort((a, b) =>
    a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0
  )[0];
  const juengsteAlterTage = diffTage(juengste.datum, heute);

  return {
    fach,
    anzahl: klausurenDesFachs.length,
    anteilBestanden,
    trend,
    juengsteAlterTage,
    brauchtFrischeKlausur: juengsteAlterTage > PARAMETER.FRISCHE_KLAUSUR_TAGE,
  };
}

export type SaeulenStatus = "gueltig" | "verfallen" | "keine_daten";

export interface SaeuleInfo {
  key: "theorie" | "klausurtechnik" | "uebung" | "probeklausur";
  label: string;
  stufeRef: string;
  status: SaeulenStatus;
  detail: string;
}

/** Vier-Säulen-Gültigkeitsstatus für die Themendetail-Ansicht (Ebene 3). */
export function saeulenVon(ts: ThemaStufe, heute: string = heuteISO()): SaeuleInfo[] {
  const thV = ts.kkTheorie.filter((k) => kkGueltig(k, heute)).length;
  const thN = ts.kkTheorie.length;
  const ktV = ts.kkKlausurtechnik.filter((k) => kkGueltig(k, heute)).length;
  const ktN = ts.kkKlausurtechnik.length;

  const uebWorst = ts.juengsteUebung
    ? worst(ts.juengsteUebung.review.fachlich, ts.juengsteUebung.review.klausurtechnik)
    : null;
  const uebAlter = ts.juengsteUebung ? diffTage(ts.juengsteUebung.review.datum, heute) : null;
  const uebungStatus: SaeulenStatus = !ts.juengsteUebung
    ? "keine_daten"
    : uebWorst! >= UEB_PARAMETER.NIVEAU_SCHWELLE && uebAlter! <= UEB_PARAMETER.UEB_HALTBARKEIT && !ts.offenePflichtWdh
      ? "gueltig"
      : "verfallen";

  const teilGueltig =
    !!ts.juengsterTeil && istTeilGueltigVon(ts.juengsterTeil.teil, ts.juengsterTeil.klausurDatum, heute);
  const teilAlter = ts.juengsterTeil ? diffTage(ts.juengsterTeil.klausurDatum, heute) : null;
  const teilQuote =
    ts.juengsterTeil && ts.juengsterTeil.teil.maxPunkte
      ? (ts.juengsterTeil.teil.erreichtePunkte ?? 0) / ts.juengsterTeil.teil.maxPunkte
      : null;

  return [
    {
      key: "theorie",
      label: "Theorie",
      stufeRef: "Stufe 1",
      status: thN === 0 ? "keine_daten" : thV === thN ? "gueltig" : "verfallen",
      detail:
        thN === 0
          ? "keine Theorie-Karte"
          : `${thV}/${thN} Karten gültig${thN > thV ? ` · ${thN - thV} verfallen` : ""}`,
    },
    {
      key: "klausurtechnik",
      label: "Klausurtechnik",
      stufeRef: "Stufe 2",
      status: ktN === 0 ? "keine_daten" : ktV === ktN ? "gueltig" : "verfallen",
      detail:
        ktN === 0
          ? "keine Klausurtechnik-Karte"
          : `${ktV}/${ktN} Karten gültig${ktN > ktV ? ` · ${ktN - ktV} verfallen` : ""}`,
    },
    {
      key: "uebung",
      label: "Übungsaufgaben",
      stufeRef: "Stufe 3",
      status: uebungStatus,
      detail: !ts.juengsteUebung
        ? "keine Übungsaufgabe"
        : `jüngste: Worst ${uebWorst} · vor ${uebAlter} Tagen${
            ts.offenePflichtWdh
              ? " · Pflicht-Wdh offen"
              : uebAlter! > UEB_PARAMETER.UEB_HALTBARKEIT
                ? " · Haltbarkeit abgelaufen"
                : ""
          }`,
    },
    {
      key: "probeklausur",
      label: "Probeklausur (Teil)",
      stufeRef: "Stufe 4",
      status: !ts.juengsterTeil ? "keine_daten" : teilGueltig ? "gueltig" : "verfallen",
      detail: !ts.juengsterTeil
        ? "kein Klausurteil erfasst"
        : `${Math.round((teilQuote ?? 0) * 100)} % · vor ${teilAlter} Tagen`,
    },
  ];
}

export type FehlernotizHub = "theorie" | "klausurtechnik" | "uebung" | "probeklausur";

export interface Fehlernotiz {
  hub: FehlernotizHub;
  hubLabel: string;
  text: string;
  /** ISO-Datum (YYYY-MM-DD). */
  datum: string;
}

/**
 * Chronologische Fehlernotizen eines Themas aus allen drei Hubs. Ein
 * Klausur-weiter Stufe-1-/Stufe-2-Text wird jedem Thema aller Teile dieser
 * Klausur zugeordnet (siehe PROJ-8 Decision Log).
 */
export function fehlernotizenVon(thema: Thema, quellen: KompetenzanalyseQuellen): Fehlernotiz[] {
  const notizen: Fehlernotiz[] = [];

  quellen.karten
    .filter((k) => k.themenIds.includes(thema.id) && k.fehlernotiz.trim().length > 0)
    .forEach((k) => {
      notizen.push({
        hub: k.typ,
        hubLabel: k.typ === "theorie" ? "Theorie" : "Klausurtechnik",
        text: k.fehlernotiz,
        datum: k.createdAt.slice(0, 10),
      });
    });

  const aufgabenIdsDesThemas = new Set(
    quellen.aufgaben.filter((a) => a.themenIds.includes(thema.id)).map((a) => a.id)
  );
  quellen.reviews
    .filter((r) => aufgabenIdsDesThemas.has(r.uebungsaufgabeId) && r.fehlernotiz.trim().length > 0)
    .forEach((r) => {
      notizen.push({ hub: "uebung", hubLabel: "Übungsaufgabe", text: r.fehlernotiz, datum: r.datum });
    });

  const klausurIdsDesThemas = new Set(
    quellen.teile.filter((t) => t.themenIds.includes(thema.id)).map((t) => t.klausurId)
  );
  quellen.klausuren
    .filter((k) => klausurIdsDesThemas.has(k.id))
    .forEach((k) => {
      if (k.stufe1Text.trim().length > 0) {
        notizen.push({ hub: "probeklausur", hubLabel: `${k.bezeichnung} · Stufe 1`, text: k.stufe1Text, datum: k.datum });
      }
      if (k.stufe2Text.trim().length > 0) {
        notizen.push({ hub: "probeklausur", hubLabel: `${k.bezeichnung} · Stufe 2`, text: k.stufe2Text, datum: k.datum });
      }
    });

  return notizen.sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0));
}

const FEHLERMUSTER_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /vergess/, label: "wiederkehrendes Vergessen einzelner Tatbestandsmerkmale" },
  { pattern: /unklar/, label: "unklare Rechtsfolgen" },
  { pattern: /verwechsel/, label: "Verwechslung ähnlicher Normen/Begriffe" },
  { pattern: /schema|schritt/, label: "Lücken im Prüfschema" },
];

/** Deterministisches Keyword-Matching (kein KI/NLP, siehe PRD Non-Goals). */
export function fehlermusterVon(notizen: Fehlernotiz[]): string[] {
  const text = notizen.map((n) => n.text.toLowerCase()).join(" ");
  return FEHLERMUSTER_KEYWORDS.filter((k) => k.pattern.test(text)).map((k) => k.label);
}

/** Bis zu 3 Handlungsempfehlungen: Blockade, Basis-bröckelt, offene Pflicht-Wdh, Fehlermuster, Standardtext. */
export function empfehlungenVon(ts: ThemaStufe, notizen: Fehlernotiz[]): string[] {
  const empfehlungen: string[] = [];
  const blockade = blockadeVon(ts);
  if (blockade) {
    empfehlungen.push(`Stufe ${blockade.naechsteStufe} blockiert: ${blockade.text}`);
  }
  if (ts.basisBroeckelt) {
    empfehlungen.push(
      "Basis bröckelt — eine niedrigere Stufe ist nicht mehr gedeckt (verfallene Karte oder fehlende Anwendung). Frische die betroffene Säule auf, sonst trägt die aktuelle Stufe nicht."
    );
  }
  if (ts.offenePflichtWdh) {
    empfehlungen.push(
      "Offene Pflicht-Wiederholung einer Übungsaufgabe zuerst abarbeiten — sie blockiert die Anwendungsstufe."
    );
  }
  const muster = fehlermusterVon(notizen);
  if (muster.length > 0) {
    empfehlungen.push(
      `Muster in deinen Fehlernotizen: ${muster.join(", ")}. Lege dazu eine Klausurtechnik-Karte mit dem sauberen Schema an.`
    );
  }
  if (ts.stufe >= 4 && !ts.basisBroeckelt) {
    empfehlungen.push(
      "Thema ist klausurfest. Halte es mit den fälligen Wiederholungen warm, damit die Haltbarkeit nicht abläuft."
    );
  }
  if (empfehlungen.length === 0) {
    empfehlungen.push("Solide Basis. Halte das Thema mit den fälligen Wiederholungen warm.");
  }
  return empfehlungen.slice(0, 3);
}

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

/** Einheitliche Meldung für fehlgeschlagene Server-Kommunikation (analog PROJ-3–5/7). */
export const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";
