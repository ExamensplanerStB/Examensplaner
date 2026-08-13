"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { Klausurrelevanz, Klausurtag, Thema } from "@/lib/klausurtage";

import { NeuesThemaForm } from "./neues-thema-form";
import { ThemaChip } from "./thema-chip";

interface ThemenManagerProps {
  klausurtage: Klausurtag[];
}

export function ThemenManager({ klausurtage }: ThemenManagerProps) {
  const [themen, setThemen] = useState<Thema[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Thema | null>(null);

  const faecherById = new Map(
    klausurtage.flatMap((k) => k.faecher).map((fach) => [fach.id, fach])
  );

  function findDuplicate(fachId: string, name: string, excludeId?: string) {
    const normalized = name.trim().toLowerCase();
    return themen.find(
      (t) =>
        t.fachId === fachId &&
        t.id !== excludeId &&
        t.name.trim().toLowerCase() === normalized
    );
  }

  function addThema(fachId: string, name: string): string | null {
    const duplicate = findDuplicate(fachId, name);
    if (duplicate) {
      return `Dieses Thema existiert bereits in ${faecherById.get(fachId)?.name ?? "diesem Fach"}`;
    }
    setThemen((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fachId,
        name: name.trim(),
        klausurrelevanz: "mittel",
      },
    ]);
    return null;
  }

  function renameThema(id: string, newName: string): string | null {
    const thema = themen.find((t) => t.id === id);
    if (!thema) return null;
    const duplicate = findDuplicate(thema.fachId, newName, id);
    if (duplicate) {
      return `Dieses Thema existiert bereits in ${faecherById.get(thema.fachId)?.name ?? "diesem Fach"}`;
    }
    setThemen((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName.trim() } : t))
    );
    return null;
  }

  function changeKlausurrelevanz(id: string, value: Klausurrelevanz) {
    setThemen((prev) =>
      prev.map((t) => (t.id === id ? { ...t, klausurrelevanz: value } : t))
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setThemen((prev) => prev.filter((t) => t.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="space-y-8">
      <NeuesThemaForm klausurtage={klausurtage} onAdd={addThema} />

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
                            onRename={(newName) => renameThema(thema.id, newName)}
                            onKlausurrelevanzChange={(value) =>
                              changeKlausurrelevanz(thema.id, value)
                            }
                            onDeleteRequest={() => setPendingDelete(thema)}
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
          if (!open) setPendingDelete(null);
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
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
