import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    roleId: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    email: string;
    fullName: string;
    roleId: string;
    isActive: boolean;
}, {
    password: string;
    username: string;
    email: string;
    fullName: string;
    roleId: string;
    isActive?: boolean | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    fullName?: string | undefined;
    roleId?: string | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    fullName?: string | undefined;
    roleId?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const adminResetPasswordSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
}, {
    newPassword: string;
}>;
export declare const userQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", "all"]>>>;
    sortBy: z.ZodDefault<z.ZodEnum<["username", "email", "full_name", "created_at", "last_login_at"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    isActive: "true" | "false" | "all";
    page: number;
    limit: number;
    sortBy: "username" | "email" | "full_name" | "created_at" | "last_login_at";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    roleId?: string | undefined;
}, {
    search?: string | undefined;
    roleId?: string | undefined;
    isActive?: "true" | "false" | "all" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "username" | "email" | "full_name" | "created_at" | "last_login_at" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
