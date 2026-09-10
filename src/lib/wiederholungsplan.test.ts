import { describe, expect, it } from "vitest";

import type { Karteikarte } from "./karteikarten";
import type { Klausur, KlausurTeil } from "./klausuren";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "./uebungsaufgaben";
import { gruppeVon, wiederholungsEintraegeVon } from "./wiederholungsplan";

const heute = "2026-09-10";

function karte(overrides: Partial<Karteikarte> = {}): Karteikarte {
  return {
    id: "k1",
    fachId: "fach-est",
    typ: "theorie",
    themenIds: [],
    frage: "Frage?",
    quelle: "",
    fehlernotiz: "",
    bewertung: 4,
    intervall: 5,
    wdhAnzahl: 1,
    wdhDatum: heute,
    createdAt: heute,
    ...overrides,
  };
}

function aufgabe(overrides: Partial<Uebungsaufgabe> = {}): Uebungsaufgabe {
  return {
    id: "a1",
    fachId: "fach-ust",
    themenIds: [],
    titel: "Aufgabe",
    quelle: "",
    pflichtWdhDatum: heute,
    wdhAnzahl: 1,
    createdAt: heute,
    ...overrides,
  };
}

function review(overrides: Partial<UebungsaufgabeReview> = {}): UebungsaufgabeReview {
  return {
    id: "r1",
    uebungsaufgabeId: "a1",
    datum: heute,
    fachlich: 3,
    klausurtechnik: 3,
    fehlernotiz: "",
    ...overrides,
  };
}

function klausur(overrides: Partial<Klausur> = {}): Klausur {
  return {
    id: "kl1",
    bezeichnung: "ErbSt-01",
    datum: "2026-06-27", // + 75 Tage = 2026-09-10
    quelle: "",
    note: "",
    stufe1Text: "",
    stufe2Text: "",
    nachschreibenErledigt: false,
    createdAt: heute,
    ...overrides,
  };
}

function teil(overrides: Partial<KlausurTeil> = {}): KlausurTeil {
  return {
    id: "t1",
    klausurId: "kl1",
    fachId: "fach-erbst",
    themenIds: [],
    maxPunkte: null,
    erreichtePunkte: null,
    ...overrides,
  };
}

describe("gruppeVon", () => {
  it("Datum in der Vergangenheit -> ueberfaellig", () => {
    expect(gruppeVon("2026-09-09", heute)).toBe("ueberfaellig");
  });

  it("Datum = heute -> heute", () => {
    expect(gruppeVon(heute, heute)).toBe("heute");
  });

  it("Datum 1 Tag in der Zukunft -> diese_woche", () => {
    expect(gruppeVon("2026-09-11", heute)).toBe("diese_woche");
  });

  it("Datum genau 7 Tage in der Zukunft -> diese_woche (Grenzfall)", () => {
    expect(gruppeVon("2026-09-17", heute)).toBe("diese_woche");
  });

  it("Datum 8 Tage in der Zukunft -> spaeter", () => {
    expect(gruppeVon("2026-09-18", heute)).toBe("spaeter");
  });
});

describe("wiederholungsEintraegeVon — Karteikarten", () => {
  it("jede Karte wird unabhängig von ihrer Gültigkeit als Eintrag aufgenommen", () => {
    const ergebnis = wiederholungsEintraegeVon(
      { karten: [karte({ wdhDatum: "2026-09-05" })], aufgaben: [], reviews: [], klausuren: [], teile: [] },
      heute
    );
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0]).toMatchObject({ art: "karteikarte", gruppe: "ueberfaellig", fachIds: ["fach-est"] });
  });
});

