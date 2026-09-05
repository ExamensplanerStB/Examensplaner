import { describe, expect, it } from "vitest";

import {
  faelligkeitsDringlichkeit,
  faelligkeitsTag,
  formatDatum,
  gueltigkeitsStatus,
  kurzerText,
  type Karteikarte,
} from "./karteikarten";

function karte(overrides: Partial<Karteikarte> = {}): Karteikarte {
  return {
    id: "k1",
    fachId: "ust",
    typ: "theorie",
    themenIds: ["t1"],
    frage: "Frage?",
    quelle: "",
    fehlernotiz: "",
    bewertung: 4,
    intervall: 10,
    wdhAnzahl: 2,
    wdhDatum: "2026-09-10",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("gueltigkeitsStatus", () => {
  it("ist 'gueltig' bei Bewertung ≥ 4 und nicht überschrittener Karenz", () => {
    expect(gueltigkeitsStatus(karte({ bewertung: 4, wdhDatum: "2026-09-10", intervall: 10 }), "2026-09-10")).toBe(
      "gueltig"
    );
  });

  it("ist 'verfallen' bei Bewertung < 4, unabhängig von der Fälligkeit", () => {
    expect(gueltigkeitsStatus(karte({ bewertung: 3, wdhDatum: "2026-09-20" }), "2026-09-05")).toBe("verfallen");
  });

  it("ist 'verfallen' wenn Fälligkeit + Karenz überschritten ist, trotz guter Bewertung", () => {
    // Intervall 10 -> Karenz 2,5 Tage; Fälligkeit + Karenz = 2026-09-12,5
    expect(gueltigkeitsStatus(karte({ bewertung: 5, wdhDatum: "2026-09-10", intervall: 10 }), "2026-09-14")).toBe(
      "verfallen"
    );
  });
});

describe("faelligkeitsTag", () => {
  it("zeigt 'heute' bei Differenz 0", () => {
    expect(faelligkeitsTag("2026-09-05", "2026-09-05")).toBe("heute");
  });

  it("zeigt 'morgen' bei Differenz 1", () => {
    expect(faelligkeitsTag("2026-09-06", "2026-09-05")).toBe("morgen");
  });

  it("zeigt 'in Xd' bei Differenz > 1", () => {
    expect(faelligkeitsTag("2026-09-10", "2026-09-05")).toBe("in 5d");
  });

  it("zeigt 'Xd überf.' bei negativer Differenz", () => {
    expect(faelligkeitsTag("2026-09-01", "2026-09-05")).toBe("4d überf.");
  });
});

describe("faelligkeitsDringlichkeit", () => {
  it("ist 'ueberfaellig' bei negativer Differenz", () => {
    expect(faelligkeitsDringlichkeit("2026-09-01", "2026-09-05")).toBe("ueberfaellig");
  });

  it("ist 'heute' bei Differenz 0", () => {
    expect(faelligkeitsDringlichkeit("2026-09-05", "2026-09-05")).toBe("heute");
  });

  it("ist 'geplant' bei positiver Differenz", () => {
    expect(faelligkeitsDringlichkeit("2026-09-06", "2026-09-05")).toBe("geplant");
  });
});

describe("formatDatum", () => {
  it("formatiert ISO-Datum als DD.MM.YYYY", () => {
    expect(formatDatum("2026-09-05")).toBe("05.09.2026");
  });
});

describe("kurzerText", () => {
  it("lässt kurzen Text unverändert", () => {
    expect(kurzerText("Kurze Frage?")).toBe("Kurze Frage?");
  });

  it("entfernt spitze Klammern, damit HTML-ähnlicher Text nicht wie Markup wirkt", () => {
    expect(kurzerText('<img src=x onerror="alert(1)">')).toBe('img src=x onerror="alert(1)"');
  });

  it("kürzt langen Text auf die angegebene Länge mit Ellipse", () => {
    const langerText = "x".repeat(100);
    const ergebnis = kurzerText(langerText, 60);
    expect(ergebnis).toBe("x".repeat(60) + "…");
  });

  it("trimmt Whitespace vor der Längenprüfung", () => {
    expect(kurzerText("   Frage mit Leerzeichen   ")).toBe("Frage mit Leerzeichen");
  });
});
