"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  PRIORITAET_FARBE,
  PRIORITAET_LABEL,
  istUeberfaellig,
  kategorieVon,
  kurzerText,
  zeitAnzeige,
  type Aufgabe,
  type EigeneKategorie,
} from "@/lib/aufgaben";

interface AufgabeZeileProps {
  aufgabe: Aufgabe;
  eigeneKategorien: EigeneKategorie[];
  istLetzte: boolean;
  onToggleErledigt: () => Promise<string | null>;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export function AufgabeZeile({
  aufgabe,
  eigeneKategorien,
  istLetzte,
  onToggleErledigt,
  onEdit,
  onDeleteRequest,
}: AufgabeZeileProps) {
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const kategorie = kategorieVon(aufgabe, eigeneKategorien);
  const ueberfaellig = istUeberfaellig(aufgabe);
  const zeit = zeitAnzeige(aufgabe);

  async function handleToggle() {
    setIsToggling(true);
    const error = await onToggleErledigt();
    setIsToggling(false);
    setToggleError(error);
  }

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", !istLetzte && "border-b border-border")}>
      <Checkbox
        checked={aufgabe.erledigt}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        aria-label={
          aufgabe.erledigt
            ? `„${kurzerText(aufgabe.titel)}“ als offen markieren`
            : `„${kurzerText(aufgabe.titel)}“ als erledigt markieren`
        }
      />

      <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit} title="Zum Bearbeiten klicken">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              aufgabe.erledigt ? "text-ink-3 line-through" : "text-foreground"
            )}
          >
            {aufgabe.titel}
          </span>
          {kategorie && (
            <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap text-xs text-ink-3">
              <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: kategorie.farbe }} />
              {kategorie.label}
            </span>
          )}
        </div>
        {zeit && (
          <p className={cn("mt-0.5 text-xs", ueberfaellig ? "font-semibold text-ampel-red" : "text-ink-3")}>
            {ueberfaellig ? "Überfällig · " : ""}
            {zeit}
          </p>
        )}
        {toggleError && (
          <p className="mt-0.5 text-xs text-destructive" role="alert">
            {toggleError}
          </p>
        )}
      </div>

      {aufgabe.prioritaet !== "keine" && (
        <span
          className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap text-xs font-semibold"
          style={{ color: PRIORITAET_FARBE[aufgabe.prioritaet] }}
        >
          <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: PRIORITAET_FARBE[aufgabe.prioritaet] }} />
          {PRIORITAET_LABEL[aufgabe.prioritaet]}
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-none text-ink-3 hover:text-destructive"
        onClick={onDeleteRequest}
        aria-label={`„${kurzerText(aufgabe.titel)}“ löschen`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
