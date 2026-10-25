import { z } from 'zod';
export declare const setupWizardSchema: z.ZodObject<{
    productName: z.ZodString;
    companyName: z.ZodString;
    tagline: z.ZodOptional<z.ZodString>;
    adminUsername: z.ZodString;
    adminEmail: z.ZodString;
    adminPassword: z.ZodString;
    adminFullName: z.ZodString;
    themePreset: z.ZodDefault<z.ZodEnum<["soft_light", "enterprise", "dark", "compact"]>>;
}, "strip", z.ZodTypeAny, {
    productName: string;
    companyName: string;
    adminUsername: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
    themePreset: "soft_light" | "enterprise" | "dark" | "compact";
    tagline?: string | undefined;
}, {
    productName: string;
    companyName: string;
    adminUsername: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
    tagline?: string | undefined;
    themePreset?: "soft_light" | "enterprise" | "dark" | "compact" | undefined;
}>;
export type SetupWizardInput = z.infer<typeof setupWizardSchema>;
