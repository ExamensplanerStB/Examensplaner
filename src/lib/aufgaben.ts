import { diffTage, heuteISO } from "./karteikarten-intervall";

export { heuteISO };

export type KategorieFest = "vorlesung" | "lernen" | "wiederholung" | "frist";
export type Prioritaet = "hoch" | "mittel" | "niedrig" | "keine";
export type Zeittyp = "ganztag" | "zeitslot";
export type StatusFilter = "offen" | "erledigt" | "alle";
export type SortModus = "zeit" | "prioritaet" | "kategorie";

/** Eigene, vom Nutzer angelegte Kategorie (Ergänzung zu den 4 festen Kategorien). */
export interface EigeneKategorie {
  id: string;
  name: string;
  /** Hex-Farbe aus KATEGORIE_PALETTE. */
  farbe: string;
}

export interface Aufgabe {
  id: string;
  titel: string;
  /** ISO-Datum (YYYY-MM-DD) oder null. */
  datum: string | null;
  /** Nur gesetzt, wenn datum gesetzt ist — sonst null. */
  zeittyp: Zeittyp | null;
  /** Nur gesetzt, wenn zeittyp "zeitslot" ist — sonst null. */
  startZeit: string | null;
  endZeit: string | null;
  /** Höchstens eines von kategorieFest/eigeneKategorieId ist gesetzt, nie beide. */
  kategorieFest: KategorieFest | null;
  eigeneKategorieId: string | null;
  prioritaet: Prioritaet;
  erledigt: boolean;
  /** Datenfeld für die spätere Kalenderdarstellung in PROJ-9, siehe Tech Design. */
  imKalender: boolean;
  createdAt: string;
}

export const KATEGORIE_FEST_OPTIONEN: { value: KategorieFest; label: string }[] = [
  { value: "vorlesung", label: "Vorlesung / Seminar" },
  { value: "lernen", label: "Lernsession" },
  { value: "wiederholung", label: "Wiederholung" },
  { value: "frist", label: "Frist / Prüfung" },
];

export const KATEGORIE_FEST_LABEL: Record<KategorieFest, string> = {
  vorlesung: "Vorlesung / Seminar",
  lernen: "Lernsession",
  wiederholung: "Wiederholung",
  frist: "Frist / Prüfung",
};

/** Farben identisch zu den Kalender-Kategorien-Tokens im Design-System. */
export const KATEGORIE_FEST_FARBE: Record<KategorieFest, string> = {
  vorlesung: "var(--cal-vorlesung)",
  lernen: "var(--cal-lernen)",
  wiederholung: "var(--cal-wiederholung)",
  frist: "var(--cal-frist)",
};

/** Feste Farbpalette für eigene Kategorien (kein freier Farbwähler, siehe Tech Design). */
export const KATEGORIE_PALETTE: { name: string; farbe: string }[] = [
  { name: "Blau", farbe: "#2A6FDB" },
  { name: "Grün", farbe: "#1F8A5B" },
  { name: "Orange", farbe: "#C77D2A" },
  { name: "Karminrot", farbe: "#B5384E" },
  { name: "Violett", farbe: "#7A4FCF" },
  { name: "Türkis", farbe: "#0E8C9E" },
  { name: "Rot", farbe: "#C0392B" },
  { name: "Grau", farbe: "#5E6470" },
];

export const PRIORITAET_OPTIONEN: { value: Prioritaet; label: string }[] = [
  { value: "hoch", label: "Hoch" },
  { value: "mittel", label: "Mittel" },
  { value: "niedrig", label: "Niedrig" },
  { value: "keine", label: "Keine" },
];

export const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
  keine: "Keine",
};

/** Farben identisch zum bestehenden Ampelsystem. */
export const PRIORITAET_FARBE: Record<Prioritaet, string> = {
  hoch: "var(--ampel-red)",
  mittel: "var(--ampel-amber)",
  niedrig: "var(--ampel-green)",
  keine: "var(--ampel-grey)",
};

export const PRIORITAET_TINT: Record<Prioritaet, string> = {
  hoch: "var(--ampel-red-tint)",
  mittel: "var(--ampel-amber-tint)",
  niedrig: "var(--ampel-green-tint)",
  keine: "var(--ampel-grey-tint)",
};

export const PRIORITAET_RANG: Record<Prioritaet, number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
  keine: 3,
};

/** Eine Aufgabe ist überfällig, wenn sie ein Datum in der Vergangenheit hat und noch offen ist. */
export function istUeberfaellig(
  aufgabe: Pick<Aufgabe, "datum" | "erledigt">,
  heute: string = heuteISO()
): boolean {
  if (!aufgabe.datum || aufgabe.erledigt) return false;
  return diffTage(heute, aufgabe.datum) < 0;
}

/** Relative Gruppen-Label wie im Prototyp ("Heute"/"Morgen"/"Gestern"/Datum). */
export function datumsGruppenLabel(datumISO: string, heute: string = heuteISO()): string {
  const differenz = diffTage(heute, datumISO);
  if (differenz === 0) return "Heute";
  if (differenz === 1) return "Morgen";
  if (differenz === -1) return "Gestern";
  return formatDatum(datumISO);
}

