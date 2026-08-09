import { describe, expect, it } from "vitest";

import { isSafeRedirectTarget, resolveRedirectTarget } from "./safe-redirect";

describe("isSafeRedirectTarget", () => {
  it("erlaubt relative App-Pfade", () => {
    expect(isSafeRedirectTarget("/dashboard")).toBe(true);
    expect(isSafeRedirectTarget("/karteikarten/123")).toBe(true);
  });

  it("lehnt protokoll-relative URLs ab (Open-Redirect-Schutz)", () => {
    expect(isSafeRedirectTarget("//evil.com")).toBe(false);
  });

  it("lehnt absolute URLs ab", () => {
    expect(isSafeRedirectTarget("https://evil.com")).toBe(false);
    expect(isSafeRedirectTarget("http://evil.com/dashboard")).toBe(false);
  });

  it("lehnt Pfade ohne führenden Slash ab", () => {
    expect(isSafeRedirectTarget("dashboard")).toBe(false);
    expect(isSafeRedirectTarget("")).toBe(false);
  });
});

describe("resolveRedirectTarget", () => {
  it("verwendet den gültigen Redirect-Parameter", () => {
    expect(resolveRedirectTarget("/login")).toBe("/login");
  });

  it("nimmt den ersten Wert bei mehrfachem Query-Parameter", () => {
    expect(resolveRedirectTarget(["/a", "/b"])).toBe("/a");
  });

  it("fällt bei fehlendem Parameter auf /dashboard zurück", () => {
    expect(resolveRedirectTarget(undefined)).toBe("/dashboard");
  });

  it("fällt bei unsicherem Parameter auf /dashboard zurück", () => {
    expect(resolveRedirectTarget("//evil.com")).toBe("/dashboard");
  });

  it("respektiert einen benutzerdefinierten Fallback", () => {
    expect(resolveRedirectTarget("//evil.com", "/login")).toBe("/login");
  });
});
