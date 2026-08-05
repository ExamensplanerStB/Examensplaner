import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .pipe(z.email("Ungültige E-Mail-Adresse")),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
