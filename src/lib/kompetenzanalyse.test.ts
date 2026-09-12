import { describe, expect, it } from "vitest";

import type { Karteikarte } from "./karteikarten";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "./uebungsaufgaben";
import type { Klausur, KlausurTeil } from "./klausuren";
import type { Fach, Thema } from "./klausurtage";
import {
  type KompetenzanalyseQuellen,
  blockadeVon,
  empfehlungenVon,
  fachVerteilungVon,
  fehlermusterVon,
  fehlernotizenVon,
  formatTrend,
  groesseBlockaden,
  klausurreifeVon,
  priowertVon,
  saeulenVon,
  sortierteThemenNachPrio,
  themaStufeVon,
} from "./kompetenzanalyse";

const HEUTE = "2026-09-09";

const FACH: Fach = { id: "ao", kuerzel: "AO", name: "Abgabenordnung", klausurtag: 1 };
const THEMA: Thema = { id: "t1", fachId: "ao", name: "Bekanntgabe", klausurrelevanz: "hoch" };
const THEMA_2: Thema = { id: "t2", fachId: "ao", name: "Festsetzungsverjährung", klausurrelevanz: "hoch" };

function leereQuellen(): KompetenzanalyseQuellen {
  return { themen: [THEMA], karten: [], aufgaben: [], reviews: [], klausuren: [], teile: [] };
}

