import { z } from 'zod';
export const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    roleId: z.string().uuid('Invalid role ID'),
    isActive: z.boolean().default(true),
});
export const updateUserSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
});
export const adminResetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export const userQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
    sortBy: z.enum(['username', 'email', 'full_name', 'created_at', 'last_login_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=users.schema.js.map