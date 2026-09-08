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
  createKlausur,
  deleteKlausur,
  markiereNachschreibenErledigt,
  updateKlausur,
} from "@/app/probeklausuren/actions";
import {
  CONNECTION_ERROR,
  STATUS_LABEL,
  faecherVon,
  statusVon,
  type Klausur,
  type KlausurStatus,
  type KlausurTeil,
} from "@/lib/klausuren";
import type { KlausurFormValues } from "@/lib/schemas/klausur";

import { KlausurCard } from "./klausur-card";
import { KlausurForm } from "./klausur-form";

interface ProbeklausurenManagerProps {
  klausurtage: Klausurtag[];
  initialThemen: Thema[];
  initialKlausuren: Klausur[];
  initialTeile: KlausurTeil[];
}

type StatusFilter = "alle" | KlausurStatus;

export function ProbeklausurenManager({
  klausurtage,
  initialThemen,
  initialKlausuren,
  initialTeile,
}: ProbeklausurenManagerProps) {
  const [klausuren, setKlausuren] = useState<Klausur[]>(initialKlausuren);
  const [teile, setTeile] = useState<KlausurTeil[]>(initialTeile);
  const [themen, setThemen] = useState<Thema[]>(initialThemen);

  const [fachFilter, setFachFilter] = useState<string>("alle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");

  const [formOpen, setFormOpen] = useState(false);
  const [editingKlausur, setEditingKlausur] = useState<Klausur | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Klausur | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const faecher = useMemo(() => klausurtage.flatMap((k) => k.faecher), [klausurtage]);

  function teileVon(klausurId: string): KlausurTeil[] {
    return teile.filter((t) => t.klausurId === klausurId);
  }

  function fachName(fachId: string): string {
    return faecher.find((f) => f.id === fachId)?.name ?? "Unbekanntes Fach";
  }

  function themenNamenVon(teil: KlausurTeil): string[] {
    return teil.themenIds
      .map((id) => themen.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n);
  }

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
    setEditingKlausur(null);
    setFormOpen(true);
  }

  function openEditForm(klausur: Klausur) {
    setEditingKlausur(klausur);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: KlausurFormValues): Promise<string | null> {
    try {
      if (editingKlausur) {
        const result = await updateKlausur(editingKlausur.id, values);
        if ("error" in result) return result.error;
        setKlausuren((prev) => prev.map((k) => (k.id === editingKlausur.id ? result.klausur : k)));
        setTeile((prev) => [
          ...prev.filter((t) => t.klausurId !== editingKlausur.id),
          ...result.teile,
        ]);
        return null;
      }

      const result = await createKlausur(values);
      if ("error" in result) return result.error;
      setKlausuren((prev) => [result.klausur, ...prev]);
      setTeile((prev) => [...prev, ...result.teile]);
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  async function handleNachschreibenErledigt(klausurId: string): Promise<string | null> {
    try {
      const result = await markiereNachschreibenErledigt(klausurId);
      if ("error" in result) return result.error;
      setKlausuren((prev) => prev.map((k) => (k.id === klausurId ? result.klausur : k)));
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  function requestDelete(klausur: Klausur) {
    setDeleteError(null);
    setPendingDelete(klausur);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteKlausur(pendingDelete.id);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setKlausuren((prev) => prev.filter((k) => k.id !== pendingDelete.id));
      setTeile((prev) => prev.filter((t) => t.klausurId !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setDeleteError(CONNECTION_ERROR);
    } finally {
      setIsDeleting(false);
    }
  }

  const gefiltert = klausuren
    .filter((k) => fachFilter === "alle" || faecherVon(teileVon(k.id)).includes(fachFilter))
    .filter((k) => statusFilter === "alle" || statusVon(teileVon(k.id)) === statusFilter)
    .sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
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

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {(Object.keys(STATUS_LABEL) as KlausurStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-ink-3">
          {gefiltert.length} {gefiltert.length === 1 ? "Klausur" : "Klausuren"}
        </span>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Neue Klausur
        </Button>
      </div>

      {gefiltert.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-foreground">Keine Probeklausuren</p>
          <p className="mt-1 text-xs text-ink-3">Für diesen Filter gibt es keine Klausuren.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {gefiltert.map((klausur) => (
            <KlausurCard
              key={klausur.id}
              klausur={klausur}
              teile={teileVon(klausur.id)}
              fachName={fachName}
              themenNamen={themenNamenVon}
              onNachschreibenErledigt={() => handleNachschreibenErledigt(klausur.id)}
              onEdit={() => openEditForm(klausur)}
              onDeleteRequest={() => requestDelete(klausur)}
            />
          ))}
        </div>
      )}

      <KlausurForm
        open={formOpen}
        onOpenChange={setFormOpen}
        klausurtage={klausurtage}
        themen={themen}
        editingKlausur={editingKlausur}
        editingTeile={editingKlausur ? teileVon(editingKlausur.id) : []}
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
            <AlertDialogTitle>Probeklausur löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Klausur inkl. aller Teile wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
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
