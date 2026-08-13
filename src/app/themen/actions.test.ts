import { beforeEach, describe, expect, it, vi } from "vitest";

const CONNECTION_ERROR =
  "Verbindung fehlgeschlagen, bitte später erneut versuchen";

function chain(result: unknown) {
  const obj: Record<string, unknown> = {};
  obj.select = vi.fn(() => obj);
  obj.insert = vi.fn(() => obj);
  obj.update = vi.fn(() => obj);
  obj.delete = vi.fn(() => obj);
  obj.eq = vi.fn(() => obj);
  obj.single = vi.fn(() => Promise.resolve(result));
  obj.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
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

const { addThema, renameThema, changeKlausurrelevanz, deleteThema } =
  await import("./actions");

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  revalidatePathMock.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("addThema", () => {
  it("lehnt leere Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await addThema("", "");
    expect(result).toEqual({ error: "Fach ist erforderlich" });
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt einen zu langen Themennamen ab, ohne Supabase aufzurufen", async () => {
    const result = await addThema("est", "x".repeat(101));
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("legt ein Thema an und gibt es mit Standard-Klausurrelevanz zurück", async () => {
    const insertChain = chain({
      data: {
        id: "thema-1",
        fach_id: "est",
        name: "§ 15 EStG",
        klausurrelevanz: "mittel",
      },
      error: null,
    });
    from.mockReturnValueOnce(insertChain);

    const result = await addThema("est", "§ 15 EStG");

    expect(result).toEqual({
      thema: {
        id: "thema-1",
        fachId: "est",
        name: "§ 15 EStG",
        klausurrelevanz: "mittel",
      },
    });
    expect(from).toHaveBeenCalledWith("themen");
    expect(insertChain.insert).toHaveBeenCalledWith({
      fach_id: "est",
      name: "§ 15 EStG",
      user_id: "user-1",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/themen");
  });

  it("gibt eine Duplikat-Fehlermeldung mit Fachnamen zurück (Unique-Constraint-Verletzung)", async () => {
    const insertChain = chain({
      data: null,
      error: { code: "23505" },
    });
    const fachChain = chain({ data: { name: "Einkommensteuer" } });
    from.mockReturnValueOnce(insertChain).mockReturnValueOnce(fachChain);

    const result = await addThema("est", "§ 15 EStG");

    expect(result).toEqual({
      error: "Dieses Thema existiert bereits in Einkommensteuer",
    });
  });

  it("zeigt die Verbindungsfehler-Meldung bei einem sonstigen Supabase-Fehler", async () => {
    const insertChain = chain({ data: null, error: { code: "other" } });
    from.mockReturnValueOnce(insertChain);

    const result = await addThema("est", "§ 15 EStG");

    expect(result).toEqual({ error: CONNECTION_ERROR });
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Anfrage wirft", async () => {
    from.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    const result = await addThema("est", "§ 15 EStG");

    expect(result).toEqual({ error: CONNECTION_ERROR });
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await addThema("est", "§ 15 EStG");

    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("renameThema", () => {
  it("lehnt einen leeren Namen ab, ohne Supabase aufzurufen", async () => {
    const result = await renameThema("thema-1", "   ");
    expect(result).toEqual({ error: "Themenname ist erforderlich" });
    expect(from).not.toHaveBeenCalled();
  });

  it("benennt ein Thema erfolgreich um", async () => {
    const selectChain = chain({ data: { fach_id: "est" } });
    const updateChain = chain({ error: null });
    from.mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain);

    const result = await renameThema("thema-1", "Neuer Name");

    expect(result).toEqual({ success: true });
    expect(updateChain.update).toHaveBeenCalledWith({ name: "Neuer Name" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/themen");
  });

  it("gibt eine Duplikat-Fehlermeldung mit Fachnamen zurück", async () => {
    const selectChain = chain({ data: { fach_id: "est" } });
    const updateChain = chain({ error: { code: "23505" } });
    const fachChain = chain({ data: { name: "Einkommensteuer" } });
    from
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(fachChain);

    const result = await renameThema("thema-1", "Kollidierender Name");

    expect(result).toEqual({
      error: "Dieses Thema existiert bereits in Einkommensteuer",
    });
  });

  it("zeigt die Verbindungsfehler-Meldung bei einem sonstigen Fehler", async () => {
    const selectChain = chain({ data: { fach_id: "est" } });
    const updateChain = chain({ error: { code: "other" } });
    from.mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain);

    const result = await renameThema("thema-1", "Neuer Name");

    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("changeKlausurrelevanz", () => {
  it("lehnt einen ungültigen Wert ab, ohne Supabase aufzurufen", async () => {
    // @ts-expect-error absichtlich ungültiger Wert, wie er bei direktem Server-Action-Aufruf denkbar wäre
    const result = await changeKlausurrelevanz("thema-1", "dringend");
    expect(result).toEqual({ error: "Ungültige Klausurrelevanz" });
    expect(from).not.toHaveBeenCalled();
  });

  it("ändert die Klausurrelevanz erfolgreich", async () => {
    const updateChain = chain({ error: null });
    from.mockReturnValueOnce(updateChain);

    const result = await changeKlausurrelevanz("thema-1", "hoch");

    expect(result).toEqual({ success: true });
    expect(updateChain.update).toHaveBeenCalledWith({ klausurrelevanz: "hoch" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/themen");
  });

  it("zeigt die Verbindungsfehler-Meldung bei einem Supabase-Fehler", async () => {
    const updateChain = chain({ error: { code: "other" } });
    from.mockReturnValueOnce(updateChain);

    const result = await changeKlausurrelevanz("thema-1", "hoch");

    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("deleteThema", () => {
  it("löscht ein Thema erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteThema("thema-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/themen");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    const deleteChain = chain({ error: { code: "other" } });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteThema("thema-1");

    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});
