import { RowDataPacket } from 'mysql2/promise';
import { query } from '../../config/database.js';

interface AuditRow extends RowDataPacket {
  id: string;
  user_id: string | null;
  username: string | null;
  user_full_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export class AuditService {
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: unknown[] = [];

    if (params.action) {
      whereClauses.push('a.action = ?');
      queryParams.push(params.action);
    }
    if (params.entityType) {
      whereClauses.push('a.entity_type = ?');
      queryParams.push(params.entityType);
    }
    if (params.userId) {
      whereClauses.push('a.user_id = ?');
      queryParams.push(params.userId);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRows = await query<CountRow[]>(
      `SELECT COUNT(*) as total FROM audit_logs a WHERE ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const dataParams = [...queryParams, limit, offset];
    const rows = await query<AuditRow[]>(
      `SELECT a.id, a.user_id, u.username, u.full_name as user_full_name,
              a.action, a.entity_type, a.entity_id,
              a.old_values, a.new_values, a.ip_address, a.user_agent, a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      dataParams
    );

    return {
      items: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        userFullName: r.user_full_name,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        oldValues: r.old_values ? JSON.parse(r.old_values) : null,
        newValues: r.new_values ? JSON.parse(r.new_values) : null,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        createdAt: r.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();
