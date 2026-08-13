import { z } from "zod";

export const themaNameSchema = z
  .string()
  .trim()
  .min(1, "Themenname ist erforderlich")
  .max(100, "Themenname darf maximal 100 Zeichen lang sein");

export const neuesThemaSchema = z.object({
  fachId: z.string().min(1, "Fach ist erforderlich"),
  name: themaNameSchema,
});

export type NeuesThemaFormValues = z.infer<typeof neuesThemaSchema>;
