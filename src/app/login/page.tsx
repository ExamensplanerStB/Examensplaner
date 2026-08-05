import { LoginForm } from "@/components/login-form";

function resolveRedirectTarget(redirect: string | string[] | undefined): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectTo = resolveRedirectTarget(params.redirect);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
