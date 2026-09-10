import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AufgabeFormValues } from "@/lib/schemas/aufgabe";

const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";

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
  createAufgabe,
  updateAufgabe,
  setAufgabeErledigt,
  deleteAufgabe,
  createEigeneKategorie,
  deleteEigeneKategorie,
} = await import("./actions");

const GUELTIGE_WERTE: AufgabeFormValues = {
  titel: "Wiederholung USt-Fälle",
  datum: "",
  zeittyp: "",
  startZeit: "09:00",
  endZeit: "10:00",
  kategorie: "keine",
  prioritaet: "keine",
  imKalender: true,
};

const AUFGABE_ROW = {
  id: "aufgabe-1",
  titel: "Wiederholung USt-Fälle",
  datum: null,
  zeittyp: null,
  start_zeit: null,
  end_zeit: null,
  kategorie_id: null,
  prioritaet: "keine",
  erledigt: false,
  im_kalender: true,
  created_at: "2026-09-10T00:00:00.000Z",
};

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  revalidatePathMock.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("createAufgabe", () => {
  it("lehnt einen leeren Titel ab, ohne Supabase aufzurufen", async () => {
    const result = await createAufgabe({ ...GUELTIGE_WERTE, titel: "  " });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt Zeitslot mit Endzeit vor der Startzeit ab (Server-seitige Validierung, unabhängig vom Client)", async () => {
    const result = await createAufgabe({
      ...GUELTIGE_WERTE,
      datum: "2026-09-15",
      zeittyp: "zeitslot",
      startZeit: "11:00",
      endZeit: "09:00",
    });
    expect(result).toEqual({ error: "Endzeit muss nach der Startzeit liegen" });
    expect(from).not.toHaveBeenCalled();
  });

  it("legt eine Aufgabe ohne Datum/Kategorie an", async () => {
    const insertAufgabe = chain({ data: AUFGABE_ROW, error: null });
    from.mockReturnValueOnce(insertAufgabe);

    const result = await createAufgabe(GUELTIGE_WERTE);

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) {
      expect(result.aufgabe.id).toBe("aufgabe-1");
      expect(result.aufgabe.datum).toBeNull();
    }
    expect(insertAufgabe.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        titel: "Wiederholung USt-Fälle",
        erledigt: false,
        datum: null,
        zeittyp: null,
        kategorie_id: null,
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("splittet 'eigene:<id>' in kategorie_id und setzt Start-/Endzeit bei Zeittyp 'zeitslot'", async () => {
    const insertAufgabe = chain({ data: AUFGABE_ROW, error: null });
    from.mockReturnValueOnce(insertAufgabe);

    await createAufgabe({
      ...GUELTIGE_WERTE,
      datum: "2026-09-15",
      zeittyp: "zeitslot",
      startZeit: "09:00",
      endZeit: "10:00",
      kategorie: "eigene:kat-1",
    });

    expect(insertAufgabe.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        datum: "2026-09-15",
        zeittyp: "zeitslot",
        start_zeit: "09:00",
        end_zeit: "10:00",
        kategorie_id: "kat-1",
      })
    );
  });

  it("setzt Zeittyp 'ganztag' als Standard bei gesetztem Datum ohne Zeitslot", async () => {
    const insertAufgabe = chain({ data: AUFGABE_ROW, error: null });
    from.mockReturnValueOnce(insertAufgabe);

    await createAufgabe({
      ...GUELTIGE_WERTE,
      datum: "2026-09-15",
      zeittyp: "",
      kategorie: "eigene:kat-1",
    });

    expect(insertAufgabe.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        datum: "2026-09-15",
        zeittyp: "ganztag",
        start_zeit: null,
        end_zeit: null,
        kategorie_id: "kat-1",
      })
    );
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createAufgabe(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Anlegen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await createAufgabe(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("updateAufgabe", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await updateAufgabe("aufgabe-1", { ...GUELTIGE_WERTE, titel: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("aktualisiert eine Aufgabe, ohne den erledigt-Status zu berühren", async () => {
    const update = chain({ data: { ...AUFGABE_ROW, titel: "Neuer Titel" }, error: null });
    from.mockReturnValueOnce(update);

    const result = await updateAufgabe("aufgabe-1", { ...GUELTIGE_WERTE, titel: "Neuer Titel" });

    expect("aufgabe" in result).toBe(true);
    expect(update.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ erledigt: expect.anything() })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Aufgabe nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await updateAufgabe("unbekannt", GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("setAufgabeErledigt", () => {
  it("setzt erledigt auf true", async () => {
    const update = chain({ data: { ...AUFGABE_ROW, erledigt: true }, error: null });
    from.mockReturnValueOnce(update);

    const result = await setAufgabeErledigt("aufgabe-1", true);

    expect("aufgabe" in result).toBe(true);
    if ("aufgabe" in result) expect(result.aufgabe.erledigt).toBe(true);
    expect(update.update).toHaveBeenCalledWith({ erledigt: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Update fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await setAufgabeErledigt("aufgabe-1", false);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("deleteAufgabe", () => {
  it("löscht eine Aufgabe erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteAufgabe("aufgabe-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ error: { code: "other" } }));
    const result = await deleteAufgabe("aufgabe-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("createEigeneKategorie", () => {
  it("lehnt einen leeren Namen ab, ohne Supabase aufzurufen", async () => {
    const result = await createEigeneKategorie("  ", "#2A6FDB");
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("legt eine neue Kategorie an", async () => {
    const insert = chain({ data: { id: "kat-1", name: "Repetitorium", farbe: "#2A6FDB" }, error: null });
    from.mockReturnValueOnce(insert);

    const result = await createEigeneKategorie("Repetitorium", "#2A6FDB");

    expect("kategorie" in result).toBe(true);
    if ("kategorie" in result) expect(result.kategorie.id).toBe("kat-1");
    expect(insert.insert).toHaveBeenCalledWith({ user_id: "user-1", name: "Repetitorium", farbe: "#2A6FDB" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("gibt bei einem (groß-/kleinschreibungsunabhängig) bereits existierenden Namen die bestehende Kategorie zurück, statt eine Dublette anzulegen", async () => {
    const insert = chain({ data: null, error: { code: "23505" } });
    const select = chain({
      data: [
        { id: "kat-1", name: "Repetitorium", farbe: "#2A6FDB" },
        { id: "kat-2", name: "Sonstiges", farbe: "#5E6470" },
      ],
      error: null,
    });
    from.mockReturnValueOnce(insert).mockReturnValueOnce(select);

    const result = await createEigeneKategorie("repetitorium", "#C0392B");

    expect(result).toEqual({ kategorie: { id: "kat-1", name: "Repetitorium", farbe: "#2A6FDB" } });
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createEigeneKategorie("Repetitorium", "#2A6FDB");
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it("zeigt die Verbindungsfehler-Meldung bei einem anderen Fehler als einer Dublette", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await createEigeneKategorie("Repetitorium", "#2A6FDB");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("deleteEigeneKategorie", () => {
  it("löscht eine Kategorie erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteEigeneKategorie("kat-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/todos");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ error: { code: "other" } }));
    const result = await deleteEigeneKategorie("kat-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});