function karte(overrides: Partial<Karteikarte>): Karteikarte {
  return {
    id: "k1",
    fachId: "ao",
    typ: "theorie",
    themenIds: [THEMA.id],
    frage: "Frage",
    quelle: "",
    fehlernotiz: "",
    bewertung: 5,
    intervall: 10,
    wdhAnzahl: 1,
    wdhDatum: "2026-09-20",
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function aufgabe(overrides: Partial<Uebungsaufgabe>): Uebungsaufgabe {
  return {
    id: "u1",
    fachId: "ao",
    themenIds: [THEMA.id],
    titel: "Aufgabe",
    quelle: "",
    pflichtWdhDatum: null,
    wdhAnzahl: 1,
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function review(overrides: Partial<UebungsaufgabeReview>): UebungsaufgabeReview {
  return {
    id: "r1",
    uebungsaufgabeId: "u1",
    datum: "2026-09-01",
    fachlich: 5,
    klausurtechnik: 5,
    fehlernotiz: "",
    ...overrides,
  };
}

function klausur(overrides: Partial<Klausur>): Klausur {
  return {
    id: "kl1",
    bezeichnung: "Klausur 1",
    datum: "2026-08-15",
    quelle: "",
    note: "",
    stufe1Text: "",
    stufe2Text: "",
    nachschreibenErledigt: false,
    createdAt: "2026-08-15T00:00:00Z",
    ...overrides,
  };
}

function teil(overrides: Partial<KlausurTeil>): KlausurTeil {
  return {
    id: "tl1",
    klausurId: "kl1",
    fachId: "ao",
    themenIds: [THEMA.id],
    maxPunkte: 100,
    erreichtePunkte: 60,
    ...overrides,
  };
}

describe("themaStufeVon", () => {
  it("keine Belege -> Stufe 0, hasData false", () => {
    const ts = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    expect(ts.stufe).toBe(0);
    expect(ts.hasData).toBe(false);
    expect(ts.basisBroeckelt).toBe(false);
  });

  it("gültige Theorie-Karte -> Stufe 1", () => {
    const quellen = { ...leereQuellen(), karten: [karte({ bewertung: 5, wdhDatum: "2026-09-20" })] };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(1);
    expect(ts.hasData).toBe(true);
  });

  it("Theorie-Karte verfallen (Bewertung < 4) -> Stufe bleibt 0", () => {
    const quellen = { ...leereQuellen(), karten: [karte({ bewertung: 3 })] };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(0);
  });

  it("Subsumtion: Stufe 3 allein über eine frische Übungsaufgabe, ohne jede Karteikarte", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      aufgaben: [aufgabe({})],
      reviews: [review({ datum: "2026-09-01", fachlich: 5, klausurtechnik: 5 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(3);
    expect(ts.basisBroeckelt).toBe(false);
  });

  it("offene Pflicht-Wiederholung blockiert Stufe 3, auch bei gutem Worst der letzten Bewertung", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      aufgaben: [aufgabe({ pflichtWdhDatum: "2026-09-15" })],
      reviews: [review({ datum: "2026-09-01", fachlich: 5, klausurtechnik: 5 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBeLessThan(3);
    expect(ts.offenePflichtWdh).toBe(true);
  });

  it("gültiger Klausurteil -> Stufe 4 direkt, deckt 1-3 per Subsumtion", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 60, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(4);
  });

  it("Stufe 4 über Klausurteil, aber Theorie-Karte verfallen -> Basis bröckelt", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      karten: [karte({ bewertung: 3 })],
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 60, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(4);
    expect(ts.basisBroeckelt).toBe(true);
  });

  it("Klausurteil unter BESTEHEN_SICHER (55%) -> kein Stufe-4-Beleg", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 50, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(0);
  });
});

describe("blockadeVon", () => {
  it("Stufe 4 -> keine Blockade", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 60, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(blockadeVon(ts)).toBeNull();
  });

  it("Stufe 0 -> Blockade nennt fehlende/verfallene Theorie-Karte", () => {
    const ts = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    const blockade = blockadeVon(ts);
    expect(blockade?.naechsteStufe).toBe(1);
    expect(blockade?.text).toContain("Theorie-Karte");
  });
});

describe("priowertVon", () => {
  it("Stufe 4 ohne Basis-Bröckeln -> niedrigster Priowert (0)", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      // Frische Übungsaufgabe deckt die Basis (1-3) mit ab, damit sie beim
      // Erreichen von Stufe 4 nicht als "bröckelnd" gilt.
      aufgaben: [aufgabe({})],
      reviews: [review({ datum: "2026-09-01", fachlich: 5, klausurtechnik: 5 })],
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 60, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.basisBroeckelt).toBe(false);
    expect(priowertVon(ts, HEUTE)).toBe(0);
  });

  it("Stufe 0 ohne Daten -> Priowert 8", () => {
    const ts = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    expect(priowertVon(ts, HEUTE)).toBe(8);
  });

  it("Stufe 3 mit bald ablaufendem Übungs-Beleg (<=7 Tage) -> +2 Bonus", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      aufgaben: [aufgabe({})],
      // 56 - diffTage(datum, heute) <= 7  =>  diffTage >= 49
      reviews: [review({ datum: "2026-07-21", fachlich: 4, klausurtechnik: 4 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.stufe).toBe(3);
    expect(priowertVon(ts, HEUTE)).toBe(4); // (4-3)*2 + 2 (bald ablaufend)
  });

  it("basisBroeckelt erhöht den Priowert um 2", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      karten: [karte({ bewertung: 3 })],
      klausuren: [klausur({})],
      teile: [teil({ erreichtePunkte: 60, maxPunkte: 100 })],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(ts.basisBroeckelt).toBe(true);
    expect(priowertVon(ts, HEUTE)).toBe(2); // (4-4)*2 + 2
  });
});

describe("sortierteThemenNachPrio / groesseBlockaden", () => {
  it("sortiert absteigend nach Priowert, dringendstes zuerst", () => {
    const schwach = themaStufeVon(THEMA, leereQuellen(), HEUTE); // Stufe 0, prio 8
    const stark = themaStufeVon(
      THEMA_2,
      { ...leereQuellen(), klausuren: [klausur({})], teile: [teil({ themenIds: [THEMA_2.id] })] },
      HEUTE
    ); // Stufe 4, prio 0
    const sortiert = sortierteThemenNachPrio([stark, schwach], HEUTE);
    expect(sortiert[0].thema.id).toBe(THEMA.id);
    expect(groesseBlockaden([stark, schwach], 1, HEUTE)[0].thema.id).toBe(THEMA.id);
  });
});

describe("fachVerteilungVon", () => {
  it("zählt Themen korrekt je Stufe und berechnet den Durchschnitt nur über Themen mit Daten", () => {
    const stufe0 = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    const stufe4 = themaStufeVon(
      THEMA_2,
      { ...leereQuellen(), klausuren: [klausur({})], teile: [teil({ themenIds: [THEMA_2.id] })] },
      HEUTE
    );
    const verteilung = fachVerteilungVon(FACH, [stufe0, stufe4]);
    expect(verteilung.segmente.find((s) => s.stufe === 0)?.anzahl).toBe(1);
    expect(verteilung.segmente.find((s) => s.stufe === 4)?.anzahl).toBe(1);
    // stufe0 hat hasData=false (keine Belege) -> fließt nicht in den Durchschnitt ein
    expect(verteilung.durchschnitt).toBe(4);
  });

  it("keine Themen mit Daten -> Durchschnitt null", () => {
    const stufe0 = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    expect(fachVerteilungVon(FACH, [stufe0]).durchschnitt).toBeNull();
  });
});

describe("klausurreifeVon", () => {
  it("Fach ohne Klausur -> null", () => {
    expect(klausurreifeVon(FACH, [], [], HEUTE)).toBeNull();
  });

  it("zählt nur Teile des angefragten Fachs und ignoriert andere Fächer derselben Klausur", () => {
    const k = klausur({});
    const teile = [teil({ fachId: "ao", erreichtePunkte: 60, maxPunkte: 100 }), teil({ id: "tl2", fachId: "ust", erreichtePunkte: 10, maxPunkte: 100 })];
    const reife = klausurreifeVon(FACH, [k], teile, HEUTE);
    expect(reife?.anzahl).toBe(1);
    expect(reife?.anteilBestanden).toBe(1);
  });

  it("weniger als 6 korrigierte Klausuren -> Trend null", () => {
    const k = klausur({});
    const reife = klausurreifeVon(FACH, [k], [teil({})], HEUTE);
    expect(reife?.trend).toBeNull();
  });

  it("jüngste Klausur älter als 42 Tage -> braucht frische Klausur", () => {
    const k = klausur({ datum: "2026-01-01" });
    const reife = klausurreifeVon(FACH, [k], [teil({})], HEUTE);
    expect(reife?.brauchtFrischeKlausur).toBe(true);
  });
});

describe("fehlernotizenVon", () => {
  it("aggregiert Fehlernotizen aus allen drei Hubs, sortiert nach Datum absteigend", () => {
    const quellen: KompetenzanalyseQuellen = {
      themen: [THEMA],
      karten: [karte({ fehlernotiz: "Frist vergessen", createdAt: "2026-08-01T00:00:00Z" })],
      aufgaben: [aufgabe({})],
      reviews: [review({ datum: "2026-09-01", fehlernotiz: "Schema unklar" })],
      klausuren: [klausur({ datum: "2026-08-20", stufe1Text: "Verwechslung der Normen" })],
      teile: [teil({})],
    };
    const notizen = fehlernotizenVon(THEMA, quellen);
    expect(notizen).toHaveLength(3);
    expect(notizen[0].datum).toBe("2026-09-01");
  });

  it("Klausur-Notiz wird jedem Thema aller Teile dieser Klausur zugeordnet", () => {
    const quellen: KompetenzanalyseQuellen = {
      themen: [THEMA, THEMA_2],
      karten: [],
      aufgaben: [],
      reviews: [],
      klausuren: [klausur({ stufe1Text: "Gemeinsame Nacharbeit" })],
      teile: [teil({ themenIds: [THEMA.id] }), teil({ id: "tl2", themenIds: [THEMA_2.id] })],
    };
    expect(fehlernotizenVon(THEMA, quellen)).toHaveLength(1);
    expect(fehlernotizenVon(THEMA_2, quellen)).toHaveLength(1);
  });

  it("leere Fehlernotizen werden nicht aufgenommen", () => {
    const quellen = { ...leereQuellen(), karten: [karte({ fehlernotiz: "  " })] };
    expect(fehlernotizenVon(THEMA, quellen)).toHaveLength(0);
  });
});

describe("fehlermusterVon", () => {
  it("erkennt alle vier Keyword-Kategorien unabhängig von Groß-/Kleinschreibung", () => {
    const notizen = [
      { hub: "theorie" as const, hubLabel: "Theorie", datum: HEUTE, text: "Frist Vergessen, Rechtsfolge Unklar" },
      { hub: "uebung" as const, hubLabel: "Übung", datum: HEUTE, text: "Normen verwechselt, Lücke im Schema" },
    ];
    expect(fehlermusterVon(notizen)).toHaveLength(4);
  });

  it("keine Treffer -> leeres Array", () => {
    expect(fehlermusterVon([{ hub: "theorie", hubLabel: "Theorie", datum: HEUTE, text: "Alles gut gelaufen" }])).toHaveLength(0);
  });
});

describe("empfehlungenVon", () => {
  it("solide Basis ohne Blockade/Bröckeln/Muster -> Standardtext", () => {
    const quellen: KompetenzanalyseQuellen = {
      ...leereQuellen(),
      aufgaben: [aufgabe({})],
      reviews: [review({ datum: "2026-09-01", fachlich: 5, klausurtechnik: 5 })],
      klausuren: [klausur({})],
      teile: [teil({})],
    };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    expect(empfehlungenVon(ts, [])).toEqual([
      "Thema ist klausurfest. Halte es mit den fälligen Wiederholungen warm, damit die Haltbarkeit nicht abläuft.",
    ]);
  });

  it("Stufe 0 ohne jede Notiz -> generischer Fallback-Text", () => {
    const ts = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    const empfehlungen = empfehlungenVon(ts, []);
    expect(empfehlungen[0]).toContain("Stufe 1 blockiert");
  });

  it("liefert maximal 3 Empfehlungszeilen", () => {
    const quellen = { ...leereQuellen(), karten: [karte({ bewertung: 3 })] };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    const notizen = fehlernotizenVon(THEMA, {
      ...quellen,
      karten: [karte({ bewertung: 3, fehlernotiz: "vergessen unklar verwechselt schema" })],
    });
    expect(empfehlungenVon(ts, notizen).length).toBeLessThanOrEqual(3);
  });
});

describe("saeulenVon", () => {
  it("ohne jede Belegquelle sind alle vier Säulen 'keine_daten'", () => {
    const ts = themaStufeVon(THEMA, leereQuellen(), HEUTE);
    const saeulen = saeulenVon(ts, HEUTE);
    expect(saeulen.every((s) => s.status === "keine_daten")).toBe(true);
  });

  it("gültige Theorie-Karte -> Säule 'gueltig'", () => {
    const quellen = { ...leereQuellen(), karten: [karte({ bewertung: 5, wdhDatum: "2026-09-20" })] };
    const ts = themaStufeVon(THEMA, quellen, HEUTE);
    const theorieSaeule = saeulenVon(ts, HEUTE).find((s) => s.key === "theorie");
    expect(theorieSaeule?.status).toBe("gueltig");
  });
});

describe("formatTrend", () => {
  it("null (< 6 Klausuren) -> Gedankenstrich, graue Farbe", () => {
    expect(formatTrend(null)).toEqual({ text: "–", farbe: "grey" });
  });

  it("Verbesserung > 2 Prozentpunkte -> grüner Pfeil nach oben mit Vorzeichen", () => {
    expect(formatTrend(0.05)).toEqual({ text: "▲ +5 %", farbe: "green" });
  });

  it("Verschlechterung < -2 Prozentpunkte -> roter Pfeil nach unten", () => {
    expect(formatTrend(-0.08)).toEqual({ text: "▼ -8 %", farbe: "red" });
  });

  it("Änderung innerhalb ±2 Prozentpunkte -> neutraler Pfeil, graue Farbe", () => {
    expect(formatTrend(0.01)).toEqual({ text: "→ +1 %", farbe: "grey" });
    expect(formatTrend(-0.01)).toEqual({ text: "→ -1 %", farbe: "grey" });
  });

  it("exakt an der ±2-Prozentpunkte-Schwelle zählt noch als neutral", () => {
    expect(formatTrend(0.02)).toEqual({ text: "→ +2 %", farbe: "grey" });
    expect(formatTrend(-0.02)).toEqual({ text: "→ -2 %", farbe: "grey" });
  });

  it("Trend exakt 0 -> neutraler Pfeil ohne Vorzeichen", () => {
    expect(formatTrend(0)).toEqual({ text: "→ 0 %", farbe: "grey" });
  });
});
