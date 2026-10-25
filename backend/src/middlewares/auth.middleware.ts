import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { query } from '../config/database.js';
import { RowDataPacket } from 'mysql2/promise';
import { AuthenticatedUser } from '../types/express.d.js';

interface UserDbRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role_id: string;
  role_slug: string;
  is_active: number;
  theme_preference: string;
  custom_theme_tokens: string | null;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload || !payload.userId) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
    return;
  }

  try {
    const rows = await query<UserDbRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.slug as role_slug,
              u.is_active, u.theme_preference, u.custom_theme_tokens
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [payload.userId]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.',
      });
      return;
    }

    const user = rows[0];

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your administrator.',
      });
      return;
    }

    let parsedTokens: Record<string, string> | null = null;
    if (user.custom_theme_tokens) {
      try {
        parsedTokens = typeof user.custom_theme_tokens === 'string'
          ? JSON.parse(user.custom_theme_tokens)
          : user.custom_theme_tokens;
      } catch {
        parsedTokens = null;
      }
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id,
      roleSlug: user.role_slug,
      themePreference: user.theme_preference,
      customThemeTokens: parsedTokens,
    };

    next();
  } catch (error) {
    next(error);
  }
}
