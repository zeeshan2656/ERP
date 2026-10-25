import { z } from 'zod';
const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/;
const hexColorRegex = colorRegex;
export const updateAppearanceSchema = z.object({
    // The Three Independent Theme Axes
    themeStyle: z.enum(['general', 'soft-ui', 'enterprise', 'glassmorphism']).optional(),
    themeMode: z.enum(['light', 'dark', 'system']).optional(),
    densityMode: z.enum(['comfortable', 'compact']).optional(),
    // Persistent Project-Wide Application Zoom (50% to 150%)
    appZoom: z.coerce.number().min(50).max(150).optional(),
    // Legacy Theme Field for Backward Compatibility
    activeTheme: z.string().max(50).optional(),
    allowUserThemeOverride: z.boolean().optional(),
    fontFamily: z.string().min(2).max(255).optional(),
    baseFontSize: z.enum(['13px', '14px', '15px', '16px']).optional(),
    borderRadius: z.string().max(20).optional(),
    // Core Palette Colors
    primaryColor: z.string().regex(colorRegex, 'Must be a valid hex or rgba color').optional(),
    accentColor: z.string().regex(colorRegex, 'Must be a valid hex or rgba color').optional(),
    sidebarColor: z.string().regex(colorRegex, 'Must be a valid hex or rgba color').optional(),
    headerColor: z.string().regex(colorRegex, 'Must be a valid hex or rgba color').optional(),
    canvasColor: z.string().regex(colorRegex, 'Must be a valid hex or rgba color').optional(),
    // Semantic Button Colors
    btnSaveColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnUpdateColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnCancelColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnDeleteColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnSuccessColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnWarningColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    btnInfoColor: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
    // Soft UI Specific Tokens
    softUiDistance: z.string().max(20).optional(),
    softUiBlur: z.string().max(20).optional(),
    softUiIntensity: z.coerce.number().min(0).max(200).optional(),
    softUiLightBg: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    softUiLightShadowDark: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    softUiLightShadowLight: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    softUiDarkBg: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    softUiDarkShadowDark: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    softUiDarkShadowLight: z.string().regex(hexColorRegex, 'Must be valid hex').optional(),
    // Global & Per-Component Radius Tokens
    radiusGlobal: z.string().max(20).optional(),
    radiusButtons: z.string().max(20).optional(),
    radiusInputs: z.string().max(20).optional(),
    radiusCards: z.string().max(20).optional(),
    radiusSidebar: z.string().max(20).optional(),
    radiusHeader: z.string().max(20).optional(),
    radiusDialogs: z.string().max(20).optional(),
    radiusTables: z.string().max(20).optional(),
    radiusBadges: z.string().max(20).optional(),
    radiusTabs: z.string().max(20).optional(),
    radiusToasts: z.string().max(20).optional(),
    radiusImages: z.string().max(20).optional(),
    radiusControls: z.string().max(20).optional(),
    validateContrastOnly: z.boolean().optional().default(false),
});
//# sourceMappingURL=appearance.schema.js.map