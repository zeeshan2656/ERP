import { z } from 'zod';
export const permissionActionSchema = z.object({
    moduleKey: z.string().min(1),
    canView: z.boolean().default(false),
    canAdd: z.boolean().default(false),
    canEdit: z.boolean().default(false),
    canDelete: z.boolean().default(false),
});
export const createRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').max(100),
    description: z.string().max(255).optional(),
    permissions: z.array(permissionActionSchema).optional().default([]),
});
export const updateRoleSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(255).optional(),
    permissions: z.array(permissionActionSchema).optional(),
});
//# sourceMappingURL=roles.schema.js.map