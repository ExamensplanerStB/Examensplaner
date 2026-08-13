"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KLAUSURRELEVANZ_OPTIONEN,
  type Klausurrelevanz,
  type Thema,
} from "@/lib/klausurtage";
import { themaNameSchema } from "@/lib/schemas/thema";
import { cn } from "@/lib/utils";

const RELEVANZ_STYLES: Record<Klausurrelevanz, string> = {
  hoch: "border-transparent bg-primary text-primary-foreground",
  mittel: "border-transparent bg-secondary text-secondary-foreground",
  niedrig: "border-input bg-background text-muted-foreground",
};

interface ThemaChipProps {
  thema: Thema;
  onRename: (newName: string) => Promise<string | null>;
  onKlausurrelevanzChange: (value: Klausurrelevanz) => Promise<string | null>;
  onDeleteRequest: () => void;
}

export function ThemaChip({
  thema,
  onRename,
  onKlausurrelevanzChange,
  onDeleteRequest,
}: ThemaChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(thema.name);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [relevanzError, setRelevanzError] = useState<string | null>(null);
  const [isRelevanzSaving, setIsRelevanzSaving] = useState(false);

  function startEdit() {
    setDraftName(thema.name);
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  async function confirmEdit() {
    const parsed = themaNameSchema.safeParse(draftName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ungültiger Themenname");
      return;
    }
    setIsSaving(true);
    const renameError = await onRename(parsed.data);
    setIsSaving(false);
    if (renameError) {
      setError(renameError);
      return;
    }
    setIsEditing(false);
    setError(null);
  }

  async function handleKlausurrelevanzChange(value: Klausurrelevanz) {
    setIsRelevanzSaving(true);
    const relevanzErrorResult = await onKlausurrelevanzChange(value);
    setIsRelevanzSaving(false);
    setRelevanzError(relevanzErrorResult);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-surface py-1 pl-3 pr-1.5 text-sm">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={draftName}
              maxLength={100}
              disabled={isSaving}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              className="h-7 w-40 text-xs"
              aria-label={`„${thema.name}" umbenennen`}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={confirmEdit}
              disabled={isSaving}
              aria-label="Umbenennen bestätigen"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={cancelEdit}
              disabled={isSaving}
              aria-label="Umbenennen abbrechen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <span className="text-ink-1">{thema.name}</span>
            <button
              type="button"
              onClick={startEdit}
              aria-label={`„${thema.name}" umbenennen`}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-3 hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </>
        )}

        <Select
          value={thema.klausurrelevanz}
          onValueChange={(value) =>
            handleKlausurrelevanzChange(value as Klausurrelevanz)
          }
          disabled={isRelevanzSaving}
        >
          <SelectTrigger
            className={cn(
              "h-6 w-[5.5rem] rounded-full px-2 text-xs",
              RELEVANZ_STYLES[thema.klausurrelevanz]
            )}
            aria-label={`Klausurrelevanz für „${thema.name}"`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KLAUSURRELEVANZ_OPTIONEN.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-ink-3 hover:text-destructive"
          onClick={onDeleteRequest}
          aria-label={`„${thema.name}" löschen`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="pl-3 text-xs text-destructive">{error}</p>}
      {relevanzError && (
        <p className="pl-3 text-xs text-destructive">{relevanzError}</p>
      )}
    </div>
  );
}
