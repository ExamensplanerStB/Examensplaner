"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSafeRedirectTarget } from "@/lib/safe-redirect";
import type { LoginFormValues } from "@/lib/schemas/login";

export type LoginResult = { error: string };

export async function login(
  values: LoginFormValues,
  redirectTo: string
): Promise<LoginResult> {
  const supabase = await createClient();

  let signInError;
  try {
    ({ error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    }));
  } catch {
    return { error: "Verbindung fehlgeschlagen, bitte später erneut versuchen" };
  }

  if (signInError) {
    return { error: "E-Mail oder Passwort ist falsch" };
  }

  redirect(isSafeRedirectTarget(redirectTo) ? redirectTo : "/dashboard");
}
