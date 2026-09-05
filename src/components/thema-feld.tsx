"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Thema } from "@/lib/klausurtage";

/**
 * Wiederverwendbare Themen-Mehrfachauswahl (Chip-Eingabefeld mit
 * Inline-Neuanlage), etabliert in PROJ-3 und unverändert von PROJ-4/PROJ-5
 * zu übernehmen (siehe PROJ-2 Decision Log). Arbeitet auf Thema-IDs, nicht
 * auf Namenskopien — der Aufrufer reicht bereits nach Fach gefilterte
 * `options` herein.
 */
interface ThemaFeldProps {
  label?: string;
  fachName: string;
  options: Thema[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => Promise<{ error: string } | { thema: Thema }>;
  disabled?: boolean;
}

export function ThemaFeld({
  label = "Thema(en)",
  fachName,
  options,
  value,
  onChange,
  onCreate,
  disabled = false,
}: ThemaFeldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selected = options.filter((t) => value.includes(t.id));
  const trimmedQuery = query.trim();
  const queryLower = trimmedQuery.toLowerCase();

  const filtered = options
    .filter((t) => !value.includes(t.id))
    .filter((t) => !queryLower || t.name.toLowerCase().includes(queryLower))
    .sort((a, b) => {
      const aStarts = queryLower && a.name.toLowerCase().startsWith(queryLower) ? 0 : 1;
      const bStarts = queryLower && b.name.toLowerCase().startsWith(queryLower) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name, "de");
    });

  const existsExact =
    options.some((t) => t.name.toLowerCase() === queryLower) ||
    selected.some((t) => t.name.toLowerCase() === queryLower);
  const canCreate = !!trimmedQuery && !existsExact;
  const alreadySelectedExact = selected.some((t) => t.name.toLowerCase() === queryLower);
  const showEmpty = !!trimmedQuery && filtered.length === 0 && !canCreate;
  const showList = open && !disabled && (filtered.length > 0 || canCreate || showEmpty);

  function pick(thema: Thema) {
    if (!value.includes(thema.id)) onChange([...value, thema.id]);
    setQuery("");
    setHighlightIndex(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
    inputRef.current?.focus();
  }

  async function createNew(name: string) {
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    setError(null);
    const result = await onCreate(trimmed);
    setIsCreating(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (!value.includes(result.thema.id)) onChange([...value, result.thema.id]);
    setQuery("");
    setHighlightIndex(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && filtered[highlightIndex]) {
        pick(filtered[highlightIndex]);
      } else if (trimmedQuery) {
        const exact = options.find((t) => t.name.toLowerCase() === queryLower);
        if (exact) {
          if (!value.includes(exact.id)) pick(exact);
          else {
            setQuery("");
            setHighlightIndex(-1);
          }
        } else {
          createNew(query);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <div
        onMouseDown={(e) => {
          if (disabled) return;
          if (e.target === e.currentTarget) inputRef.current?.focus();
          setOpen(true);
        }}
        className={cn(
          "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 transition-colors",
          open ? "border-primary" : "border-input",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {selected.map((thema) => (
          <span
            key={thema.id}
            className="inline-flex h-[26px] items-center gap-1 rounded-full border border-primary pl-3 pr-1.5 text-sm font-medium text-primary"
            style={{ backgroundColor: "var(--brand-primary-tint)" }}
          >
            {thema.name}
            {!disabled && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  remove(thema.id);
                }}
                aria-label={`„${thema.name}“ entfernen`}
                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-primary hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => {
              setOpen(false);
              setHighlightIndex(-1);
            }, 130);
          }}
          placeholder={selected.length ? "Weiteres Thema …" : "Thema eintippen oder auswählen …"}
          className="h-[30px] min-w-[100px] flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          aria-label={label}
        />
      </div>

      {showList && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[232px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-pop">
          {!trimmedQuery && filtered.length > 0 && (
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-3">
              Themen in {fachName}
            </div>
          )}
          {filtered.map((thema, index) => (
            <div
              key={thema.id}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(thema);
              }}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-2 text-sm text-foreground hover:bg-accent",
                index === highlightIndex && "bg-accent"
              )}
            >
              {thema.name}
            </div>
          ))}
          {canCreate && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                createNew(query);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-accent",
                filtered.length > 0 && "border-t border-border"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {isCreating ? "Wird angelegt …" : `„${trimmedQuery}“ als neues Thema anlegen`}
            </div>
          )}
          {showEmpty && (
            <div className="px-2.5 py-2.5 text-xs text-ink-3">
              {alreadySelectedExact
                ? "Dieses Thema ist bereits ausgewählt."
                : "Keine passenden Themen."}
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
