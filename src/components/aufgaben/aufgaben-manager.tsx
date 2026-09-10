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
  CONNECTION_ERROR,
  gruppiereAufgaben,
  type Aufgabe,
  type EigeneKategorie,
  type SortModus,
  type StatusFilter,
} from "@/lib/aufgaben";
import type { AufgabeFormValues } from "@/lib/schemas/aufgabe";
import {
  createAufgabe,
  createEigeneKategorie,
  deleteAufgabe,
  setAufgabeErledigt,
  updateAufgabe,
} from "@/app/todos/actions";

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
    try {
      const result = await createEigeneKategorie(name, farbe);
      if ("error" in result) return result;
      setEigeneKategorien((prev) =>
        prev.some((k) => k.id === result.kategorie.id) ? prev : [...prev, result.kategorie]
      );
      return result;
    } catch {
      return { error: CONNECTION_ERROR };
    }
  }

  // TODO(/backend): durch echte Server Action deleteEigeneKategorie(id) ersetzen —
  // aktuell nur lokaler State (frontend-only Phase des Refine-Zyklus, siehe Tech Design).
  async function handleEigeneKategorieDelete(id: string): Promise<string | null> {
    try {
      setEigeneKategorien((prev) => prev.filter((k) => k.id !== id));
      setAufgaben((prev) =>
        prev.map((a) => (a.eigeneKategorieId === id ? { ...a, eigeneKategorieId: null } : a))
      );
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  async function handleFormSubmit(values: AufgabeFormValues): Promise<string | null> {
    try {
      if (editingAufgabe) {
        const result = await updateAufgabe(editingAufgabe.id, values);
        if ("error" in result) return result.error;
        setAufgaben((prev) => prev.map((a) => (a.id === editingAufgabe.id ? result.aufgabe : a)));
        return null;
      }

      const result = await createAufgabe(values);
      if ("error" in result) return result.error;
      setAufgaben((prev) => [result.aufgabe, ...prev]);
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  async function toggleErledigt(aufgabe: Aufgabe): Promise<string | null> {
    try {
      const result = await setAufgabeErledigt(aufgabe.id, !aufgabe.erledigt);
      if ("error" in result) return result.error;
      setAufgaben((prev) => prev.map((a) => (a.id === aufgabe.id ? result.aufgabe : a)));
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function requestDelete(aufgabe: Aufgabe) {
    setDeleteError(null);
    setPendingDelete(aufgabe);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteAufgabe(pendingDelete.id);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setAufgaben((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setDeleteError(CONNECTION_ERROR);
    } finally {
      setIsDeleting(false);
    }
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
                    onToggleErledigt={() => toggleErledigt(aufgabe)}
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
        onEigeneKategorieDelete={handleEigeneKategorieDelete}
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
