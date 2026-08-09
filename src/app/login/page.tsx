import { LoginForm } from "@/components/login-form";
import { resolveRedirectTarget } from "@/lib/safe-redirect";

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
