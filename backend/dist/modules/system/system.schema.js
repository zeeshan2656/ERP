import { z } from 'zod';
export const setupWizardSchema = z.object({
    productName: z.string().min(2, 'Product name must be at least 2 characters').max(100),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
    tagline: z.string().max(255).optional(),
    adminUsername: z.string().min(3, 'Admin username must be at least 3 characters').max(50),
    adminEmail: z.string().email('Invalid email address'),
    adminPassword: z.string().min(8, 'Admin password must be at least 8 characters'),
    adminFullName: z.string().min(2, 'Admin full name must be at least 2 characters').max(100),
    themePreset: z.enum(['soft_light', 'enterprise', 'dark', 'compact']).default('soft_light'),
});
//# sourceMappingURL=system.schema.js.map