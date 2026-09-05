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
import { Textarea } from "@/components/ui/textarea";
import { ThemaFeld } from "@/components/thema-feld";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import { BEWERTUNG_OPTIONEN, TYP_OPTIONEN, type Karteikarte } from "@/lib/karteikarten";
import {
  karteikarteSchema,
  type KarteikarteFormValues,
} from "@/lib/schemas/karteikarte";

interface KarteikarteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  klausurtage: Klausurtag[];
  themen: Thema[];
  editingKarte: Karteikarte | null;
  onSubmit: (values: KarteikarteFormValues) => Promise<string | null>;
  onThemaCreate: (fachId: string, name: string) => Promise<{ error: string } | { thema: Thema }>;
}

function leereWerte(): KarteikarteFormValues {
  return { fachId: "", typ: "", themenIds: [], frage: "", bewertung: "3", quelle: "", fehlernotiz: "" };
}

function werteAusKarte(karte: Karteikarte): KarteikarteFormValues {
  return {
    fachId: karte.fachId,
    typ: karte.typ,
    themenIds: karte.themenIds,
    frage: karte.frage,
    bewertung: String(karte.bewertung) as KarteikarteFormValues["bewertung"],
    quelle: karte.quelle,
    fehlernotiz: karte.fehlernotiz,
  };
}

export function KarteikarteForm({
  open,
  onOpenChange,
  klausurtage,
  themen,
  editingKarte,
  onSubmit,
  onThemaCreate,
}: KarteikarteFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<KarteikarteFormValues>({
    resolver: zodResolver(karteikarteSchema),
    defaultValues: leereWerte(),
  });

  // Hält das zuletzt vom FORMULAR selbst gesetzte Fach fest (nicht das erste
  // Render-Fach), damit der Fach-Wechsel-Effekt unten ein `form.reset()` beim
  // Öffnen (Anlegen ODER Bearbeiten) nicht mit einer echten Nutzeränderung
  // verwechselt und dabei die vorausgefüllte Themenzuordnung leert.
  const vorherigesFachIdRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      const werte = editingKarte ? werteAusKarte(editingKarte) : leereWerte();
      form.reset(werte);
      vorherigesFachIdRef.current = werte.fachId;
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingKarte]);

  const fachId = form.watch("fachId");
  useEffect(() => {
    if (vorherigesFachIdRef.current !== fachId) {
      form.setValue("themenIds", []);
      vorherigesFachIdRef.current = fachId;
    }
  }, [fachId, form]);

  const fach = klausurtage.flatMap((k) => k.faecher).find((f) => f.id === fachId);
  const themenOptionen = themen.filter((t) => t.fachId === fachId);

  async function handleSubmit(values: KarteikarteFormValues) {
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
          <DialogTitle>{editingKarte ? "Karteikarte bearbeiten" : "Neue Karteikarte"}</DialogTitle>
          <DialogDescription>
            Fach, Typ, mindestens ein Thema und eine Frage sind erforderlich.
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
              <FormField
                control={form.control}
                name="typ"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ · Pflichtfeld</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Typ wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYP_OPTIONEN.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              name="frage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frage / Aufgabe</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={1000} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3.5">
              <FormField
                control={form.control}
                name="bewertung"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selbsteinschätzung</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BEWERTUNG_OPTIONEN.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quelle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quelle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Skript Kapitel 4"
                        maxLength={200}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fehlernotiz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fehleranalyse (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} maxLength={1000} disabled={isPending} {...field} />
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
                {editingKarte ? "Speichern" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
