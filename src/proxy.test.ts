import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

const { proxy } = await import("./proxy");

describe("proxy (middleware)", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("BUG-5: leitet zu /login um, wenn supabase.auth.getUser() eine Exception wirft, statt mit 500 abzustürzen", async () => {
    getUser.mockRejectedValue(new Error("network error"));
    const request = new NextRequest("https://example.com/dashboard");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fdashboard");
  });

  it("BUG-5: /login selbst rendert weiter normal, wenn supabase.auth.getUser() eine Exception wirft", async () => {
    getUser.mockRejectedValue(new Error("network error"));
    const request = new NextRequest("https://example.com/login");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("leitet nicht eingeloggte Nutzer zu /login um (Regressionstest)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const request = new NextRequest("https://example.com/dashboard");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/login?redirect=%2Fdashboard"
    );
  });

  it("leitet eingeloggte Nutzer von /login weg zu /dashboard (Regressionstest)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const request = new NextRequest("https://example.com/login");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });
});
