"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BEWERTUNG_OPTIONEN, type Uebungsaufgabe } from "@/lib/uebungsaufgaben";
import {
  bewertenSchema,
  type BewertenFormValues,
} from "@/lib/schemas/uebungsaufgabe";

interface BewertenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aufgabe: Uebungsaufgabe | null;
  onSubmit: (values: BewertenFormValues) => Promise<string | null>;
}

function leereWerte(): BewertenFormValues {
  return { fachlich: "3", klausurtechnik: "3", fehlernotiz: "" };
}

export function BewertenForm({ open, onOpenChange, aufgabe, onSubmit }: BewertenFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<BewertenFormValues>({
    resolver: zodResolver(bewertenSchema),
    defaultValues: leereWerte(),
  });

  useEffect(() => {
    if (open) {
      form.reset(leereWerte());
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, aufgabe]);

  async function handleSubmit(values: BewertenFormValues) {
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
          <DialogTitle>„{aufgabe?.titel}" bewerten</DialogTitle>
          <DialogDescription>
            Fachlich und Klausurtechnik werden unabhängig voneinander bewertet — der
            niedrigere der beiden Werte bestimmt die weitere Wiederholung.
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
                name="fachlich"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fachlich</FormLabel>
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
                name="klausurtechnik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klausurtechnik</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="fehlernotiz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fehlernotiz (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={1000} disabled={isPending} {...field} />
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
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
