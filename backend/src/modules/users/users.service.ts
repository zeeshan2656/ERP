import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
import { CreateUserInput, UpdateUserInput, UserQueryInput } from './users.schema.js';

interface UserListItemRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_path: string | null;
  role_id: string;
  role_name: string;
  role_slug: string;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export class UsersService {
  async getUsers(queryInput: UserQueryInput) {
    const { page, limit, search, roleId, isActive, sortBy, sortOrder } = queryInput;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['u.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search && search.trim()) {
      whereClauses.push('(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (roleId) {
      whereClauses.push('u.role_id = ?');
      params.push(roleId);
    }

    if (isActive === 'true') {
      whereClauses.push('u.is_active = 1');
    } else if (isActive === 'false') {
      whereClauses.push('u.is_active = 0');
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Get total count
    const countRows = await query<CountRow[]>(
      `SELECT COUNT(*) as total FROM users u WHERE ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // 2. Query paginated records with safe column mapping
    const validSortCols: Record<string, string> = {
      username: 'u.username',
      email: 'u.email',
      full_name: 'u.full_name',
      created_at: 'u.created_at',
      last_login_at: 'u.last_login_at',
    };
    const sortCol = validSortCols[sortBy] || 'u.created_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataParams = [...params, limit, offset];
    const rows = await query<UserListItemRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, m.relative_path as avatar_path,
              u.role_id, r.name as role_name, r.slug as role_slug,
              u.is_active, u.last_login_at, u.created_at, u.updated_at
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN media_files m ON u.avatar_media_id = m.id
       WHERE ${whereSql}
       ORDER BY ${sortCol} ${direction}
       LIMIT ? OFFSET ?`,
      dataParams
    );

    return {
      items: rows.map((r) => ({
        id: r.id,
        username: r.username,
        email: r.email,
        fullName: r.full_name,
        avatarPath: r.avatar_path,
        roleId: r.role_id,
        roleName: r.role_name,
        roleSlug: r.role_slug,
        isActive: Boolean(r.is_active),
        lastLoginAt: r.last_login_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const rows = await query<UserListItemRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, m.relative_path as avatar_path,
              u.role_id, r.name as role_name, r.slug as role_slug,
              u.is_active, u.last_login_at, u.created_at, u.updated_at
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN media_files m ON u.avatar_media_id = m.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      fullName: r.full_name,
      avatarPath: r.avatar_path,
      roleId: r.role_id,
      roleName: r.role_name,
      roleSlug: r.role_slug,
      isActive: Boolean(r.is_active),
      lastLoginAt: r.last_login_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async createUser(input: CreateUserInput, actorUserId?: string) {
    // Check username and email uniqueness
    const existing = await query<RowDataPacket[]>(
      'SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL LIMIT 1',
      [input.username, input.email]
    );

    if (existing && existing.length > 0) {
      if (existing[0].username === input.username) {
        throw new AppError('A user with this username already exists.', 409);
      }
      throw new AppError('A user with this email already exists.', 409);
    }

    const id = uuidv4();
    const hashedPassword = await hashPassword(input.password);

    await query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role_id, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, input.username, input.email, hashedPassword, input.fullName, input.roleId, input.isActive ? 1 : 0]
    );

    await logAuditEvent({
      userId: actorUserId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: id,
      newValues: {
        username: input.username,
        email: input.email,
        fullName: input.fullName,
        roleId: input.roleId,
        isActive: input.isActive,
      },
    });

    return this.getUserById(id);
  }

  async updateUser(id: string, input: UpdateUserInput, actorUserId?: string) {
    const existing = await this.getUserById(id);

    if (input.email && input.email !== existing.email) {
      const duplicate = await query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL LIMIT 1',
        [input.email, id]
      );
      if (duplicate && duplicate.length > 0) {
        throw new AppError('Email is already registered to another account.', 409);
      }
    }

    const updates: string[] = ['version = version + 1'];
    const params: unknown[] = [];

    if (input.fullName !== undefined) {
      updates.push('full_name = ?');
      params.push(input.fullName);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    if (input.roleId !== undefined) {
      updates.push('role_id = ?');
      params.push(input.roleId);
    }
    if (input.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(input.isActive ? 1 : 0);
    }

    params.push(id);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAuditEvent({
      userId: actorUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: id,
      oldValues: existing,
      newValues: input,
    });

    return this.getUserById(id);
  }

  async softDeleteUser(id: string, actorUserId?: string) {
    const existing = await this.getUserById(id);

    if (existing.roleSlug === 'admin') {
      // Prevent deleting the last super admin
      const adminCount = await query<CountRow[]>(
        `SELECT COUNT(*) as total FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE r.slug = 'admin' AND u.deleted_at IS NULL`
      );
      if ((adminCount[0]?.total || 0) <= 1) {
        throw new AppError('Cannot delete the sole Super Administrator account.', 400);
      }
    }

    await query('UPDATE users SET deleted_at = NOW(), version = version + 1 WHERE id = ?', [id]);

    await logAuditEvent({
      userId: actorUserId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: id,
      oldValues: existing,
    });

    return { success: true, message: 'User removed successfully.' };
  }

  async toggleUserStatus(id: string, isActive: boolean, actorUserId?: string) {
    const existing = await this.getUserById(id);

    await query('UPDATE users SET is_active = ?, version = version + 1 WHERE id = ?', [
      isActive ? 1 : 0,
      id,
    ]);

    await logAuditEvent({
      userId: actorUserId,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive },
    });

    return { success: true, message: `User account has been ${isActive ? 'activated' : 'deactivated'}.` };
  }

  async adminResetPassword(id: string, newPlain: string, actorUserId?: string) {
    await this.getUserById(id); // Ensure user exists

    const hashedPassword = await hashPassword(newPlain);
    await query('UPDATE users SET password_hash = ?, version = version + 1 WHERE id = ?', [
      hashedPassword,
      id,
    ]);

    await logAuditEvent({
      userId: actorUserId,
      action: 'ADMIN_RESET_PASSWORD',
      entityType: 'user',
      entityId: id,
    });

    return { success: true, message: 'User password reset successfully.' };
  }
}

export const usersService = new UsersService();
