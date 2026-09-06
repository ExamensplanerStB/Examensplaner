"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import { addThema } from "@/app/themen/actions";
import {
  bewerteUebungsaufgabe,
  createUebungsaufgabe,
  deleteUebungsaufgabe,
  updateUebungsaufgabe,
} from "@/app/uebungsaufgaben/actions";
import {
  CONNECTION_ERROR,
  STATUS_LABEL,
  letzteReviewVon,
  statusVon,
  type Uebungsaufgabe,
  type UebungsaufgabeReview,
  type UebungsaufgabenStatus,
} from "@/lib/uebungsaufgaben";
import type { UebungsaufgabeFormValues, BewertenFormValues } from "@/lib/schemas/uebungsaufgabe";

import { UebungsaufgabeCard } from "./uebungsaufgabe-card";
import { UebungsaufgabeForm } from "./uebungsaufgabe-form";
import { BewertenForm } from "./bewerten-form";

interface UebungsaufgabenManagerProps {
  klausurtage: Klausurtag[];
  initialThemen: Thema[];
  initialAufgaben: Uebungsaufgabe[];
  initialReviews: UebungsaufgabeReview[];
}

type StatusFilter = "alle" | UebungsaufgabenStatus;
type SortBy = "faellig" | "fach";

export function UebungsaufgabenManager({
  klausurtage,
  initialThemen,
  initialAufgaben,
  initialReviews,
}: UebungsaufgabenManagerProps) {
  const [aufgaben, setAufgaben] = useState<Uebungsaufgabe[]>(initialAufgaben);
  const [reviews, setReviews] = useState<UebungsaufgabeReview[]>(initialReviews);
  const [themen, setThemen] = useState<Thema[]>(initialThemen);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");
  const [fachFilter, setFachFilter] = useState<string>("alle");
  const [sortBy, setSortBy] = useState<SortBy>("faellig");

  const [formOpen, setFormOpen] = useState(false);
  const [editingAufgabe, setEditingAufgabe] = useState<Uebungsaufgabe | null>(null);

  const [bewertenOpen, setBewertenOpen] = useState(false);
  const [bewertendeAufgabe, setBewertendeAufgabe] = useState<Uebungsaufgabe | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Uebungsaufgabe | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const faecher = useMemo(() => klausurtage.flatMap((k) => k.faecher), [klausurtage]);

  async function handleThemaCreate(
    fachId: string,
    name: string
  ): Promise<{ error: string } | { thema: Thema }> {
    try {
      const result = await addThema(fachId, name);
      if ("error" in result) return result;
      setThemen((prev) => [...prev, result.thema]);
      return result;
    } catch {
      return { error: CONNECTION_ERROR };
    }
  }

  function openCreateForm() {
    setEditingAufgabe(null);
    setFormOpen(true);
  }

  function openEditForm(aufgabe: Uebungsaufgabe) {
    setEditingAufgabe(aufgabe);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: UebungsaufgabeFormValues): Promise<string | null> {
    try {
      if (editingAufgabe) {
        const result = await updateUebungsaufgabe(editingAufgabe.id, values);
        if ("error" in result) return result.error;
        setAufgaben((prev) => prev.map((a) => (a.id === editingAufgabe.id ? result.aufgabe : a)));
        return null;
      }

      const result = await createUebungsaufgabe(values);
      if ("error" in result) return result.error;
      setAufgaben((prev) => [result.aufgabe, ...prev]);
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function openBewertenForm(aufgabe: Uebungsaufgabe) {
    setBewertendeAufgabe(aufgabe);
    setBewertenOpen(true);
  }

  /**
   * Einzige Stelle, die eine Bewertung entgegennimmt (siehe Tech Design) —
   * berechnet `worst`, die nächste Pflicht-Wiederholung und protokolliert
   * die Bewertung unveränderlich in der Historie.
   */
  async function handleBewertenSubmit(values: BewertenFormValues): Promise<string | null> {
    if (!bewertendeAufgabe) return null;

    try {
      const result = await bewerteUebungsaufgabe(
        bewertendeAufgabe.id,
        Number(values.fachlich),
        Number(values.klausurtechnik),
        values.fehlernotiz
      );
      if ("error" in result) return result.error;

      setReviews((prev) => [...prev, result.review]);
      setAufgaben((prev) => prev.map((a) => (a.id === bewertendeAufgabe.id ? result.aufgabe : a)));
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function requestDelete(aufgabe: Uebungsaufgabe) {
    setDeleteError(null);
    setPendingDelete(aufgabe);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteUebungsaufgabe(pendingDelete.id);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setAufgaben((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setReviews((prev) => prev.filter((r) => r.uebungsaufgabeId !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setDeleteError(CONNECTION_ERROR);
    } finally {
      setIsDeleting(false);
    }
  }

  const gefiltert = aufgaben
    .filter((a) => {
      if (statusFilter === "alle") return true;
      return statusVon(a, letzteReviewVon(a.id, reviews)) === statusFilter;
    })
    .filter((a) => fachFilter === "alle" || a.fachId === fachFilter)
    .sort((a, b) => {
      if (sortBy === "fach") {
        const fachA = faecher.find((f) => f.id === a.fachId)?.name ?? "";
        const fachB = faecher.find((f) => f.id === b.fachId)?.name ?? "";
        const cmp = fachA.localeCompare(fachB, "de");
        if (cmp !== 0) return cmp;
      }
      const faelligA = a.pflichtWdhDatum ?? "9999-99-99";
      const faelligB = b.pflichtWdhDatum ?? "9999-99-99";
      return faelligA < faelligB ? -1 : faelligA > faelligB ? 1 : 0;
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {(Object.keys(STATUS_LABEL) as UebungsaufgabenStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fachFilter} onValueChange={setFachFilter}>
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Fächer</SelectItem>
            {faecher.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="faellig">Sortierung: Fällig</SelectItem>
            <SelectItem value="fach">Sortierung: Fach</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-ink-3">
          {gefiltert.length} {gefiltert.length === 1 ? "Aufgabe" : "Aufgaben"}
        </span>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </Button>
      </div>

      {gefiltert.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-foreground">Keine Übungsaufgaben</p>
          <p className="mt-1 text-xs text-ink-3">Für diesen Filter gibt es keine Aufgaben.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {gefiltert.map((aufgabe) => {
            const fach = faecher.find((f) => f.id === aufgabe.fachId);
            const themenNamen = aufgabe.themenIds
              .map((id) => themen.find((t) => t.id === id)?.name)
              .filter((n): n is string => !!n);
            return (
              <UebungsaufgabeCard
                key={aufgabe.id}
                aufgabe={aufgabe}
                reviews={reviews}
                fachName={fach?.name ?? "Unbekanntes Fach"}
                themenNamen={themenNamen}
                onBewertenRequest={() => openBewertenForm(aufgabe)}
                onEdit={() => openEditForm(aufgabe)}
                onDeleteRequest={() => requestDelete(aufgabe)}
              />
            );
          })}
        </div>
      )}

      <UebungsaufgabeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        klausurtage={klausurtage}
        themen={themen}
        editingAufgabe={editingAufgabe}
        onSubmit={handleFormSubmit}
        onThemaCreate={handleThemaCreate}
      />

      <BewertenForm
        open={bewertenOpen}
        onOpenChange={setBewertenOpen}
        aufgabe={bewertendeAufgabe}
        onSubmit={handleBewertenSubmit}
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
            <AlertDialogTitle>Übungsaufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Aufgabe inkl. ihrer gesamten Bewertungshistorie wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
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
