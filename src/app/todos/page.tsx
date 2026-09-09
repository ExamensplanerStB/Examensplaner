import { AufgabenManager } from "@/components/aufgaben/aufgaben-manager";
import type { Aufgabe, EigeneKategorie } from "@/lib/aufgaben";

export default function TodosPage() {
  // Die "aufgaben"-/"aufgaben_kategorien"-Tabellen existieren erst nach
  // /backend — bis dahin startet die Liste clientseitig leer.
  const initialAufgaben: Aufgabe[] = [];
  const initialEigeneKategorien: EigeneKategorie[] = [];

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">Todo-Liste</h1>
          <p className="text-sm text-muted-foreground">
            Aufgaben und Fristen für die Examensvorbereitung — mit Datum, Priorität und Kategorie.
          </p>
        </header>
        <AufgabenManager initialAufgaben={initialAufgaben} initialEigeneKategorien={initialEigeneKategorien} />
      </div>
    </main>
  );
}