describe("wiederholungsEintraegeVon — Übungsaufgaben", () => {
  it("Aufgabe ohne offene Pflicht-Wiederholung (pflichtWdhDatum null) wird nicht aufgenommen", () => {
    const ergebnis = wiederholungsEintraegeVon(
      { karten: [], aufgaben: [aufgabe({ pflichtWdhDatum: null })], reviews: [], klausuren: [], teile: [] },
      heute
    );
    expect(ergebnis).toHaveLength(0);
  });

  it("worst <= 2 der letzten Bewertung -> nacharbeitEmpfohlen true", () => {
    const ergebnis = wiederholungsEintraegeVon(
      {
        karten: [],
        aufgaben: [aufgabe()],
        reviews: [review({ fachlich: 2, klausurtechnik: 4 })],
        klausuren: [],
        teile: [],
      },
      heute
    );
    expect(ergebnis[0]).toMatchObject({ art: "uebungsaufgabe", nacharbeitEmpfohlen: true });
  });

  it("worst == 3 der letzten Bewertung -> nacharbeitEmpfohlen false", () => {
    const ergebnis = wiederholungsEintraegeVon(
      {
        karten: [],
        aufgaben: [aufgabe()],
        reviews: [review({ fachlich: 3, klausurtechnik: 5 })],
        klausuren: [],
        teile: [],
      },
      heute
    );
    expect(ergebnis[0]).toMatchObject({ nacharbeitEmpfohlen: false });
  });

  it("ohne jede Review (theoretisch inkonsistenter Zustand) -> nacharbeitEmpfohlen false statt Absturz", () => {
    const ergebnis = wiederholungsEintraegeVon(
      { karten: [], aufgaben: [aufgabe()], reviews: [], klausuren: [], teile: [] },
      heute
    );
    expect(ergebnis[0]).toMatchObject({ nacharbeitEmpfohlen: false });
  });
});

describe("wiederholungsEintraegeVon — Probeklausuren", () => {
  it("bereits als nachgeschrieben markierte Klausur wird nicht aufgenommen", () => {
    const ergebnis = wiederholungsEintraegeVon(
      {
        karten: [],
        aufgaben: [],
        reviews: [],
        klausuren: [klausur({ nachschreibenErledigt: true })],
        teile: [teil()],
      },
      heute
    );
    expect(ergebnis).toHaveLength(0);
  });

  it("Fälligkeitsdatum = Klausurdatum + 75 Tage, vorausschauend berechnet", () => {
    const ergebnis = wiederholungsEintraegeVon(
      { karten: [], aufgaben: [], reviews: [], klausuren: [klausur()], teile: [teil()] },
      heute
    );
    expect(ergebnis[0]).toMatchObject({ art: "klausur", faelligkeitsdatum: "2026-09-10", gruppe: "heute" });
  });

  it("Fächer werden aus allen Teilen der Klausur zusammengeführt (faecherVon)", () => {
    const ergebnis = wiederholungsEintraegeVon(
      {
        karten: [],
        aufgaben: [],
        reviews: [],
        klausuren: [klausur()],
        teile: [teil({ fachId: "fach-erbst" }), teil({ id: "t2", fachId: "fach-ust" })],
      },
      heute
    );
    expect(ergebnis[0].fachIds).toEqual(["fach-erbst", "fach-ust"]);
  });
});

describe("wiederholungsEintraegeVon — Sortierung", () => {
  it("Einträge unterschiedlicher Art werden gemeinsam nach Fälligkeit aufsteigend sortiert", () => {
    const ergebnis = wiederholungsEintraegeVon(
      {
        karten: [karte({ id: "k-spaet", wdhDatum: "2026-09-20" })],
        aufgaben: [aufgabe({ id: "a-frueh", pflichtWdhDatum: "2026-09-08" })],
        reviews: [],
        klausuren: [klausur({ id: "kl-mitte", datum: "2026-06-25" })], // + 75 = 2026-09-08... verify below
        teile: [teil({ klausurId: "kl-mitte" })],
      },
      heute
    );
    const reihenfolge = ergebnis.map((e) => e.id);
    expect(reihenfolge[0]).toBe("a-frueh");
    expect(reihenfolge[reihenfolge.length - 1]).toBe("k-spaet");
  });
});
