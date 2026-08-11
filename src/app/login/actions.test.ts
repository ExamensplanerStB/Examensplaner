import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword },
  })),
}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

const { login } = await import("./actions");

describe("login server action", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    redirectMock.mockClear();
  });

  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen (BUG-2)", async () => {
    const result = await login(
      { email: "not-an-email", password: "" },
      "/dashboard"
    );
    expect(result).toEqual({ error: "E-Mail oder Passwort ist falsch" });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("lehnt nicht-string Payloads ab (z.B. direkter Server-Action-Aufruf unter Umgehung des Client-Formulars)", async () => {
    const result = await login(
      // @ts-expect-error absichtlich manipulierter Payload, wie ihn ein Angreifer per direktem POST an die Action senden könnte
      { email: { evil: true }, password: 123 },
      "/dashboard"
    );
    expect(result).toEqual({ error: "E-Mail oder Passwort ist falsch" });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("ruft Supabase mit den validierten Daten auf, wenn die Eingabe gültig ist", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const result = await login(
      { email: "test@example.com", password: "geheim123" },
      "/dashboard"
    );

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "geheim123",
    });
    expect(result).toEqual({ error: "E-Mail oder Passwort ist falsch" });
  });

  it("leitet bei Erfolg zum validierten Redirect-Ziel weiter", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    await expect(
      login({ email: "test@example.com", password: "geheim123" }, "/dashboard")
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("fällt bei unsicherem Redirect-Ziel auf /dashboard zurück", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    await expect(
      login({ email: "test@example.com", password: "geheim123" }, "/\\evil.com")
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
});
