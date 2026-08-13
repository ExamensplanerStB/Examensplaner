import { ThemenManager } from "@/components/themen/themen-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import { createClient } from "@/lib/supabase/server";

export default async function ThemenPage() {
  const supabase = await createClient();

  const [{ data: faecher }, { data: themen }] = await Promise.all([
    supabase
      .from("faecher")
      .select("id, kuerzel, name, klausurtag")
      .order("name"),
    supabase
      .from("themen")
      .select("id, fach_id, name, klausurrelevanz")
      .order("name"),
  ]);

  const klausurtage = groupFaecherByKlausurtag((faecher ?? []) as Fach[]);
  const initialThemen: Thema[] = (themen ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  }));

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">
            Themenkatalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Themen werden organisch pro Fach angelegt und stehen danach in
            allen Hubs als Auswahl zur Verfügung — das verhindert Dopplungen
            durch unterschiedliche Schreibweisen.
          </p>
        </header>
        <ThemenManager klausurtage={klausurtage} initialThemen={initialThemen} />
      </div>
    </main>
  );
}
