import { z } from 'zod';
export declare const permissionActionSchema: z.ZodObject<{
    moduleKey: z.ZodString;
    canView: z.ZodDefault<z.ZodBoolean>;
    canAdd: z.ZodDefault<z.ZodBoolean>;
    canEdit: z.ZodDefault<z.ZodBoolean>;
    canDelete: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    moduleKey: string;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
}, {
    moduleKey: string;
    canView?: boolean | undefined;
    canAdd?: boolean | undefined;
    canEdit?: boolean | undefined;
    canDelete?: boolean | undefined;
}>;
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        moduleKey: z.ZodString;
        canView: z.ZodDefault<z.ZodBoolean>;
        canAdd: z.ZodDefault<z.ZodBoolean>;
        canEdit: z.ZodDefault<z.ZodBoolean>;
        canDelete: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        moduleKey: string;
        canView: boolean;
        canAdd: boolean;
        canEdit: boolean;
        canDelete: boolean;
    }, {
        moduleKey: string;
        canView?: boolean | undefined;
        canAdd?: boolean | undefined;
        canEdit?: boolean | undefined;
        canDelete?: boolean | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: {
        moduleKey: string;
        canView: boolean;
        canAdd: boolean;
        canEdit: boolean;
        canDelete: boolean;
    }[];
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    permissions?: {
        moduleKey: string;
        canView?: boolean | undefined;
        canAdd?: boolean | undefined;
        canEdit?: boolean | undefined;
        canDelete?: boolean | undefined;
    }[] | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        moduleKey: z.ZodString;
        canView: z.ZodDefault<z.ZodBoolean>;
        canAdd: z.ZodDefault<z.ZodBoolean>;
        canEdit: z.ZodDefault<z.ZodBoolean>;
        canDelete: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        moduleKey: string;
        canView: boolean;
        canAdd: boolean;
        canEdit: boolean;
        canDelete: boolean;
    }, {
        moduleKey: string;
        canView?: boolean | undefined;
        canAdd?: boolean | undefined;
        canEdit?: boolean | undefined;
        canDelete?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: {
        moduleKey: string;
        canView: boolean;
        canAdd: boolean;
        canEdit: boolean;
        canDelete: boolean;
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: {
        moduleKey: string;
        canView?: boolean | undefined;
        canAdd?: boolean | undefined;
        canEdit?: boolean | undefined;
        canDelete?: boolean | undefined;
    }[] | undefined;
}>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
