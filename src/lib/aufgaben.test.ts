import { describe, expect, it } from "vitest";

import {
  datumsGruppenLabel,
  gruppiereAufgaben,
  istUeberfaellig,
  kategorieVon,
  zeitAnzeige,
  type Aufgabe,
  type EigeneKategorie,
} from "./aufgaben";

function aufgabe(overrides: Partial<Aufgabe> = {}): Aufgabe {
  return {
    id: "a1",
    titel: "Testaufgabe",
    datum: null,
    zeittyp: null,
    startZeit: null,
    endZeit: null,
    eigeneKategorieId: null,
    prioritaet: "keine",
    erledigt: false,
    imKalender: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("istUeberfaellig", () => {
  const heute = "2026-09-09";

  it("Datum in der Vergangenheit, offen -> überfällig", () => {
    expect(istUeberfaellig(aufgabe({ datum: "2026-09-01", erledigt: false }), heute)).toBe(true);
  });

  it("Datum in der Vergangenheit, aber erledigt -> nicht überfällig", () => {
    expect(istUeberfaellig(aufgabe({ datum: "2026-09-01", erledigt: true }), heute)).toBe(false);
  });

  it("Datum heute -> nicht überfällig", () => {
    expect(istUeberfaellig(aufgabe({ datum: heute, erledigt: false }), heute)).toBe(false);
  });

  it("Datum in der Zukunft -> nicht überfällig", () => {
    expect(istUeberfaellig(aufgabe({ datum: "2026-09-20", erledigt: false }), heute)).toBe(false);
  });

  it("kein Datum -> nie überfällig", () => {
    expect(istUeberfaellig(aufgabe({ datum: null, erledigt: false }), heute)).toBe(false);
  });
});

describe("datumsGruppenLabel", () => {
  const heute = "2026-09-09";

  it("heute -> 'Heute'", () => {
    expect(datumsGruppenLabel("2026-09-09", heute)).toBe("Heute");
  });

  it("morgen -> 'Morgen'", () => {
    expect(datumsGruppenLabel("2026-09-10", heute)).toBe("Morgen");
  });

  it("gestern -> 'Gestern'", () => {
    expect(datumsGruppenLabel("2026-09-08", heute)).toBe("Gestern");
  });

  it("anderes Datum -> formatiertes Datum", () => {
    expect(datumsGruppenLabel("2026-09-20", heute)).toBe("20.09.2026");
  });
});

describe("zeitAnzeige", () => {
  it("ganztägig -> 'Ganztägig'", () => {
    expect(zeitAnzeige({ zeittyp: "ganztag", startZeit: null, endZeit: null })).toBe("Ganztägig");
  });

  it("Zeitslot -> 'HH:MM–HH:MM Uhr'", () => {
    expect(zeitAnzeige({ zeittyp: "zeitslot", startZeit: "09:00", endZeit: "11:00" })).toBe("09:00–11:00 Uhr");
  });

  it("kein Zeittyp -> leerer String", () => {
    expect(zeitAnzeige({ zeittyp: null, startZeit: null, endZeit: null })).toBe("");
  });
});

describe("kategorieVon", () => {
  const eigeneKategorien: EigeneKategorie[] = [{ id: "k1", name: "Repetitorium", farbe: "#2A6FDB" }];

  it("eigene Kategorie -> Name + gewählte Farbe", () => {
    expect(kategorieVon({ eigeneKategorieId: "k1" }, eigeneKategorien)).toEqual({
      label: "Repetitorium",
      farbe: "#2A6FDB",
    });
  });

  it("keine Kategorie -> null", () => {
    expect(kategorieVon({ eigeneKategorieId: null }, eigeneKategorien)).toBeNull();
  });

  it("eigene Kategorie wurde gelöscht/existiert nicht mehr -> null", () => {
    expect(kategorieVon({ eigeneKategorieId: "unbekannt" }, eigeneKategorien)).toBeNull();
  });
});

describe("gruppiereAufgaben", () => {
  const heute = "2026-09-09";

  it("gruppiert nach Datum, 'Ohne Datum' immer zuletzt", () => {
    const aufgaben = [
      aufgabe({ id: "a1", datum: "2026-09-10" }),
      aufgabe({ id: "a2", datum: null }),
      aufgabe({ id: "a3", datum: "2026-09-09" }),
    ];
    const gruppen = gruppiereAufgaben(aufgaben, "zeit", [], heute);
    expect(gruppen.map((g) => g.label)).toEqual(["Heute", "Morgen", "Ohne Datum"]);
  });

  it("Sortierung 'zeit': Aufgaben ohne Zeitslot landen innerhalb der Gruppe zuletzt", () => {
    const aufgaben = [
      aufgabe({ id: "a1", titel: "Ohne Zeit", datum: "2026-09-09", zeittyp: "ganztag" }),
      aufgabe({
        id: "a2",
        titel: "Mit Zeit",
        datum: "2026-09-09",
        zeittyp: "zeitslot",
        startZeit: "09:00",
        endZeit: "10:00",
      }),
    ];
    const gruppen = gruppiereAufgaben(aufgaben, "zeit", [], heute);
    expect(gruppen[0].aufgaben.map((a) => a.id)).toEqual(["a2", "a1"]);
  });

  it("Sortierung 'prioritaet': Hoch vor Mittel vor Niedrig vor Keine", () => {
    const aufgaben = [
      aufgabe({ id: "a1", titel: "B", datum: "2026-09-09", prioritaet: "niedrig" }),
      aufgabe({ id: "a2", titel: "A", datum: "2026-09-09", prioritaet: "hoch" }),
      aufgabe({ id: "a3", titel: "C", datum: "2026-09-09", prioritaet: "keine" }),
    ];
    const gruppen = gruppiereAufgaben(aufgaben, "prioritaet", [], heute);
    expect(gruppen[0].aufgaben.map((a) => a.id)).toEqual(["a2", "a1", "a3"]);
  });

  it("Sortierung 'kategorie': alphabetisch, Aufgaben ohne Kategorie zuletzt", () => {
    const eigeneKategorien: EigeneKategorie[] = [
      { id: "k1", name: "Wiederholung", farbe: "#2A6FDB" },
      { id: "k2", name: "Frist", farbe: "#B5384E" },
    ];
    const aufgaben = [
      aufgabe({ id: "a1", titel: "X", datum: "2026-09-09", eigeneKategorieId: "k1" }),
      aufgabe({ id: "a2", titel: "Y", datum: "2026-09-09", eigeneKategorieId: null }),
      aufgabe({ id: "a3", titel: "Z", datum: "2026-09-09", eigeneKategorieId: "k2" }),
    ];
    const gruppen = gruppiereAufgaben(aufgaben, "kategorie", eigeneKategorien, heute);
    // "Frist" < "Wiederholung" alphabetisch, ohne Kategorie zuletzt
    expect(gruppen[0].aufgaben.map((a) => a.id)).toEqual(["a3", "a1", "a2"]);
  });
});
