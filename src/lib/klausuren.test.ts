import { describe, expect, it } from "vitest";
import {
  bestandenVon,
  faecherVon,
  gesamtPunkteVon,
  statusVon,
  type KlausurTeil,
} from "./klausuren";

function teil(overrides: Partial<KlausurTeil> = {}): KlausurTeil {
  return {
    id: "t1",
    klausurId: "k1",
    fachId: "erbst",
    themenIds: [],
    maxPunkte: null,
    erreichtePunkte: null,
    ...overrides,
  };
}

describe("statusVon", () => {
  it("keine Teile -> korrektur_ausstehend", () => {
    expect(statusVon([])).toBe("korrektur_ausstehend");
  });

  it("ein Teil ohne Punkte -> korrektur_ausstehend", () => {
    expect(statusVon([teil()])).toBe("korrektur_ausstehend");
  });

  it("ein Teil mit vollständigen Punkten -> korrigiert", () => {
    expect(statusVon([teil({ maxPunkte: 20, erreichtePunkte: 12 })])).toBe("korrigiert");
  });

  it("mehrere Teile, nur einer vollständig -> weiterhin korrektur_ausstehend", () => {
    const teile = [
      teil({ id: "t1", maxPunkte: 20, erreichtePunkte: 12 }),
      teil({ id: "t2", maxPunkte: 20, erreichtePunkte: null }),
    ];
    expect(statusVon(teile)).toBe("korrektur_ausstehend");
  });

  it("alle Teile vollständig -> korrigiert", () => {
    const teile = [
      teil({ id: "t1", maxPunkte: 20, erreichtePunkte: 12 }),
      teil({ id: "t2", fachId: "ust", maxPunkte: 30, erreichtePunkte: 18 }),
    ];
    expect(statusVon(teile)).toBe("korrigiert");
  });
});

describe("gesamtPunkteVon", () => {
  it("nicht alle Teile vollständig -> null", () => {
    const teile = [teil({ maxPunkte: 20, erreichtePunkte: null })];
    expect(gesamtPunkteVon(teile)).toBeNull();
  });

  it("alle Teile vollständig -> Summe der Punkte", () => {
    const teile = [
      teil({ id: "t1", maxPunkte: 20, erreichtePunkte: 12 }),
      teil({ id: "t2", fachId: "ust", maxPunkte: 30, erreichtePunkte: 20 }),
    ];
    expect(gesamtPunkteVon(teile)).toEqual({ max: 50, erreicht: 32 });
  });
});

describe("bestandenVon", () => {
  it("nicht korrigiert -> null (keine Aussage möglich)", () => {
    expect(bestandenVon([teil()])).toBeNull();
  });

  it("Gesamtquote >= 40% -> bestanden", () => {
    const teile = [teil({ maxPunkte: 100, erreichtePunkte: 40 })];
    expect(bestandenVon(teile)).toBe(true);
  });

  it("Gesamtquote < 40% -> nicht bestanden", () => {
    const teile = [teil({ maxPunkte: 100, erreichtePunkte: 39 })];
    expect(bestandenVon(teile)).toBe(false);
  });

  it("Quote wird über alle Teile gemeinsam berechnet, nicht pro Teil", () => {
    // Teil 1: 10/50 (20%), Teil 2: 40/50 (80%) -> gesamt 50/100 (50%) bestanden,
    // obwohl Teil 1 allein durchgefallen wäre
    const teile = [
      teil({ id: "t1", maxPunkte: 50, erreichtePunkte: 10 }),
      teil({ id: "t2", fachId: "ust", maxPunkte: 50, erreichtePunkte: 40 }),
    ];
    expect(bestandenVon(teile)).toBe(true);
  });
});

describe("faecherVon", () => {
  it("liefert eindeutige Fach-IDs in Reihenfolge des ersten Auftretens", () => {
    const teile = [
      teil({ id: "t1", fachId: "erbst" }),
      teil({ id: "t2", fachId: "ust" }),
      teil({ id: "t3", fachId: "erbst" }),
    ];
    expect(faecherVon(teile)).toEqual(["erbst", "ust"]);
  });
});