export function zeitAnzeige(aufgabe: Pick<Aufgabe, "zeittyp" | "startZeit" | "endZeit">): string {
  if (aufgabe.zeittyp === "ganztag") return "Ganztägig";
  if (aufgabe.zeittyp === "zeitslot" && aufgabe.startZeit && aufgabe.endZeit) {
    return `${aufgabe.startZeit}–${aufgabe.endZeit} Uhr`;
  }
  return "";
}

export interface KategorieAnzeige {
  label: string;
  farbe: string;
}

export function kategorieVon(
  aufgabe: Pick<Aufgabe, "kategorieFest" | "eigeneKategorieId">,
  eigeneKategorien: EigeneKategorie[]
): KategorieAnzeige | null {
  if (aufgabe.kategorieFest) {
    return { label: KATEGORIE_FEST_LABEL[aufgabe.kategorieFest], farbe: KATEGORIE_FEST_FARBE[aufgabe.kategorieFest] };
  }
  if (aufgabe.eigeneKategorieId) {
    const eigene = eigeneKategorien.find((k) => k.id === aufgabe.eigeneKategorieId);
    if (eigene) return { label: eigene.name, farbe: eigene.farbe };
  }
  return null;
}

/** Minuten seit Mitternacht für die Zeit-Sortierung — Aufgaben ohne Zeitslot landen zuletzt. */
function startMinuten(aufgabe: Pick<Aufgabe, "zeittyp" | "startZeit">): number {
  if (aufgabe.zeittyp === "zeitslot" && aufgabe.startZeit) {
    const [stunden, minuten] = aufgabe.startZeit.split(":").map(Number);
    return stunden * 60 + minuten;
  }
  return Infinity;
}

function vergleicheZeit(a: Aufgabe, b: Aufgabe): number {
  return startMinuten(a) - startMinuten(b);
}

function kategorieNameFuerSort(aufgabe: Aufgabe, eigeneKategorien: EigeneKategorie[]): string {
  const kategorie = kategorieVon(aufgabe, eigeneKategorien);
  return kategorie ? kategorie.label.toLowerCase() : "￿";
}

function vergleicheInnerhalbGruppe(
  a: Aufgabe,
  b: Aufgabe,
  sortModus: SortModus,
  eigeneKategorien: EigeneKategorie[]
): number {
  if (sortModus === "prioritaet") {
    return (
      PRIORITAET_RANG[a.prioritaet] - PRIORITAET_RANG[b.prioritaet] ||
      vergleicheZeit(a, b) ||
      a.titel.localeCompare(b.titel, "de")
    );
  }
  if (sortModus === "kategorie") {
    return (
      kategorieNameFuerSort(a, eigeneKategorien).localeCompare(kategorieNameFuerSort(b, eigeneKategorien)) ||
      vergleicheZeit(a, b) ||
      a.titel.localeCompare(b.titel, "de")
    );
  }
  return vergleicheZeit(a, b) || a.titel.localeCompare(b.titel, "de");
}

export interface AufgabenGruppe {
  key: string;
  datum: string | null;
  label: string;
  aufgaben: Aufgabe[];
}

/**
 * Gruppiert nach Datum (chronologisch, "Ohne Datum" zuletzt) und sortiert
 * innerhalb jeder Gruppe nach dem gewählten Sortiermodus — identisches
 * Prinzip zur Gruppierung im HTML-Prototyp.
 */
export function gruppiereAufgaben(
  aufgaben: Aufgabe[],
  sortModus: SortModus,
  eigeneKategorien: EigeneKategorie[],
  heute: string = heuteISO()
): AufgabenGruppe[] {
  const gruppenMap = new Map<string, AufgabenGruppe>();

  for (const aufgabe of aufgaben) {
    const key = aufgabe.datum ?? "__ohne_datum__";
    let gruppe = gruppenMap.get(key);
    if (!gruppe) {
      gruppe = {
        key,
        datum: aufgabe.datum,
        label: aufgabe.datum ? datumsGruppenLabel(aufgabe.datum, heute) : "Ohne Datum",
        aufgaben: [],
      };
      gruppenMap.set(key, gruppe);
    }
    gruppe.aufgaben.push(aufgabe);
  }

  const gruppen = [...gruppenMap.values()].sort((a, b) => {
    if (a.datum === null) return b.datum === null ? 0 : 1;
    if (b.datum === null) return -1;
    return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0;
  });

  for (const gruppe of gruppen) {
    gruppe.aufgaben.sort((a, b) => vergleicheInnerhalbGruppe(a, b, sortModus, eigeneKategorien));
  }

  return gruppen;
}

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

/** Einheitliche Meldung für fehlgeschlagene Server-Kommunikation (analog PROJ-3/4/5). */
export const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";

/** Kürzt Text für die Verwendung in aria-labels (analog PROJ-3/4/5). */
export function kurzerText(text: string, maxLength = 60): string {
  const bereinigt = text.trim().replace(/[<>]/g, "");
  if (bereinigt.length <= maxLength) return bereinigt;
  return bereinigt.slice(0, maxLength).trimEnd() + "…";
}
