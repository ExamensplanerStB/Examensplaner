"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
import type { Klausurtag } from "@/lib/klausurtage";
import {
  neuesThemaSchema,
  type NeuesThemaFormValues,
} from "@/lib/schemas/thema";

interface NeuesThemaFormProps {
  klausurtage: Klausurtag[];
  onAdd: (fachId: string, name: string) => string | null;
}

export function NeuesThemaForm({ klausurtage, onAdd }: NeuesThemaFormProps) {
  const form = useForm<NeuesThemaFormValues>({
    resolver: zodResolver(neuesThemaSchema),
    defaultValues: { fachId: "", name: "" },
  });

  function onSubmit(values: NeuesThemaFormValues) {
    const error = onAdd(values.fachId, values.name);
    if (error) {
      form.setError("name", { type: "manual", message: error });
      return;
    }
    form.resetField("name");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
        noValidate
      >
        <FormField
          control={form.control}
          name="fachId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fach</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
                      {klausurtag.faecher.map((fach) => (
                        <SelectItem key={fach.id} value={fach.id}>
                          {fach.name}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Neues Thema</FormLabel>
              <FormControl>
                <Input placeholder="Themenname …" maxLength={100} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={!form.watch("name")?.trim() || !form.watch("fachId")}
        >
          Hinzufügen
        </Button>
      </form>
    </Form>
  );
}
