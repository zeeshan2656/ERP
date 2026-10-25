import { query, withTransaction } from '../../config/database.js';
import { validateWcagAa } from '../../utils/contrast.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
export class AppearanceService {
    async getSettings() {
        const rows = await query("SELECT setting_key, setting_value FROM system_settings WHERE category = 'appearance'");
        const config = {};
        for (const row of rows) {
            config[row.setting_key] = row.setting_value;
        }
        const themeStyle = config.theme_style || 'general';
        const themeMode = config.theme_mode || 'light';
        const densityMode = config.density_mode || 'comfortable';
        const appZoom = config.app_zoom ? Number(config.app_zoom) : 100;
        return {
            // 3 Independent Theme Axes
            themeStyle,
            themeMode,
            densityMode,
            // Persistent Global Application Zoom
            appZoom,
            // Backward Compatibility Theme string
            activeTheme: config.active_theme || `${themeStyle}_${themeMode}`,
            allowUserThemeOverride: config.allow_user_theme_override !== 'false',
            fontFamily: config.font_family || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            baseFontSize: config.base_font_size || '16px',
            borderRadius: config.border_radius || '4px',
            // Core Palette
            primaryColor: config.primary_color || '#0067b8',
            accentColor: config.accent_color || '#d9383a',
            sidebarColor: config.sidebar_color || '#ffffff',
            headerColor: config.header_color || '#ffffff',
            canvasColor: config.canvas_color || '#f8fafc',
            // Semantic Button Colors
            btnSaveColor: config.btn_save_color || '#16a34a',
            btnUpdateColor: config.btn_update_color || '#2563eb',
            btnCancelColor: config.btn_cancel_color || '#64748b',
            btnDeleteColor: config.btn_delete_color || '#dc2626',
            btnSuccessColor: config.btn_success_color || '#16a34a',
            btnWarningColor: config.btn_warning_color || '#d97706',
            btnInfoColor: config.btn_info_color || '#0284c7',
            // Soft UI settings
            softUiDistance: config.soft_ui_distance || '18px',
            softUiBlur: config.soft_ui_blur || '30px',
            softUiIntensity: config.soft_ui_intensity ? Number(config.soft_ui_intensity) : 100,
            softUiLightBg: config.soft_ui_light_bg || '#ECF0F3',
            softUiLightShadowDark: config.soft_ui_light_shadow_dark || '#D1D9E6',
            softUiLightShadowLight: config.soft_ui_light_shadow_light || '#FFFFFF',
            softUiDarkBg: config.soft_ui_dark_bg || '#2F3338',
            softUiDarkShadowDark: config.soft_ui_dark_shadow_dark || '#1E2024',
            softUiDarkShadowLight: config.soft_ui_dark_shadow_light || '#3F434A',
            // Global & Per-Component Radius settings
            radiusGlobal: config.radius_global || '8px',
            radiusButtons: config.radius_buttons || 'follow',
            radiusInputs: config.radius_inputs || 'follow',
            radiusCards: config.radius_cards || 'follow',
            radiusSidebar: config.radius_sidebar || 'follow',
            radiusHeader: config.radius_header || 'follow',
            radiusDialogs: config.radius_dialogs || 'follow',
            radiusTables: config.radius_tables || 'follow',
            radiusBadges: config.radius_badges || 'follow',
            radiusTabs: config.radius_tabs || 'follow',
            radiusToasts: config.radius_toasts || 'follow',
            radiusImages: config.radius_images || 'follow',
            radiusControls: config.radius_controls || 'follow',
        };
    }
    checkContrastCompliance(primaryColor, canvasColor, isDarkMode = false) {
        const whiteBtn = validateWcagAa('#ffffff', primaryColor, false);
        const darkBtn = validateWcagAa('#0f172a', primaryColor, false);
        const buttonContrast = whiteBtn.ratio >= 4.5 ? whiteBtn : (darkBtn.ratio >= 4.5 ? darkBtn : whiteBtn);
        const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
        const textContrast = validateWcagAa(textColor, canvasColor, false);
        const warnings = [];
        let suggestedPrimary = null;
        if (!buttonContrast.passed) {
            warnings.push(`Primary button text contrast is ${buttonContrast.ratio}:1 (below WCAG AA 4.5:1 requirement).`);
            suggestedPrimary = isDarkMode ? '#2563eb' : '#0050aa';
        }
        if (!textContrast.passed) {
            warnings.push(`Body text contrast against surface is ${textContrast.ratio}:1 (below WCAG AA 4.5:1 requirement).`);
        }
        return {
            isCompliant: buttonContrast.passed && textContrast.passed,
            buttonContrast,
            textContrast,
            warnings,
            suggestedPrimary,
        };
    }
    async updateSettings(input, actorUserId) {
        const current = await this.getSettings();
        const isDarkMode = (input.themeMode || current.themeMode) === 'dark';
        const style = input.themeStyle || current.themeStyle || 'general';
        const primary = input.primaryColor || current.primaryColor;
        let canvas = input.canvasColor || current.canvasColor;
        if (style === 'soft-ui') {
            canvas = isDarkMode
                ? input.softUiDarkBg || current.softUiDarkBg || '#2F3338'
                : input.softUiLightBg || current.softUiLightBg || '#ECF0F3';
        }
        else if (style === 'enterprise') {
            if (isDarkMode && (!input.canvasColor || input.canvasColor === '#f8fafc' || input.canvasColor === '#f1f5f9')) {
                canvas = '#0a0f1d';
            }
            else if (!isDarkMode && (!input.canvasColor || input.canvasColor === '#0a0f1d' || input.canvasColor === '#0b1120')) {
                canvas = '#f1f5f9';
            }
        }
        else if (style === 'glassmorphism') {
            if (isDarkMode && (!input.canvasColor || input.canvasColor === '#f8fafc' || input.canvasColor === '#eef2f7')) {
                canvas = '#070a12';
            }
            else if (!isDarkMode && (!input.canvasColor || input.canvasColor === '#070a12' || input.canvasColor === '#0b1120')) {
                canvas = '#eef2f7';
            }
        }
        else {
            if (isDarkMode && (!input.canvasColor || input.canvasColor === '#f8fafc')) {
                canvas = '#0b1120';
            }
            else if (!isDarkMode && (!input.canvasColor || input.canvasColor === '#0b1120')) {
                canvas = '#f8fafc';
            }
        }
        let sidebar = input.sidebarColor;
        let header = input.headerColor;
        if (style === 'enterprise') {
            if (isDarkMode && (!sidebar || sidebar === '#ffffff')) {
                sidebar = '#070c18';
            }
            if (isDarkMode && (!header || header === '#ffffff')) {
                header = '#162032';
            }
        }
        else if (style === 'soft-ui') {
            if (isDarkMode && (!sidebar || sidebar === '#ECF0F3')) {
                sidebar = input.softUiDarkBg || current.softUiDarkBg || '#2F3338';
            }
            if (isDarkMode && (!header || header === '#ECF0F3')) {
                header = input.softUiDarkBg || current.softUiDarkBg || '#2F3338';
            }
        }
        else if (style === 'glassmorphism') {
            if (isDarkMode && (!sidebar || sidebar === '#ffffff' || sidebar === 'rgba(255, 255, 255, 0.62)')) {
                sidebar = 'rgba(11, 17, 32, 0.72)';
            }
            else if (!isDarkMode && (!sidebar || sidebar === '#070c18' || sidebar === 'rgba(11, 17, 32, 0.72)')) {
                sidebar = 'rgba(255, 255, 255, 0.62)';
            }
            if (isDarkMode && (!header || header === '#ffffff' || header === 'rgba(255, 255, 255, 0.68)')) {
                header = 'rgba(15, 23, 42, 0.72)';
            }
            else if (!isDarkMode && (!header || header === '#162032' || header === 'rgba(15, 23, 42, 0.72)')) {
                header = 'rgba(255, 255, 255, 0.68)';
            }
        }
        else {
            if (isDarkMode && (!sidebar || sidebar === '#ffffff')) {
                sidebar = '#0d1527';
            }
            if (isDarkMode && (!header || header === '#ffffff')) {
                header = '#1e293b';
            }
        }
        const contrastCheck = this.checkContrastCompliance(primary, canvas, isDarkMode);
        if (input.validateContrastOnly) {
            return { contrastCheck };
        }
        await withTransaction(async (conn) => {
            const keysToUpdate = {
                theme_style: input.themeStyle,
                theme_mode: input.themeMode,
                density_mode: input.densityMode,
                app_zoom: input.appZoom !== undefined ? String(input.appZoom) : undefined,
                active_theme: input.activeTheme || (input.themeStyle && input.themeMode ? `${input.themeStyle}_${input.themeMode}` : undefined),
                allow_user_theme_override: input.allowUserThemeOverride !== undefined ? String(input.allowUserThemeOverride) : undefined,
                font_family: input.fontFamily,
                base_font_size: input.baseFontSize,
                border_radius: input.borderRadius,
                primary_color: input.primaryColor,
                accent_color: input.accentColor,
                sidebar_color: sidebar,
                header_color: header,
                canvas_color: canvas,
                // Semantic Button Colors
                btn_save_color: input.btnSaveColor,
                btn_update_color: input.btnUpdateColor,
                btn_cancel_color: input.btnCancelColor,
                btn_delete_color: input.btnDeleteColor,
                btn_success_color: input.btnSuccessColor,
                btn_warning_color: input.btnWarningColor,
                btn_info_color: input.btnInfoColor,
                // Soft UI settings
                soft_ui_distance: input.softUiDistance,
                soft_ui_blur: input.softUiBlur,
                soft_ui_intensity: input.softUiIntensity !== undefined ? String(input.softUiIntensity) : undefined,
                soft_ui_light_bg: input.softUiLightBg,
                soft_ui_light_shadow_dark: input.softUiLightShadowDark,
                soft_ui_light_shadow_light: input.softUiLightShadowLight,
                soft_ui_dark_bg: input.softUiDarkBg,
                soft_ui_dark_shadow_dark: input.softUiDarkShadowDark,
                soft_ui_dark_shadow_light: input.softUiDarkShadowLight,
                // Radius settings
                radius_global: input.radiusGlobal,
                radius_buttons: input.radiusButtons,
                radius_inputs: input.radiusInputs,
                radius_cards: input.radiusCards,
                radius_sidebar: input.radiusSidebar,
                radius_header: input.radiusHeader,
                radius_dialogs: input.radiusDialogs,
                radius_tables: input.radiusTables,
                radius_badges: input.radiusBadges,
                radius_tabs: input.radiusTabs,
                radius_toasts: input.radiusToasts,
                radius_images: input.radiusImages,
                radius_controls: input.radiusControls,
            };
            for (const [key, val] of Object.entries(keysToUpdate)) {
                if (val !== undefined) {
                    await conn.query(`INSERT INTO system_settings (id, category, setting_key, setting_value, is_public, updated_at)
             VALUES (UUID(), 'appearance', ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`, [key, val]);
                }
            }
        });
        await logAuditEvent({
            userId: actorUserId,
            action: 'APPEARANCE_SETTINGS_UPDATED',
            entityType: 'settings',
            entityId: 'appearance',
            oldValues: current,
            newValues: input,
        });
        const updated = await this.getSettings();
        return {
            success: true,
            message: 'Appearance settings updated successfully.',
            data: updated,
            contrastCheck,
        };
    }
    async resetStyle(style, actorUserId) {
        const current = await this.getSettings();
        const isDarkMode = current.themeMode === 'dark';
        await withTransaction(async (conn) => {
            if (style === 'soft-ui') {
                const softUiDefaults = {
                    soft_ui_distance: '18px',
                    soft_ui_blur: '30px',
                    soft_ui_intensity: '100',
                    soft_ui_light_bg: '#ECF0F3',
                    soft_ui_light_shadow_dark: '#D1D9E6',
                    soft_ui_light_shadow_light: '#FFFFFF',
                    soft_ui_dark_bg: '#2F3338',
                    soft_ui_dark_shadow_dark: '#1E2024',
                    soft_ui_dark_shadow_light: '#3F434A',
                    sidebar_color: isDarkMode ? '#2F3338' : '#ECF0F3',
                    header_color: isDarkMode ? '#2F3338' : '#ECF0F3',
                    canvas_color: isDarkMode ? '#2F3338' : '#ECF0F3',
                    primary_color: isDarkMode ? '#00E5FF' : '#2B6CB0',
                };
                for (const [key, val] of Object.entries(softUiDefaults)) {
                    await conn.query("UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE category = 'appearance' AND setting_key = ?", [val, key]);
                }
            }
            else if (style === 'enterprise') {
                const enterpriseDefaults = {
                    sidebar_color: isDarkMode ? '#070c18' : '#0f172a',
                    header_color: isDarkMode ? '#162032' : '#ffffff',
                    canvas_color: isDarkMode ? '#0a0f1d' : '#f1f5f9',
                    primary_color: isDarkMode ? '#2563eb' : '#0050aa',
                };
                for (const [key, val] of Object.entries(enterpriseDefaults)) {
                    await conn.query("UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE category = 'appearance' AND setting_key = ?", [val, key]);
                }
            }
            else if (style === 'glassmorphism') {
                const glassDefaults = {
                    sidebar_color: isDarkMode ? 'rgba(11, 17, 32, 0.72)' : 'rgba(255, 255, 255, 0.62)',
                    header_color: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.68)',
                    canvas_color: isDarkMode ? '#070a12' : '#eef2f7',
                    primary_color: isDarkMode ? '#818cf8' : '#4f46e5',
                };
                for (const [key, val] of Object.entries(glassDefaults)) {
                    await conn.query("UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE category = 'appearance' AND setting_key = ?", [val, key]);
                }
            }
            else {
                // general style
                const generalDefaults = {
                    sidebar_color: isDarkMode ? '#0d1527' : '#ffffff',
                    header_color: isDarkMode ? '#1e293b' : '#ffffff',
                    canvas_color: isDarkMode ? '#0b1120' : '#f8fafc',
                    primary_color: isDarkMode ? '#38bdf8' : '#0067b8',
                };
                for (const [key, val] of Object.entries(generalDefaults)) {
                    await conn.query("UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE category = 'appearance' AND setting_key = ?", [val, key]);
                }
            }
        });
        await logAuditEvent({
            userId: actorUserId,
            action: 'STYLE_SETTINGS_RESET',
            entityType: 'settings',
            entityId: `appearance_style_${style}`,
        });
        return {
            success: true,
            message: `Reset style parameters for '${style}' to defaults.`,
            data: await this.getSettings(),
        };
    }
    async resetSoftUiDefaults(actorUserId) {
        return this.resetStyle('soft-ui', actorUserId);
    }
    async resetToDefault(actorUserId) {
        const defaults = {
            theme_style: 'general',
            theme_mode: 'light',
            density_mode: 'comfortable',
            app_zoom: '100',
            active_theme: 'general_light',
            allow_user_theme_override: 'true',
            font_family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            base_font_size: '16px',
            border_radius: '4px',
            primary_color: '#0067b8',
            accent_color: '#d9383a',
            sidebar_color: '#ffffff',
            header_color: '#ffffff',
            canvas_color: '#f8fafc',
            btn_save_color: '#16a34a',
            btn_update_color: '#2563eb',
            btn_cancel_color: '#64748b',
            btn_delete_color: '#dc2626',
            btn_success_color: '#16a34a',
            btn_warning_color: '#d97706',
            btn_info_color: '#0284c7',
            soft_ui_distance: '18px',
            soft_ui_blur: '30px',
            soft_ui_intensity: '100',
            soft_ui_light_bg: '#ECF0F3',
            soft_ui_light_shadow_dark: '#D1D9E6',
            soft_ui_light_shadow_light: '#FFFFFF',
            soft_ui_dark_bg: '#2F3338',
            soft_ui_dark_shadow_dark: '#1E2024',
            soft_ui_dark_shadow_light: '#3F434A',
            radius_global: '8px',
            radius_buttons: 'follow',
            radius_inputs: 'follow',
            radius_cards: 'follow',
            radius_sidebar: 'follow',
            radius_header: 'follow',
            radius_dialogs: 'follow',
            radius_tables: 'follow',
            radius_badges: 'follow',
            radius_tabs: 'follow',
            radius_toasts: 'follow',
            radius_images: 'follow',
            radius_controls: 'follow',
        };
        await withTransaction(async (conn) => {
            for (const [key, val] of Object.entries(defaults)) {
                await conn.query(`INSERT INTO system_settings (id, category, setting_key, setting_value, is_public, updated_at)
           VALUES (UUID(), 'appearance', ?, ?, 1, NOW())
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`, [key, val]);
            }
        });
        await logAuditEvent({
            userId: actorUserId,
            action: 'APPEARANCE_SETTINGS_RESET_FACTORY',
            entityType: 'settings',
            entityId: 'appearance_all',
        });
        return {
            success: true,
            message: 'Appearance reset to clean factory defaults.',
            data: await this.getSettings(),
        };
    }
}
export const appearanceService = new AppearanceService();
//# sourceMappingURL=appearance.service.js.map