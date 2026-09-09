"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  KATEGORIE_FEST_OPTIONEN,
  KATEGORIE_PALETTE,
  PRIORITAET_OPTIONEN,
  PRIORITAET_FARBE,
  PRIORITAET_TINT,
  type Aufgabe,
  type EigeneKategorie,
} from "@/lib/aufgaben";
import { aufgabeSchema, type AufgabeFormValues } from "@/lib/schemas/aufgabe";

interface AufgabeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eigeneKategorien: EigeneKategorie[];
  editingAufgabe: Aufgabe | null;
  onSubmit: (values: AufgabeFormValues) => Promise<string | null>;
  onEigeneKategorieCreate: (
    name: string,
    farbe: string
  ) => Promise<{ error: string } | { kategorie: EigeneKategorie }>;
}

function kategorieWertVon(aufgabe: Aufgabe | null): string {
  if (!aufgabe) return "keine";
  if (aufgabe.kategorieFest) return `fest:${aufgabe.kategorieFest}`;
  if (aufgabe.eigeneKategorieId) return `eigene:${aufgabe.eigeneKategorieId}`;
  return "keine";
}

function leereWerte(): AufgabeFormValues {
  return {
    titel: "",
    datum: "",
    zeittyp: "",
    startZeit: "09:00",
    endZeit: "10:00",
    kategorie: "keine",
    prioritaet: "keine",
    imKalender: true,
  };
}

function werteAusAufgabe(aufgabe: Aufgabe): AufgabeFormValues {
  return {
    titel: aufgabe.titel,
    datum: aufgabe.datum ?? "",
    zeittyp: aufgabe.zeittyp ?? "",
    startZeit: aufgabe.startZeit ?? "09:00",
    endZeit: aufgabe.endZeit ?? "10:00",
    kategorie: kategorieWertVon(aufgabe),
    prioritaet: aufgabe.prioritaet,
    imKalender: aufgabe.imKalender,
  };
}

