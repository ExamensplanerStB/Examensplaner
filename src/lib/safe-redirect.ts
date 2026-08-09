export function isSafeRedirectTarget(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function resolveRedirectTarget(
  redirect: string | string[] | undefined,
  fallback = "/dashboard"
): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;
  return value && isSafeRedirectTarget(value) ? value : fallback;
}
