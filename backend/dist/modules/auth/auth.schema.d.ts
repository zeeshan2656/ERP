import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    emailOrUsername: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    emailOrUsername: string;
}, {
    password: string;
    emailOrUsername: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    avatarMediaId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    avatarMediaId?: string | null | undefined;
}, {
    email: string;
    fullName: string;
    avatarMediaId?: string | null | undefined;
}>;
export declare const updateThemePrefSchema: z.ZodObject<{
    themePreference: z.ZodEnum<["soft_light", "enterprise", "dark", "compact", "system"]>;
    customTokens: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    themePreference: "soft_light" | "enterprise" | "dark" | "compact" | "system";
    customTokens?: Record<string, string> | null | undefined;
}, {
    themePreference: "soft_light" | "enterprise" | "dark" | "compact" | "system";
    customTokens?: Record<string, string> | null | undefined;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    token: string;
}, {
    newPassword: string;
    token: string;
}>;