export function AufgabeForm({
  open,
  onOpenChange,
  eigeneKategorien,
  editingAufgabe,
  onSubmit,
  onEigeneKategorieCreate,
}: AufgabeFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [kategorieAnlegenOffen, setKategorieAnlegenOffen] = useState(false);
  const [neueKategorieName, setNeueKategorieName] = useState("");
  const [neueKategorieFarbe, setNeueKategorieFarbe] = useState(KATEGORIE_PALETTE[0].farbe);
  const [kategorieError, setKategorieError] = useState<string | null>(null);
  const [isKategorieAnlegen, setIsKategorieAnlegen] = useState(false);

  const form = useForm<AufgabeFormValues>({
    resolver: zodResolver(aufgabeSchema),
    defaultValues: leereWerte(),
  });

  useEffect(() => {
    if (open) {
      form.reset(editingAufgabe ? werteAusAufgabe(editingAufgabe) : leereWerte());
      setServerError(null);
      setKategorieAnlegenOffen(false);
      setNeueKategorieName("");
      setKategorieError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingAufgabe]);

  const datum = form.watch("datum");
  const zeittyp = form.watch("zeittyp");

  // Zeittyp ist ohne Datum bedeutungslos: wird beim Entfernen des Datums
  // zurückgesetzt und beim erstmaligen Setzen eines Datums auf "ganztag"
  // vorbelegt (siehe Spezifikation, Abschnitt "Anlegen").
  useEffect(() => {
    if (!datum) {
      form.setValue("zeittyp", "");
    } else if (!zeittyp) {
      form.setValue("zeittyp", "ganztag");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datum]);

  async function handleKategorieAnlegen() {
    const name = neueKategorieName.trim();
    if (!name || isKategorieAnlegen) return;
    setIsKategorieAnlegen(true);
    setKategorieError(null);
    const result = await onEigeneKategorieCreate(name, neueKategorieFarbe);
    setIsKategorieAnlegen(false);
    if ("error" in result) {
      setKategorieError(result.error);
      return;
    }
    form.setValue("kategorie", `eigene:${result.kategorie.id}`);
    setKategorieAnlegenOffen(false);
    setNeueKategorieName("");
  }

  async function handleSubmit(values: AufgabeFormValues) {
    setIsPending(true);
    setServerError(null);
    const error = await onSubmit(values);
    setIsPending(false);
    if (error) {
      setServerError(error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAufgabe ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle>
          <DialogDescription>Nur ein Titel ist erforderlich — alles andere ist optional.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}

            <FormField
              control={form.control}
              name="titel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Wiederholung USt-Fälle"
                      maxLength={200}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3.5">
              <FormField
                control={form.control}
                name="datum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kategorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="keine">Keine Kategorie</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Feste Kategorien</SelectLabel>
                          {KATEGORIE_FEST_OPTIONEN.map((option) => (
                            <SelectItem key={option.value} value={`fest:${option.value}`}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {eigeneKategorien.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>Eigene Kategorien</SelectLabel>
                            {eigeneKategorien.map((kategorie) => (
                              <SelectItem key={kategorie.id} value={`eigene:${kategorie.id}`}>
                                {kategorie.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setKategorieAnlegenOffen((v) => !v)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Eigene Kategorie anlegen
              </button>

              {kategorieAnlegenOffen && (
                <div className="mt-2 space-y-3 rounded-lg bg-secondary p-3.5">
                  <Input
                    placeholder="z.B. Repetitorium"
                    maxLength={60}
                    value={neueKategorieName}
                    onChange={(e) => setNeueKategorieName(e.target.value)}
                    disabled={isKategorieAnlegen}
                    aria-label="Name der neuen Kategorie"
                  />
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">Farbe</p>
                    <div className="flex flex-wrap gap-2">
                      {KATEGORIE_PALETTE.map((farbe) => (
                        <button
                          key={farbe.farbe}
                          type="button"
                          title={farbe.name}
                          aria-label={`Farbe ${farbe.name} wählen`}
                          onClick={() => setNeueKategorieFarbe(farbe.farbe)}
                          disabled={isKategorieAnlegen}
                          className={cn(
                            "h-[26px] w-[26px] rounded-full ring-2 ring-offset-2 ring-offset-secondary transition-shadow",
                            neueKategorieFarbe === farbe.farbe ? "ring-foreground" : "ring-transparent"
                          )}
                          style={{ backgroundColor: farbe.farbe }}
                        />
                      ))}
                    </div>
                  </div>
                  {kategorieError && (
                    <p className="text-xs text-destructive" role="alert">
                      {kategorieError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setKategorieAnlegenOffen(false)}
                      disabled={isKategorieAnlegen}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleKategorieAnlegen}
                      disabled={isKategorieAnlegen || !neueKategorieName.trim()}
                    >
                      {isKategorieAnlegen && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Kategorie anlegen
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="prioritaet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorität</FormLabel>
                  <div className="flex gap-1.5">
                    {PRIORITAET_OPTIONEN.map((option) => {
                      const ausgewaehlt = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          disabled={isPending}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-semibold transition-colors",
                            ausgewaehlt ? "border-transparent" : "border-input text-ink-2"
                          )}
                          style={
                            ausgewaehlt
                              ? { backgroundColor: PRIORITAET_TINT[option.value], color: PRIORITAET_FARBE[option.value] }
                              : undefined
                          }
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PRIORITAET_FARBE[option.value] }}
                          />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imKalender"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3 space-y-0 rounded-lg bg-secondary p-3.5">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-semibold">Im Kalender anzeigen</FormLabel>
                    <p className="text-xs text-ink-3">
                      Aufgabe erscheint zusätzlich im späteren Wochenkalender (PROJ-9)
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                  </FormControl>
                </FormItem>
              )}
            />

            {datum && (
              <>
                <FormField
                  control={form.control}
                  name="zeittyp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zeittyp</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "ganztag"}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ganztag">Ganztägig</SelectItem>
                          <SelectItem value="zeitslot">Zeitslot</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {zeittyp === "zeitslot" && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <FormField
                      control={form.control}
                      name="startZeit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Startzeit</FormLabel>
                          <FormControl>
                            <Input type="time" disabled={isPending} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endZeit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endzeit</FormLabel>
                          <FormControl>
                            <Input type="time" disabled={isPending} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingAufgabe ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
