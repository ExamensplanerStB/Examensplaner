import { beforeEach, describe, expect, it, vi } from "vitest";
import { naechstePflichtWdh } from "@/lib/uebungsaufgaben-wiederholung";

const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";
// Erwartete Termine über die echte (separat getestete) Berechnungsfunktion
// ermittelt statt hardcodiert — sonst bricht der Test an jedem neuen Tag,
// weil bewerteUebungsaufgabe() intern das reale heuteISO() verwendet.
const WDH_IN_7_TAGEN = naechstePflichtWdh(3, 0).pflichtWdhDatum;

function chain(result: unknown) {
  const obj: Record<string, unknown> = {};
  obj.select = vi.fn(() => obj);
  obj.insert = vi.fn(() => obj);
  obj.update = vi.fn(() => obj);
  obj.delete = vi.fn(() => obj);
  obj.eq = vi.fn(() => obj);
  obj.single = vi.fn(() => Promise.resolve(result));
  obj.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return obj;
}

const getUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

const {
  createUebungsaufgabe,
  updateUebungsaufgabe,
  bewerteUebungsaufgabe,
  deleteUebungsaufgabe,
} = await import("./actions");

const GUELTIGE_WERTE = {
  fachId: "ust",
  themenIds: ["thema-1"],
  titel: "Verjährung bei vGA, Fall 3",
  quelle: "",
};

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  revalidatePathMock.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("createUebungsaufgabe", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await createUebungsaufgabe({ ...GUELTIGE_WERTE, titel: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt eine Aufgabe ohne Thema ab", async () => {
    const result = await createUebungsaufgabe({ ...GUELTIGE_WERTE, themenIds: [] });
    expect(result).toEqual({ error: "Mindestens ein Thema ist erforderlich" });
    expect(from).not.toHaveBeenCalled();
  });

  it("legt eine Aufgabe inkl. Themenzuordnung an, unbewertet (kein Review-Insert)", async () => {
    const insertAufgabe = chain({
      data: {
        id: "aufgabe-1",
        fach_id: "ust",
        titel: GUELTIGE_WERTE.titel,
        quelle: "",
        pflicht_wdh_datum: null,
        wdh_anzahl: 0,
        created_at: "2026-09-06T00:00:00.000Z",
      },
      error: null,
    });
    const deleteThemen = chain({ error: null });
    const insertThemen = chain({ error: null });
    from.mockReturnValueOnce(insertAufgabe).mockReturnValueOnce(deleteThemen).mockReturnValueOnce(insertThemen);

    const result = await createUebungsaufgabe(GUELTIGE_WERTE);

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) {
      expect(result.aufgabe.id).toBe("aufgabe-1");
      expect(result.aufgabe.themenIds).toEqual(["thema-1"]);
      expect(result.aufgabe.pflichtWdhDatum).toBeNull();
      expect(result.aufgabe.wdhAnzahl).toBe(0);
    }
    expect(insertAufgabe.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        fach_id: "ust",
        titel: GUELTIGE_WERTE.titel,
        pflicht_wdh_datum: null,
        wdh_anzahl: 0,
      })
    );
    expect(insertThemen.insert).toHaveBeenCalledWith([
      { uebungsaufgabe_id: "aufgabe-1", thema_id: "thema-1" },
    ]);
    expect(from).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).toHaveBeenCalledWith("/uebungsaufgaben");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createUebungsaufgabe(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Anlegen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await createUebungsaufgabe(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("updateUebungsaufgabe", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await updateUebungsaufgabe("aufgabe-1", { ...GUELTIGE_WERTE, fachId: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("aktualisiert nur Metadaten, rührt Bewertungsfelder nicht an", async () => {
    const update = chain({
      data: {
        id: "aufgabe-1",
        fach_id: "ust",
        titel: "Neuer Titel",
        quelle: "Quelle X",
        pflicht_wdh_datum: "2026-09-13",
        wdh_anzahl: 1,
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const deleteThemen = chain({ error: null });
    const insertThemen = chain({ error: null });
    from.mockReturnValueOnce(update).mockReturnValueOnce(deleteThemen).mockReturnValueOnce(insertThemen);

    const result = await updateUebungsaufgabe("aufgabe-1", {
      ...GUELTIGE_WERTE,
      titel: "Neuer Titel",
      quelle: "Quelle X",
    });

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) {
      // Update darf pflicht_wdh_datum/wdh_anzahl nicht verändern
      expect(result.aufgabe.pflichtWdhDatum).toBe("2026-09-13");
      expect(result.aufgabe.wdhAnzahl).toBe(1);
    }
    expect(update.update).toHaveBeenCalledWith({
      fach_id: "ust",
      titel: "Neuer Titel",
      quelle: "Quelle X",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/uebungsaufgaben");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Aufgabe nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await updateUebungsaufgabe("unbekannt", GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("bewerteUebungsaufgabe", () => {
  it("lehnt eine ungültige Bewertung ab, ohne Supabase aufzurufen", async () => {
    const result = await bewerteUebungsaufgabe("aufgabe-1", 7, 3, "");
    expect(result).toEqual({ error: "Ungültige Bewertung" });
    expect(from).not.toHaveBeenCalled();
  });

  it("worst >= 4: keine Pflicht-Wiederholung, wdh_anzahl steigt", async () => {
    const selectCurrent = chain({ data: { wdh_anzahl: 0 }, error: null });
    const insertReview = chain({
      data: {
        id: "review-1",
        uebungsaufgabe_id: "aufgabe-1",
        datum: "2026-09-06T10:00:00.000Z",
        fachlich: 5,
        klausurtechnik: 4,
        fehlernotiz: "",
      },
      error: null,
    });
    const update = chain({
      data: {
        id: "aufgabe-1",
        fach_id: "ust",
        titel: "Titel",
        quelle: "",
        pflicht_wdh_datum: null,
        wdh_anzahl: 1,
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const selectThemen = chain({ data: [{ thema_id: "thema-1" }], error: null });
    from
      .mockReturnValueOnce(selectCurrent)
      .mockReturnValueOnce(insertReview)
      .mockReturnValueOnce(update)
      .mockReturnValueOnce(selectThemen);

    const result = await bewerteUebungsaufgabe("aufgabe-1", 5, 4, "");

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) {
      expect(result.aufgabe.pflichtWdhDatum).toBeNull();
      expect(result.aufgabe.wdhAnzahl).toBe(1);
      expect(result.review.datum).toBe("2026-09-06");
      expect(result.aufgabe.themenIds).toEqual(["thema-1"]);
    }
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ pflicht_wdh_datum: null, wdh_anzahl: 1 })
    );
    expect(insertReview.insert).toHaveBeenCalledWith(
      expect.objectContaining({ uebungsaufgabe_id: "aufgabe-1", fachlich: 5, klausurtechnik: 4 })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/uebungsaufgaben");
  });

  it("worst == 3 bei Erstbewertung: Pflicht-Wiederholung in 7 Tagen gesetzt", async () => {
    const selectCurrent = chain({ data: { wdh_anzahl: 0 }, error: null });
    const insertReview = chain({
      data: {
        id: "review-1",
        uebungsaufgabe_id: "aufgabe-1",
        datum: "2026-09-06T10:00:00.000Z",
        fachlich: 3,
        klausurtechnik: 5,
        fehlernotiz: "Norm falsch angewendet",
      },
      error: null,
    });
    const update = chain({
      data: {
        id: "aufgabe-1",
        fach_id: "ust",
        titel: "Titel",
        quelle: "",
        pflicht_wdh_datum: WDH_IN_7_TAGEN,
        wdh_anzahl: 1,
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const selectThemen = chain({ data: [], error: null });
    from
      .mockReturnValueOnce(selectCurrent)
      .mockReturnValueOnce(insertReview)
      .mockReturnValueOnce(update)
      .mockReturnValueOnce(selectThemen);

    const result = await bewerteUebungsaufgabe("aufgabe-1", 3, 5, "Norm falsch angewendet");

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) {
      expect(result.aufgabe.pflichtWdhDatum).toBe(WDH_IN_7_TAGEN);
    }
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ pflicht_wdh_datum: WDH_IN_7_TAGEN, wdh_anzahl: 1 })
    );
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Aufgabe nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await bewerteUebungsaufgabe("unbekannt", 4, 4, "");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await bewerteUebungsaufgabe("aufgabe-1", 4, 4, "");
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("deleteUebungsaufgabe", () => {
  it("löscht eine Aufgabe erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteUebungsaufgabe("aufgabe-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/uebungsaufgaben");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ error: { code: "other" } }));
    const result = await deleteUebungsaufgabe("aufgabe-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});
