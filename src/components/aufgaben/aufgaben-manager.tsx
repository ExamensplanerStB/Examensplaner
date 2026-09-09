"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  gruppiereAufgaben,
  heuteISO,
  type Aufgabe,
  type EigeneKategorie,
  type KategorieFest,
  type SortModus,
  type StatusFilter,
} from "@/lib/aufgaben";
import type { AufgabeFormValues } from "@/lib/schemas/aufgabe";

import { AufgabeForm } from "./aufgabe-form";
import { AufgabeZeile } from "./aufgabe-zeile";

interface AufgabenManagerProps {
  initialAufgaben: Aufgabe[];
  initialEigeneKategorien: EigeneKategorie[];
}

const STATUS_FILTER_OPTIONEN: { value: StatusFilter; label: string }[] = [
  { value: "offen", label: "Offen" },
  { value: "erledigt", label: "Erledigt" },
  { value: "alle", label: "Alle" },
];

const SORT_OPTIONEN: { value: SortModus; label: string }[] = [
  { value: "zeit", label: "Zeit" },
  { value: "prioritaet", label: "Priorität" },
  { value: "kategorie", label: "Kategorie" },
];

function neueId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function werteZuAufgabeFelder(values: AufgabeFormValues): Omit<Aufgabe, "id" | "createdAt" | "erledigt"> {
  const datum = values.datum || null;
  const zeittyp = datum ? (values.zeittyp === "zeitslot" ? "zeitslot" : "ganztag") : null;
  const istZeitslot = zeittyp === "zeitslot";

  return {
    titel: values.titel.trim(),
    datum,
    zeittyp,
    startZeit: istZeitslot ? values.startZeit : null,
    endZeit: istZeitslot ? values.endZeit : null,
    kategorieFest: values.kategorie.startsWith("fest:")
      ? (values.kategorie.slice(5) as KategorieFest)
      : null,
    eigeneKategorieId: values.kategorie.startsWith("eigene:") ? values.kategorie.slice(7) : null,
    prioritaet: values.prioritaet,
    imKalender: values.imKalender,
  };
}

export function AufgabenManager({ initialAufgaben, initialEigeneKategorien }: AufgabenManagerProps) {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(initialAufgaben);
  const [eigeneKategorien, setEigeneKategorien] = useState<EigeneKategorie[]>(initialEigeneKategorien);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("offen");
  const [sortModus, setSortModus] = useState<SortModus>("zeit");

  const [formOpen, setFormOpen] = useState(false);
  const [editingAufgabe, setEditingAufgabe] = useState<Aufgabe | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Aufgabe | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openCreateForm() {
    setEditingAufgabe(null);
    setFormOpen(true);
  }

  function openEditForm(aufgabe: Aufgabe) {
    setEditingAufgabe(aufgabe);
    setFormOpen(true);
  }

  async function handleEigeneKategorieCreate(
    name: string,
    farbe: string
  ): Promise<{ error: string } | { kategorie: EigeneKategorie }> {
    const trimmed = name.trim();
    if (!trimmed) return { error: "Name ist erforderlich" };
    if (trimmed.length > 60) return { error: "Name darf maximal 60 Zeichen lang sein" };

    const bestehend = eigeneKategorien.find((k) => k.name.toLowerCase() === trimmed.toLowerCase());
    if (bestehend) return { kategorie: bestehend };

    const neue: EigeneKategorie = { id: neueId("kategorie"), name: trimmed, farbe };
    setEigeneKategorien((prev) => [...prev, neue]);
    return { kategorie: neue };
  }

  async function handleFormSubmit(values: AufgabeFormValues): Promise<string | null> {
    const felder = werteZuAufgabeFelder(values);

    if (editingAufgabe) {
      setAufgaben((prev) => prev.map((a) => (a.id === editingAufgabe.id ? { ...a, ...felder } : a)));
      return null;
    }

    const neue: Aufgabe = {
      id: neueId("aufgabe"),
      createdAt: heuteISO(),
      erledigt: false,
      ...felder,
    };
    setAufgaben((prev) => [neue, ...prev]);
    return null;
  }

  function toggleErledigt(id: string) {
    setAufgaben((prev) => prev.map((a) => (a.id === id ? { ...a, erledigt: !a.erledigt } : a)));
  }

  function requestDelete(aufgabe: Aufgabe) {
    setDeleteError(null);
    setPendingDelete(aufgabe);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setAufgaben((prev) => prev.filter((a) => a.id !== pendingDelete.id));
    setIsDeleting(false);
    setPendingDelete(null);
  }

  const gefiltert = aufgaben.filter((a) => {
    if (statusFilter === "offen") return !a.erledigt;
    if (statusFilter === "erledigt") return a.erledigt;
    return true;
  });
  const gruppen = gruppiereAufgaben(gefiltert, sortModus, eigeneKategorien);
  const offenCount = aufgaben.filter((a) => !a.erledigt).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-secondary p-0.5">
          {STATUS_FILTER_OPTIONEN.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "h-[30px] rounded-full px-3.5 text-xs font-semibold transition-colors",
                statusFilter === option.value ? "bg-background text-foreground shadow-sm" : "text-ink-2"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-full bg-secondary p-0.5">
          {SORT_OPTIONEN.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortModus(option.value)}
              className={cn(
                "h-[30px] rounded-full px-3.5 text-xs font-semibold transition-colors",
                sortModus === option.value ? "bg-background text-foreground shadow-sm" : "text-ink-2"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-ink-3">
          {offenCount} offen · {aufgaben.length} gesamt
        </span>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Aufgabe
        </Button>
      </div>

      {gruppen.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-foreground">Keine Aufgaben</p>
          <p className="mt-1 text-xs text-ink-3">Für diesen Filter gibt es keine Einträge.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {gruppen.map((gruppe) => (
            <div key={gruppe.key} className="space-y-2">
              <p className="px-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">{gruppe.label}</p>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                {gruppe.aufgaben.map((aufgabe, index) => (
                  <AufgabeZeile
                    key={aufgabe.id}
                    aufgabe={aufgabe}
                    eigeneKategorien={eigeneKategorien}
                    istLetzte={index === gruppe.aufgaben.length - 1}
                    onToggleErledigt={() => toggleErledigt(aufgabe.id)}
                    onEdit={() => openEditForm(aufgabe)}
                    onDeleteRequest={() => requestDelete(aufgabe)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AufgabeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        eigeneKategorien={eigeneKategorien}
        editingAufgabe={editingAufgabe}
        onSubmit={handleFormSubmit}
        onEigeneKategorieCreate={handleEigeneKategorieCreate}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
