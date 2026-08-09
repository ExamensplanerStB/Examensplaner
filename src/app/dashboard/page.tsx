import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-serif-display text-3xl">
            Platzhalter-Dashboard
          </CardTitle>
          <CardDescription>
            Das vollständige Dashboard entsteht mit PROJ-9.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Eingeloggt als{" "}
            <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Abmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
