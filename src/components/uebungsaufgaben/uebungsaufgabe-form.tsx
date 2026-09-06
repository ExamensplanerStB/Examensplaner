"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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
import { ThemaFeld } from "@/components/thema-feld";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import type { Uebungsaufgabe } from "@/lib/uebungsaufgaben";
import {
  uebungsaufgabeSchema,
  type UebungsaufgabeFormValues,
} from "@/lib/schemas/uebungsaufgabe";

interface UebungsaufgabeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  klausurtage: Klausurtag[];
  themen: Thema[];
  editingAufgabe: Uebungsaufgabe | null;
  onSubmit: (values: UebungsaufgabeFormValues) => Promise<string | null>;
  onThemaCreate: (fachId: string, name: string) => Promise<{ error: string } | { thema: Thema }>;
}

function leereWerte(): UebungsaufgabeFormValues {
  return { fachId: "", themenIds: [], titel: "", quelle: "" };
}

function werteAusAufgabe(aufgabe: Uebungsaufgabe): UebungsaufgabeFormValues {
  return {
    fachId: aufgabe.fachId,
    themenIds: aufgabe.themenIds,
    titel: aufgabe.titel,
    quelle: aufgabe.quelle,
  };
}

export function UebungsaufgabeForm({
  open,
  onOpenChange,
  klausurtage,
  themen,
  editingAufgabe,
  onSubmit,
  onThemaCreate,
}: UebungsaufgabeFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<UebungsaufgabeFormValues>({
    resolver: zodResolver(uebungsaufgabeSchema),
    defaultValues: leereWerte(),
  });

  // Siehe KarteikarteForm: hält das zuletzt vom Formular selbst gesetzte Fach
  // fest, damit form.reset() beim Öffnen nicht als Nutzeränderung missverstanden
  // wird und die vorausgefüllte Themenzuordnung leert.
  const vorherigesFachIdRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      const werte = editingAufgabe ? werteAusAufgabe(editingAufgabe) : leereWerte();
      form.reset(werte);
      vorherigesFachIdRef.current = werte.fachId;
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingAufgabe]);

  const fachId = form.watch("fachId");
  useEffect(() => {
    if (vorherigesFachIdRef.current !== fachId) {
      form.setValue("themenIds", []);
      vorherigesFachIdRef.current = fachId;
    }
  }, [fachId, form]);

  const fach = klausurtage.flatMap((k) => k.faecher).find((f) => f.id === fachId);
  const themenOptionen = themen.filter((t) => t.fachId === fachId);

  async function handleSubmit(values: UebungsaufgabeFormValues) {
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
          <DialogTitle>
            {editingAufgabe ? "Übungsaufgabe bearbeiten" : "Neue Übungsaufgabe"}
          </DialogTitle>
          <DialogDescription>
            Fach, mindestens ein Thema und ein Titel sind erforderlich. Die Bewertung erfolgt
            danach separat über „Bewerten".
          </DialogDescription>
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
              name="fachId"
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

            {fachId ? (
              <FormField
                control={form.control}
                name="themenIds"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ThemaFeld
                        label="Thema(en)"
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
              <p className="text-xs text-ink-3">Wähle zuerst ein Fach, um Themen zuzuordnen.</p>
            )}

            <FormField
              control={form.control}
              name="titel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Verjährung bei vGA, Fall 3"
                      maxLength={300}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quelle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quelle (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Aufgabenbuch XY, S. 42"
                      maxLength={200}
                      disabled={isPending}
                      {...field}
                    />
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
                {editingAufgabe ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
