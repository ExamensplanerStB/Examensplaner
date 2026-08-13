"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Klausurrelevanz, Klausurtag, Thema } from "@/lib/klausurtage";

import { addThema, changeKlausurrelevanz, deleteThema, renameThema } from "@/app/themen/actions";
import { NeuesThemaForm } from "./neues-thema-form";
import { ThemaChip } from "./thema-chip";

interface ThemenManagerProps {
  klausurtage: Klausurtag[];
  initialThemen: Thema[];
}

export function ThemenManager({ klausurtage, initialThemen }: ThemenManagerProps) {
  const [themen, setThemen] = useState<Thema[]>(initialThemen);
  const [pendingDelete, setPendingDelete] = useState<Thema | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleAdd(fachId: string, name: string): Promise<string | null> {
    const result = await addThema(fachId, name);
    if ("error" in result) return result.error;
    setThemen((prev) => [...prev, result.thema]);
    return null;
  }

  async function handleRename(id: string, newName: string): Promise<string | null> {
    const result = await renameThema(id, newName);
    if ("error" in result) return result.error;
    setThemen((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName.trim() } : t))
    );
    return null;
  }

  async function handleKlausurrelevanzChange(
    id: string,
    value: Klausurrelevanz
  ): Promise<string | null> {
    const result = await changeKlausurrelevanz(id, value);
    if ("error" in result) return result.error;
    setThemen((prev) =>
      prev.map((t) => (t.id === id ? { ...t, klausurrelevanz: value } : t))
    );
    return null;
  }

  function requestDelete(thema: Thema) {
    setDeleteError(null);
    setPendingDelete(thema);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const result = await deleteThema(pendingDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      setDeleteError(result.error);
      return;
    }
    setThemen((prev) => prev.filter((t) => t.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="space-y-8">
      <NeuesThemaForm klausurtage={klausurtage} onAdd={handleAdd} />

      <div className="space-y-8">
        {klausurtage.map((klausurtag) => (
          <section key={klausurtag.tag} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="rounded-md px-1.5 py-0.5 text-[10px]">
                K{klausurtag.tag}
              </Badge>
              <h2 className="text-lg text-foreground">{klausurtag.titel}</h2>
            </div>
            <div className="space-y-5 pl-1">
              {klausurtag.faecher.map((fach) => {
                const fachThemen = themen.filter((t) => t.fachId === fach.id);
                return (
                  <div key={fach.id}>
                    <h3 className="mb-2 text-sm font-semibold text-ink-2">
                      {fach.name}
                    </h3>
                    {fachThemen.length === 0 ? (
                      <p className="text-xs text-ink-3">Noch keine Themen</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fachThemen.map((thema) => (
                          <ThemaChip
                            key={thema.id}
                            thema={thema}
                            onRename={(newName) => handleRename(thema.id, newName)}
                            onKlausurrelevanzChange={(value) =>
                              handleKlausurrelevanzChange(thema.id, value)
                            }
                            onDeleteRequest={() => requestDelete(thema)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

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
            <AlertDialogTitle>Thema löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du „{pendingDelete?.name}" wirklich löschen? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
