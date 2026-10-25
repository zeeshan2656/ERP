import { z } from 'zod';
// Zod schemas for API validation
export const CreateQuerySchema = z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(1000).optional().nullable(),
    category: z.string().max(80).default('General'),
    status: z.enum(['draft', 'published']).default('draft'),
    visualDefinition: z.record(z.any()),
    parameters: z.array(z.record(z.any())).optional().default([]),
});
export const UpdateQuerySchema = z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(1000).optional().nullable(),
    category: z.string().max(80).optional(),
    status: z.enum(['draft', 'published']).optional(),
    visualDefinition: z.record(z.any()).optional(),
    parameters: z.array(z.record(z.any())).optional(),
});
export const ExecuteQuerySchema = z.object({
    parameters: z.record(z.any()).optional().default({}),
    parameterValues: z.record(z.any()).optional(),
    limit: z.number().int().min(1).max(5000).optional().default(100),
    offset: z.number().int().min(0).optional().default(0),
});
export const PreviewSqlSchema = z.object({
    visualDefinition: z.record(z.any()),
    parameters: z.record(z.any()).optional().default({}),
});
//# sourceMappingURL=queries.schema.js.map