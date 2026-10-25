import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, withTransaction } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';
import { CreateRoleInput, UpdateRoleInput } from './roles.schema.js';

interface RoleRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

interface RolePermRow extends RowDataPacket {
  id: string;
  module_key: string;
  module_name: string;
  can_view: number;
  can_add: number;
  can_edit: number;
  can_delete: number;
}

export class RolesService {
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async getRoles() {
    const rows = await query<RoleRow[]>(
      `SELECT r.id, r.name, r.slug, r.description, r.is_system,
              r.created_at, r.updated_at,
              COUNT(u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
       WHERE r.deleted_at IS NULL
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name ASC`
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: Boolean(r.is_system),
      userCount: Number(r.user_count || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getRoleById(id: string) {
    const rows = await query<RoleRow[]>(
      `SELECT r.id, r.name, r.slug, r.description, r.is_system,
              r.created_at, r.updated_at,
              COUNT(u.id) as user_count
       FROM roles r
       LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
       WHERE r.id = ? AND r.deleted_at IS NULL
       GROUP BY r.id
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      throw new AppError('Role not found.', 404);
    }

    const role = rows[0];

    // Fetch permissions with module metadata
    const perms = await query<RolePermRow[]>(
      `SELECT rp.id, rp.module_key, m.name as module_name,
              rp.can_view, rp.can_add, rp.can_edit, rp.can_delete
       FROM role_permissions rp
       LEFT JOIN module_registry m ON rp.module_key = m.module_key
       WHERE rp.role_id = ?`,
      [id]
    );

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: Boolean(role.is_system),
      userCount: Number(role.user_count || 0),
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      permissions: perms.map((p) => ({
        moduleKey: p.module_key,
        moduleName: p.module_name || p.module_key,
        canView: Boolean(p.can_view),
        canAdd: Boolean(p.can_add),
        canEdit: Boolean(p.can_edit),
        canDelete: Boolean(p.can_delete),
      })),
    };
  }

  async createRole(input: CreateRoleInput, actorUserId?: string) {
    const baseSlug = this.slugify(input.name);
    let finalSlug = baseSlug;
    let counter = 1;

    // Check slug uniqueness
    while (true) {
      const existing = await query<RowDataPacket[]>(
        'SELECT id FROM roles WHERE slug = ? AND deleted_at IS NULL LIMIT 1',
        [finalSlug]
      );
      if (!existing || existing.length === 0) break;
      finalSlug = `${baseSlug}_${counter++}`;
    }

    const id = uuidv4();

    await withTransaction(async (conn) => {
      await conn.query(
        `INSERT INTO roles (id, name, slug, description, is_system, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [id, input.name, finalSlug, input.description || null]
      );

      if (input.permissions && input.permissions.length > 0) {
        for (const p of input.permissions) {
          await conn.query(
            `INSERT INTO role_permissions (id, role_id, module_key, can_view, can_add, can_edit, can_delete, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              uuidv4(),
              id,
              p.moduleKey,
              p.canView ? 1 : 0,
              p.canAdd ? 1 : 0,
              p.canEdit ? 1 : 0,
              p.canDelete ? 1 : 0,
            ]
          );
        }
      }
    });

    await logAuditEvent({
      userId: actorUserId,
      action: 'ROLE_CREATED',
      entityType: 'role',
      entityId: id,
      newValues: { name: input.name, slug: finalSlug, permissions: input.permissions },
    });

    return this.getRoleById(id);
  }

  async updateRole(id: string, input: UpdateRoleInput, actorUserId?: string) {
    const existing = await this.getRoleById(id);

    await withTransaction(async (conn) => {
      if (input.name !== undefined || input.description !== undefined) {
        await conn.query(
          `UPDATE roles
           SET name = COALESCE(?, name), description = COALESCE(?, description), version = version + 1
           WHERE id = ?`,
          [input.name || null, input.description || null, id]
        );
      }

      if (input.permissions !== undefined) {
        // If not system role or if allowed, update permissions
        for (const p of input.permissions) {
          await conn.query(
            `INSERT INTO role_permissions (id, role_id, module_key, can_view, can_add, can_edit, can_delete, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
               can_view = VALUES(can_view),
               can_add = VALUES(can_add),
               can_edit = VALUES(can_edit),
               can_delete = VALUES(can_delete)`,
            [
              uuidv4(),
              id,
              p.moduleKey,
              p.canView ? 1 : 0,
              p.canAdd ? 1 : 0,
              p.canEdit ? 1 : 0,
              p.canDelete ? 1 : 0,
            ]
          );
        }
      }
    });

    await logAuditEvent({
      userId: actorUserId,
      action: 'ROLE_UPDATED',
      entityType: 'role',
      entityId: id,
      oldValues: existing,
      newValues: input,
    });

    return this.getRoleById(id);
  }

  async deleteRole(id: string, actorUserId?: string) {
    const existing = await this.getRoleById(id);

    if (existing.isSystem) {
      throw new AppError('System roles cannot be deleted.', 400);
    }

    if (existing.userCount > 0) {
      throw new AppError(
        `Cannot delete role '${existing.name}' because ${existing.userCount} user(s) are currently assigned to it. Please reassign them first.`,
        400
      );
    }

    await query('UPDATE roles SET deleted_at = NOW(), version = version + 1 WHERE id = ?', [id]);

    await logAuditEvent({
      userId: actorUserId,
      action: 'ROLE_DELETED',
      entityType: 'role',
      entityId: id,
      oldValues: existing,
    });

    return { success: true, message: `Role '${existing.name}' deleted successfully.` };
  }

  async getAvailableModules() {
    const rows = await query<RowDataPacket[]>(
      `SELECT module_key, name, description, icon_name, is_core, is_enabled, category
       FROM module_registry
       ORDER BY menu_position ASC`
    );

    return rows.map((r) => ({
      moduleKey: r.module_key,
      name: r.name,
      description: r.description,
      iconName: r.icon_name,
      isCore: Boolean(r.is_core),
      isEnabled: Boolean(r.is_enabled),
      category: r.category,
      actions: ['view', 'add', 'edit', 'delete'],
    }));
  }
}

export const rolesService = new RolesService();
