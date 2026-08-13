import { ThemenManager } from "@/components/themen/themen-manager";
import { KLAUSURTAGE } from "@/lib/klausurtage";

export default function ThemenPage() {
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
        <ThemenManager klausurtage={KLAUSURTAGE} />
      </div>
    </main>
  );
}
