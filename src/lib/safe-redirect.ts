const TRUSTED_BASE = "http://internal.invalid";

export function isSafeRedirectTarget(path: string): boolean {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  try {
    return new URL(path, TRUSTED_BASE).origin === TRUSTED_BASE;
  } catch {
    return false;
  }
}

export function resolveRedirectTarget(
  redirect: string | string[] | undefined,
  fallback = "/dashboard"
): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;
  return value && isSafeRedirectTarget(value) ? value : fallback;
}
