import { z } from 'zod';
export declare const updateBrandingSchema: z.ZodObject<{
    productName: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    footerText: z.ZodOptional<z.ZodString>;
    logoLightUrl: z.ZodOptional<z.ZodString>;
    logoDarkUrl: z.ZodOptional<z.ZodString>;
    faviconUrl: z.ZodOptional<z.ZodString>;
    loginBackgroundUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productName?: string | undefined;
    companyName?: string | undefined;
    tagline?: string | undefined;
    footerText?: string | undefined;
    logoLightUrl?: string | undefined;
    logoDarkUrl?: string | undefined;
    faviconUrl?: string | undefined;
    loginBackgroundUrl?: string | undefined;
}, {
    productName?: string | undefined;
    companyName?: string | undefined;
    tagline?: string | undefined;
    footerText?: string | undefined;
    logoLightUrl?: string | undefined;
    logoDarkUrl?: string | undefined;
    faviconUrl?: string | undefined;
    loginBackgroundUrl?: string | undefined;
}>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
