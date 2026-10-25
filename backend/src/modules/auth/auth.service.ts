import { RowDataPacket } from 'mysql2/promise';
import { query } from '../../config/database.js';
import { verifyPassword, hashPassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
import { AppError } from '../../middlewares/error.middleware.js';

interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_media_id: string | null;
  avatar_path: string | null;
  role_id: string;
  role_name: string;
  role_slug: string;
  is_active: number;
  theme_preference: string;
  custom_theme_tokens: string | null;
}

interface PermissionRow extends RowDataPacket {
  module_key: string;
  can_view: number;
  can_add: number;
  can_edit: number;
  can_delete: number;
}

export class AuthService {
  async login(emailOrUsername: string, plainTextPassword: string, ipAddress?: string, userAgent?: string) {
    const rows = await query<UserRow[]>(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_media_id,
              m.relative_path as avatar_path, u.role_id, r.name as role_name, r.slug as role_slug,
              u.is_active, u.theme_preference, u.custom_theme_tokens
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN media_files m ON u.avatar_media_id = m.id
       WHERE (u.email = ? OR u.username = ?) AND u.deleted_at IS NULL
       LIMIT 1`,
      [emailOrUsername, emailOrUsername]
    );

    if (!rows || rows.length === 0) {
      throw new AppError('Invalid email/username or password.', 401);
    }

    const user = rows[0];

    if (!user.is_active) {
      throw new AppError('Account has been deactivated. Please contact your system administrator.', 403);
    }

    const isValid = await verifyPassword(plainTextPassword, user.password_hash);
    if (!isValid) {
      // Log failed attempt
      await logAuditEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
      throw new AppError('Invalid email/username or password.', 401);
    }

    // Update last_login_at
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Fetch user's permissions
    const permissions = await this.getUserPermissions(user.role_id, user.role_slug);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      roleId: user.role_id,
      roleSlug: user.role_slug,
    });

    const refreshToken = generateRefreshToken({ userId: user.id });

    // Log successful login audit
    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    let customTokens: Record<string, string> | null = null;
    if (user.custom_theme_tokens) {
      try {
        customTokens = typeof user.custom_theme_tokens === 'string'
          ? JSON.parse(user.custom_theme_tokens)
          : user.custom_theme_tokens;
      } catch {
        customTokens = null;
      }
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        roleSlug: user.role_slug,
        avatarPath: user.avatar_path,
        themePreference: user.theme_preference,
        customThemeTokens: customTokens,
      },
      permissions,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);
    if (!payload || !payload.userId) {
      throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }

    const rows = await query<UserRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.slug as role_slug, u.is_active
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [payload.userId]
    );

    if (!rows || rows.length === 0 || !rows[0].is_active) {
      throw new AppError('User session expired or user deactivated.', 401);
    }

    const user = rows[0];

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      roleId: user.role_id,
      roleSlug: user.role_slug,
    });

    const newRefreshToken = generateRefreshToken({ userId: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getCurrentUserProfile(userId: string) {
    const rows = await query<UserRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, u.avatar_media_id,
              m.relative_path as avatar_path, u.role_id, r.name as role_name, r.slug as role_slug,
              u.theme_preference, u.custom_theme_tokens, u.created_at
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN media_files m ON u.avatar_media_id = m.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new AppError('User profile not found.', 404);
    }

    const user = rows[0];
    const permissions = await this.getUserPermissions(user.role_id, user.role_slug);

    let customTokens: Record<string, string> | null = null;
    if (user.custom_theme_tokens) {
      try {
        customTokens = typeof user.custom_theme_tokens === 'string'
          ? JSON.parse(user.custom_theme_tokens)
          : user.custom_theme_tokens;
      } catch {
        customTokens = null;
      }
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        roleSlug: user.role_slug,
        avatarPath: user.avatar_path,
        themePreference: user.theme_preference,
        customThemeTokens: customTokens,
        createdAt: user.created_at,
      },
      permissions,
    };
  }

  async changePassword(userId: string, currentPlain: string, newPlain: string) {
    const rows = await query<UserRow[]>(
      'SELECT id, password_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const isValid = await verifyPassword(currentPlain, rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Current password does not match.', 400);
    }

    const hashed = await hashPassword(newPlain);
    await query('UPDATE users SET password_hash = ?, version = version + 1 WHERE id = ?', [hashed, userId]);

    await logAuditEvent({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
    });

    return { success: true, message: 'Password updated successfully.' };
  }

  async updateProfile(userId: string, fullName: string, email: string, avatarMediaId?: string | null) {
    // Check email uniqueness
    const existing = await query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL LIMIT 1',
      [email, userId]
    );
    if (existing && existing.length > 0) {
      throw new AppError('Email is already registered by another account.', 409);
    }

    await query(
      `UPDATE users
       SET full_name = ?, email = ?, avatar_media_id = ?, version = version + 1
       WHERE id = ?`,
      [fullName, email, avatarMediaId || null, userId]
    );

    return { success: true, message: 'Profile updated successfully.' };
  }

  async updateThemePreference(
    userId: string,
    themePreference: string,
    customTokens?: Record<string, string> | null
  ) {
    await query(
      `UPDATE users
       SET theme_preference = ?, custom_theme_tokens = ?, version = version + 1
       WHERE id = ?`,
      [themePreference, customTokens ? JSON.stringify(customTokens) : null, userId]
    );

    return { success: true, message: 'Theme preference saved successfully.' };
  }

  private async getUserPermissions(roleId: string, roleSlug: string): Promise<Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>> {
    const permMap: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }> = {};

    // For admin, default all to true
    if (roleSlug === 'admin') {
      const allModules = await query<RowDataPacket[]>('SELECT module_key FROM module_registry');
      for (const m of allModules) {
        permMap[m.module_key] = { view: true, add: true, edit: true, delete: true };
      }
      return permMap;
    }

    const rows = await query<PermissionRow[]>(
      'SELECT module_key, can_view, can_add, can_edit, can_delete FROM role_permissions WHERE role_id = ?',
      [roleId]
    );

    for (const r of rows) {
      permMap[r.module_key] = {
        view: Boolean(r.can_view),
        add: Boolean(r.can_add),
        edit: Boolean(r.can_edit),
        delete: Boolean(r.can_delete),
      };
    }

    return permMap;
  }
}

export const authService = new AuthService();
