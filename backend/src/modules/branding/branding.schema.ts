import { z } from 'zod';

export const updateBrandingSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100).optional(),
  companyName: z.string().min(1, 'Company name is required').max(100).optional(),
  tagline: z.string().max(255).optional(),
  footerText: z.string().max(255).optional(),
  logoLightUrl: z.string().max(500).optional(),
  logoDarkUrl: z.string().max(500).optional(),
  faviconUrl: z.string().max(500).optional(),
  loginBackgroundUrl: z.string().max(500).optional(),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
