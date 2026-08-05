"use server";

import type { LoginFormValues } from "@/lib/schemas/login";

export type LoginResult = { error: string } | { success: true };

// Platzhalter bis /backend die echte Supabase-Anmeldung + Redirect verdrahtet (siehe PROJ-1 Tech Design).
export async function login(
  values: LoginFormValues,
  _redirectTo: string
): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  void values;
  return { error: "E-Mail oder Passwort ist falsch" };
}
