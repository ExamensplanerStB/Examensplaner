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
import { cn } from "@/lib/utils";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import { addThema } from "@/app/themen/actions";
import {
  bewerteKarteikarte,
  createKarteikarte,
  deleteKarteikarte,
  updateKarteikarte,
} from "@/app/karteikarten/actions";
import { CONNECTION_ERROR, type Bewertung, type Karteikarte, type KarteikartenTyp } from "@/lib/karteikarten";
import type { KarteikarteFormValues } from "@/lib/schemas/karteikarte";

import { KarteikarteCard } from "./karteikarte-card";
import { KarteikarteForm } from "./karteikarte-form";
import { Fokuseinheit } from "./fokuseinheit";

interface KarteikartenManagerProps {
  klausurtage: Klausurtag[];
  initialThemen: Thema[];
  initialKarten: Karteikarte[];
}

type TypFilter = "alle" | KarteikartenTyp;
type SortBy = "faellig" | "fach";

export function KarteikartenManager({
  klausurtage,
  initialThemen,
  initialKarten,
}: KarteikartenManagerProps) {
  const [karten, setKarten] = useState<Karteikarte[]>(initialKarten);
  const [themen, setThemen] = useState<Thema[]>(initialThemen);

  const [typFilter, setTypFilter] = useState<TypFilter>("alle");
  const [fachFilter, setFachFilter] = useState<string>("alle");
  const [sortBy, setSortBy] = useState<SortBy>("faellig");

  const [formOpen, setFormOpen] = useState(false);
  const [editingKarte, setEditingKarte] = useState<Karteikarte | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Karteikarte | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [fokuseinheitOpen, setFokuseinheitOpen] = useState(false);

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

  /**
   * Einzige Stelle, die eine Selbsteinschätzung entgegennimmt — genutzt von
   * der Listenansicht und der Fokuseinheit (das Bearbeiten-Formular ruft bei
   * geänderter Bewertung serverseitig dieselbe Server Action auf, siehe
   * `updateKarteikarte`), damit alle Einstiegspunkte identisch rechnen.
   *
   * try/catch fängt hier auch einen Netzwerkfehler beim Aufruf der Server
   * Action selbst ab (nicht nur Fehler, die die Action serverseitig
   * zurückgibt) — ohne das bliebe der Lade-Zustand des Aufrufers für immer
   * hängen (siehe QA BUG-1).
   */
  async function bewerten(
    karteId: string,
    bewertung: Bewertung,
    neueFehlernotiz?: string
  ): Promise<string | null> {
    try {
      const result = await bewerteKarteikarte(karteId, bewertung, neueFehlernotiz);
      if ("error" in result) return result.error;
      setKarten((prev) => prev.map((k) => (k.id === karteId ? result.karte : k)));
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function openCreateForm() {
    setEditingKarte(null);
    setFormOpen(true);
  }

  function openEditForm(karte: Karteikarte) {
    setEditingKarte(karte);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: KarteikarteFormValues): Promise<string | null> {
    try {
      if (editingKarte) {
        const result = await updateKarteikarte(editingKarte.id, values);
        if ("error" in result) return result.error;
        setKarten((prev) => prev.map((k) => (k.id === editingKarte.id ? result.karte : k)));
        return null;
      }

      const result = await createKarteikarte(values);
      if ("error" in result) return result.error;
      setKarten((prev) => [result.karte, ...prev]);
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function requestDelete(karte: Karteikarte) {
    setDeleteError(null);
    setPendingDelete(karte);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteKarteikarte(pendingDelete.id);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setKarten((prev) => prev.filter((k) => k.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setDeleteError(CONNECTION_ERROR);
    } finally {
      setIsDeleting(false);
    }
  }

  const gefiltert = karten
    .filter((k) => typFilter === "alle" || k.typ === typFilter)
    .filter((k) => fachFilter === "alle" || k.fachId === fachFilter)
    .sort((a, b) => {
      if (sortBy === "fach") {
        const fachA = faecher.find((f) => f.id === a.fachId)?.name ?? "";
        const fachB = faecher.find((f) => f.id === b.fachId)?.name ?? "";
        const cmp = fachA.localeCompare(fachB, "de");
        if (cmp !== 0) return cmp;
      }
      return a.wdhDatum < b.wdhDatum ? -1 : a.wdhDatum > b.wdhDatum ? 1 : 0;
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-secondary p-0.5">
          {(
            [
              { value: "alle", label: "Alle" },
              { value: "theorie", label: "Theorie" },
              { value: "klausurtechnik", label: "Klausurtechnik" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypFilter(opt.value)}
              className={cn(
                "h-[30px] rounded-full px-3.5 text-xs font-semibold transition-colors",
                typFilter === opt.value ? "bg-background text-foreground shadow-sm" : "text-ink-2"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

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
          {gefiltert.length} {gefiltert.length === 1 ? "Karte" : "Karten"}
        </span>
        <Button type="button" variant="outline" onClick={() => setFokuseinheitOpen(true)}>
          Fokuseinheit starten
        </Button>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Neue Karteikarte
        </Button>
      </div>

      {gefiltert.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-foreground">Keine Karten</p>
          <p className="mt-1 text-xs text-ink-3">Für diesen Filter gibt es keine Karteikarten.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {gefiltert.map((karte) => {
            const fach = faecher.find((f) => f.id === karte.fachId);
            const themenNamen = karte.themenIds
              .map((id) => themen.find((t) => t.id === id)?.name)
              .filter((n): n is string => !!n);
            return (
              <KarteikarteCard
                key={karte.id}
                karte={karte}
                fachName={fach?.name ?? "Unbekanntes Fach"}
                themenNamen={themenNamen}
                onBewerten={(bewertung) => bewerten(karte.id, bewertung)}
                onEdit={() => openEditForm(karte)}
                onDeleteRequest={() => requestDelete(karte)}
              />
            );
          })}
        </div>
      )}

      <KarteikarteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        klausurtage={klausurtage}
        themen={themen}
        editingKarte={editingKarte}
        onSubmit={handleFormSubmit}
        onThemaCreate={handleThemaCreate}
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
            <AlertDialogTitle>Karteikarte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Karteikarte wirklich löschen? Diese Aktion kann nicht rückgängig
              gemacht werden.
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

      {fokuseinheitOpen && (
        <Fokuseinheit
          karten={karten}
          klausurtage={klausurtage}
          themen={themen}
          onBewerten={bewerten}
          onClose={() => setFokuseinheitOpen(false)}
        />
      )}
    </div>
  );
}
