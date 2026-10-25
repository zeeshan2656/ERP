import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { SetupWizardInput } from './system.schema.js';
import { RowDataPacket } from 'mysql2/promise';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string;
}

export class SystemService {
  async getSetupStatus(): Promise<{ isInitialized: boolean }> {
    const rows = await query<SettingRow[]>(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'system_initialized' LIMIT 1"
    );

    if (rows && rows.length > 0 && rows[0].setting_value === 'true') {
      return { isInitialized: true };
    }

    // Double check if any admin user exists
    const users = await query<RowDataPacket[]>(
      "SELECT id FROM users WHERE deleted_at IS NULL LIMIT 1"
    );
    const hasUsers = users && users.length > 0;

    return { isInitialized: hasUsers };
  }

  async performSetup(input: SetupWizardInput, ipAddress?: string, userAgent?: string) {
    const status = await this.getSetupStatus();
    if (status.isInitialized) {
      throw new Error('System setup has already been completed.');
    }

    const hashedPassword = await hashPassword(input.adminPassword);
    const adminUserId = uuidv4();
    const adminRoleId = '00000000-0000-0000-0000-000000000001';

    await withTransaction(async (conn) => {
      // 1. Create Super Admin User
      await conn.query(
        `INSERT INTO users (id, username, email, password_hash, full_name, role_id, is_active, theme_preference, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
        [adminUserId, input.adminUsername, input.adminEmail, hashedPassword, input.adminFullName, adminRoleId, input.themePreset]
      );

      // 2. Update System Initialization Setting
      await conn.query(
        "UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'system_initialized'"
      );

      // 3. Update Branding Settings
      await conn.query(
        "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'product_name'",
        [input.productName]
      );
      await conn.query(
        "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'company_name'",
        [input.companyName]
      );
      if (input.tagline) {
        await conn.query(
          "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'tagline'",
          [input.tagline]
        );
      }

      // 4. Update Active Theme
      await conn.query(
        "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'active_theme'",
        [input.themePreset]
      );
    });

    // Record Setup Audit
    await logAuditEvent({
      userId: adminUserId,
      action: 'SYSTEM_SETUP_COMPLETED',
      entityType: 'system',
      entityId: 'setup',
      newValues: {
        productName: input.productName,
        companyName: input.companyName,
        adminEmail: input.adminEmail,
        themePreset: input.themePreset,
      },
      ipAddress,
      userAgent,
    });

    const tokenPayload = {
      userId: adminUserId,
      email: input.adminEmail,
      username: input.adminUsername,
      roleId: adminRoleId,
      roleSlug: 'admin',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: adminUserId });

    return {
      success: true,
      message: 'System initialization and Super Admin account created successfully.',
      user: {
        id: adminUserId,
        username: input.adminUsername,
        email: input.adminEmail,
        fullName: input.adminFullName,
        role: 'admin',
      },
      accessToken,
      refreshToken,
    };
  }

  async getPublicConfig() {
    const rows = await query<SettingRow[]>(
      'SELECT setting_key, setting_value FROM system_settings WHERE is_public = 1'
    );

    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.setting_key] = row.setting_value;
    }

    return {
      productName: config.product_name || 'Apex Flow',
      companyName: config.company_name || 'Industrial Solutions Ltd',
      tagline: config.tagline || 'Modern Low-Code Enterprise Platform',
      footerText: config.footer_text || 'Powered by Apex Flow • White-Label Platform',
      logoLightUrl: config.logo_light_url || '',
      logoDarkUrl: config.logo_dark_url || '',
      faviconUrl: config.favicon_url || '',
      loginBackgroundUrl: config.login_background_url || '',
      // 3 Independent Theme Axes
      themeStyle: config.theme_style || 'general',
      themeMode: config.theme_mode || 'light',
      densityMode: config.density_mode || 'comfortable',

      // Application Zoom
      appZoom: config.app_zoom ? Number(config.app_zoom) : 100,

      // Backward Compatibility Theme string
      activeTheme: config.active_theme || `${config.theme_style || 'general'}_${config.theme_mode || 'light'}`,
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

      // Soft UI Tokens
      softUiDistance: config.soft_ui_distance || '18px',
      softUiBlur: config.soft_ui_blur || '30px',
      softUiIntensity: config.soft_ui_intensity ? Number(config.soft_ui_intensity) : 100,
      softUiLightBg: config.soft_ui_light_bg || '#ECF0F3',
      softUiLightShadowDark: config.soft_ui_light_shadow_dark || '#D1D9E6',
      softUiLightShadowLight: config.soft_ui_light_shadow_light || '#FFFFFF',
      softUiDarkBg: config.soft_ui_dark_bg || '#2F3338',
      softUiDarkShadowDark: config.soft_ui_dark_shadow_dark || '#1E2024',
      softUiDarkShadowLight: config.soft_ui_dark_shadow_light || '#3F434A',

      // Radius Tokens
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
}

export const systemService = new SystemService();
