"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { ThemaFeld } from "@/components/thema-feld";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import {
  klausurSchema,
  type KlausurFormValues,
  type TeilFormValues,
} from "@/lib/schemas/klausur";

interface KlausurFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  klausurtage: Klausurtag[];
  themen: Thema[];
  editingKlausur: Klausur | null;
  editingTeile: KlausurTeil[];
  onSubmit: (values: KlausurFormValues) => Promise<string | null>;
  onThemaCreate: (fachId: string, name: string) => Promise<{ error: string } | { thema: Thema }>;
}

function leererTeil(): TeilFormValues {
  return { fachId: "", themenIds: [], maxPunkte: "", erreichtePunkte: "" };
}

function leereWerte(): KlausurFormValues {
  return {
    bezeichnung: "",
    datum: "",
    quelle: "",
    note: "",
    stufe1Text: "",
    stufe2Text: "",
    teile: [leererTeil()],
  };
}

function werteAusKlausur(klausur: Klausur, teile: KlausurTeil[]): KlausurFormValues {
  return {
    bezeichnung: klausur.bezeichnung,
    datum: klausur.datum,
    quelle: klausur.quelle,
    note: klausur.note,
    stufe1Text: klausur.stufe1Text,
    stufe2Text: klausur.stufe2Text,
    teile: teile.map((t) => ({
      fachId: t.fachId,
      themenIds: t.themenIds,
      maxPunkte: t.maxPunkte === null ? "" : String(t.maxPunkte),
      erreichtePunkte: t.erreichtePunkte === null ? "" : String(t.erreichtePunkte),
    })),
  };
}

interface TeilFormRowProps {
  index: number;
  form: UseFormReturn<KlausurFormValues>;
  klausurtage: Klausurtag[];
  themen: Thema[];
  onThemaCreate: (fachId: string, name: string) => Promise<{ error: string } | { thema: Thema }>;
  onRemove: () => void;
  removeDisabled: boolean;
  isPending: boolean;
}

function TeilFormRow({
  index,
  form,
  klausurtage,
  themen,
  onThemaCreate,
  onRemove,
  removeDisabled,
  isPending,
}: TeilFormRowProps) {
  // Siehe KarteikarteForm/UebungsaufgabeForm: hält das zuletzt vom Formular
  // selbst gesetzte Fach dieses Teils fest, damit form.reset() beim Öffnen
  // nicht als Nutzeränderung missverstanden wird.
  const vorherigesFachIdRef = useRef<string>(form.getValues(`teile.${index}.fachId`));
  const fachId = form.watch(`teile.${index}.fachId`);

  useEffect(() => {
    if (vorherigesFachIdRef.current !== fachId) {
      form.setValue(`teile.${index}.themenIds`, []);
      vorherigesFachIdRef.current = fachId;
    }
  }, [fachId, form, index]);

  const fach = klausurtage.flatMap((k) => k.faecher).find((f) => f.id === fachId);
  const themenOptionen = themen.filter((t) => t.fachId === fachId);

  return (
    <div className="space-y-3 rounded-lg border border-border p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 grid-cols-2 gap-3.5">
          <FormField
            control={form.control}
            name={`teile.${index}.fachId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fach</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Fach wählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {klausurtage.map((klausurtag) => (
                      <SelectGroup key={klausurtag.tag}>
                        <SelectLabel>
                          K{klausurtag.tag} · {klausurtag.titel}
                        </SelectLabel>
                        {klausurtag.faecher.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3.5">
            <FormField
              control={form.control}
              name={`teile.${index}.maxPunkte`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max-Punkte</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="z.B. 20" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`teile.${index}.erreichtePunkte`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erreichte Punkte</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="z.B. 12" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-6 h-9 w-9 text-ink-3 hover:text-destructive"
          onClick={onRemove}
          disabled={removeDisabled}
          aria-label="Teil entfernen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {fachId ? (
        <FormField
          control={form.control}
          name={`teile.${index}.themenIds`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ThemaFeld
                  label="Thema(en) — optional"
                  fachName={fach?.name ?? "diesem Fach"}
                  options={themenOptionen}
                  value={field.value}
                  onChange={field.onChange}
                  onCreate={(name) => onThemaCreate(fachId, name)}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <p className="text-xs text-ink-3">Wähle zuerst ein Fach, um optional Themen zuzuordnen.</p>
      )}
    </div>
  );
}

export function KlausurForm({
  open,
  onOpenChange,
  klausurtage,
  themen,
  editingKlausur,
  editingTeile,
  onSubmit,
  onThemaCreate,
}: KlausurFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<KlausurFormValues>({
    resolver: zodResolver(klausurSchema),
    defaultValues: leereWerte(),
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "teile" });

  useEffect(() => {
    if (open) {
      const werte = editingKlausur ? werteAusKlausur(editingKlausur, editingTeile) : leereWerte();
      form.reset(werte);
      // form.reset() allein synchronisiert das Feld-Array von useFieldArray
      // nicht zuverlässig (bekannte react-hook-form-Eigenheit) — replace()
      // ist die dafür vorgesehene Funktion, sonst verdoppeln sich die Teile
      // beim ersten Öffnen des Dialogs.
      replace(werte.teile);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingKlausur]);

  async function handleSubmit(values: KlausurFormValues) {
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingKlausur ? "Probeklausur bearbeiten" : "Neue Probeklausur"}</DialogTitle>
          <DialogDescription>
            Bezeichnung, Datum und mindestens ein Teil (mit Fach) sind erforderlich. Punkte und
            Note können jederzeit später ergänzt werden.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <FormField
                control={form.control}
                name="bezeichnung"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bezeichnung</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. ErbSt-02" maxLength={200} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="datum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quelle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quelle (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Fallsammlung 3.2"
                      maxLength={200}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Teile</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(leererTeil())}
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Teil hinzufügen
                </Button>
              </div>

              {fields.map((field, index) => (
                <TeilFormRow
                  key={field.id}
                  index={index}
                  form={form}
                  klausurtage={klausurtage}
                  themen={themen}
                  onThemaCreate={onThemaCreate}
                  onRemove={() => remove(index)}
                  removeDisabled={fields.length <= 1 || isPending}
                  isPending={isPending}
                />
              ))}
              {form.formState.errors.teile?.message && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.teile.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. 4,5" maxLength={50} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stufe1Text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stufe 1 – Fachliche Nacharbeit (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} maxLength={2000} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stufe2Text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stufe 2 – Analytische Nacharbeit (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} maxLength={2000} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingKlausur ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
