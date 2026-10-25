import { RowDataPacket } from 'mysql2/promise';
import { query, withTransaction } from '../../config/database.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
import { UpdateBrandingInput } from './branding.schema.js';

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string;
}

export class BrandingService {
  async getBranding() {
    const rows = await query<SettingRow[]>(
      "SELECT setting_key, setting_value FROM system_settings WHERE category = 'branding'"
    );

    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.setting_key] = row.setting_value;
    }

    return {
      productName: config.product_name || 'Apex Flow',
      companyName: config.company_name || 'Industrial Enterprise Platform',
      tagline: config.tagline || 'Modern Low-Code Enterprise Platform',
      footerText: config.footer_text || 'Powered by Apex Flow • White-Label Platform',
      logoLightUrl: config.logo_light_url || '',
      logoDarkUrl: config.logo_dark_url || '',
      faviconUrl: config.favicon_url || '',
      loginBackgroundUrl: config.login_background_url || '',
    };
  }

  async updateBranding(input: UpdateBrandingInput, actorUserId?: string) {
    const current = await this.getBranding();

    await withTransaction(async (conn) => {
      const keysToUpdate: Record<string, string | undefined> = {
        product_name: input.productName,
        company_name: input.companyName,
        tagline: input.tagline,
        footer_text: input.footerText,
        logo_light_url: input.logoLightUrl,
        logo_dark_url: input.logoDarkUrl,
        favicon_url: input.faviconUrl,
        login_background_url: input.loginBackgroundUrl,
      };

      for (const [key, val] of Object.entries(keysToUpdate)) {
        if (val !== undefined) {
          await conn.query(
            `INSERT INTO system_settings (id, category, setting_key, setting_value, is_public, updated_at)
             VALUES (UUID(), 'branding', ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
            [key, val]
          );
        }
      }
    });

    await logAuditEvent({
      userId: actorUserId,
      action: 'BRANDING_SETTINGS_UPDATED',
      entityType: 'settings',
      entityId: 'branding',
      oldValues: current,
      newValues: input,
    });

    return {
      success: true,
      message: 'Branding updated successfully.',
      data: await this.getBranding(),
    };
  }
}

export const brandingService = new BrandingService();
