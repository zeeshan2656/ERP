import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import {
  CreateFormInput,
  UpdateFormInput,
  FormRecordQuery,
  LookupQuery,
  FormControl,
} from './forms.schema.js';

export interface SavedFormRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  form_type: 'single' | 'continuous' | 'tabular' | 'popup' | 'fullscreen' | 'readonly';
  display_mode: 'embedded' | 'dialog' | 'fullscreen';
  status: 'draft' | 'published';
  source_type: 'table' | 'query' | 'view' | 'none';
  source_name: string | null;
  canvas_layout: string | object;
  controls: string | object;
  master_detail_config: string | object | null;
  actions_config: string | object | null;
  version: number;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export class FormsService {
  /**
   * Safely sanitize and quote a MySQL identifier (table or column name).
   * Prevents SQL injection in dynamic queries.
   */
  quoteIdentifier(identifier: string): string {
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(identifier)) {
      throw new Error(`Invalid MySQL identifier name: '${identifier}'`);
    }
    return `\`${identifier}\``;
  }

  /**
   * Generates a URL-safe unique slug
   */
  generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${baseSlug || 'form'}-${uuidv4().substring(0, 6)}`;
  }

  /**
   * Safely parses JSON values from DB columns
   */
  private parseJsonField<T>(val: unknown, fallback: T): T {
    if (!val) return fallback;
    if (typeof val === 'object') return val as T;
    try {
      return JSON.parse(val as string) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * List saved forms with search, category, status, form_type, and pagination
   */
  async listForms(options: {
    search?: string;
    category?: string;
    status?: string;
    form_type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(Math.max(1, options.limit || 15), 100);
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (options.search && options.search.trim()) {
      whereClauses.push('(sf.name LIKE ? OR sf.description LIKE ? OR sf.category LIKE ? OR sf.source_name LIKE ?)');
      const q = `%${options.search.trim()}%`;
      params.push(q, q, q, q);
    }

    if (options.category && options.category !== 'all') {
      whereClauses.push('sf.category = ?');
      params.push(options.category);
    }

    if (options.status && options.status !== 'all') {
      whereClauses.push('sf.status = ?');
      params.push(options.status);
    }

    if (options.form_type && options.form_type !== 'all') {
      whereClauses.push('sf.form_type = ?');
      params.push(options.form_type);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count
    const countSql = `SELECT COUNT(*) as total FROM saved_forms sf ${whereSql}`;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total) || 0;

    // Data
    const dataSql = `
      SELECT
        sf.id, sf.name, sf.slug, sf.description, sf.category, sf.form_type, sf.display_mode, sf.status,
        sf.source_type, sf.source_name, sf.canvas_layout, sf.controls,
        sf.master_detail_config, sf.actions_config, sf.version,
        sf.created_by_user_id, sf.updated_by_user_id, sf.created_at, sf.updated_at,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name
      FROM saved_forms sf
      LEFT JOIN users u1 ON sf.created_by_user_id = u1.id
      LEFT JOIN users u2 ON sf.updated_by_user_id = u2.id
      ${whereSql}
      ORDER BY sf.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query<SavedFormRow[]>(dataSql, [...params, limit, offset]);

    const forms = rows.map((row) => {
      const controls = this.parseJsonField<FormControl[]>(row.controls, []);
      const masterDetailConfig = this.parseJsonField(row.master_detail_config, null);
      const canvasLayout = this.parseJsonField(row.canvas_layout, {});

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        category: row.category,
        form_type: row.form_type,
        display_mode: row.display_mode || (row.form_type === 'fullscreen' ? 'fullscreen' : row.form_type === 'popup' ? 'dialog' : 'embedded'),
        status: row.status,
        source_type: row.source_type,
        source_name: row.source_name,
        controlCount: Array.isArray(controls) ? controls.length : 0,
        hasMasterDetail: Boolean(masterDetailConfig && (masterDetailConfig as any)?.details?.length > 0),
        canvasLayout,
        version: row.version,
        createdByName: row.created_by_name || 'System Administrator',
        updatedByName: row.updated_by_name || 'System Administrator',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return {
      forms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get distinct categories
   */
  async getCategories(): Promise<string[]> {
    const rows = await query<RowDataPacket[]>(
      'SELECT DISTINCT category FROM saved_forms WHERE category IS NOT NULL AND category != "" ORDER BY category ASC'
    );
    const set = new Set<string>(['General', 'Operations', 'Sales', 'Inventory', 'Administration']);
    rows.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }

  /**
   * Fetch single form by ID or slug with full definition and optional source schema
   */
  async getFormById(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const sql = `
      SELECT
        sf.*,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name
      FROM saved_forms sf
      LEFT JOIN users u1 ON sf.created_by_user_id = u1.id
      LEFT JOIN users u2 ON sf.updated_by_user_id = u2.id
      WHERE ${isUuid ? 'sf.id = ?' : 'sf.slug = ?'}
      LIMIT 1
    `;

    const rows = await query<SavedFormRow[]>(sql, [idOrSlug]);
    if (!rows || rows.length === 0) {
      throw new Error(`Form not found with identifier '${idOrSlug}'`);
    }

    const form = rows[0];
    const controls = this.parseJsonField<FormControl[]>(form.controls, []);
    const canvasLayout = this.parseJsonField(form.canvas_layout, {});
    const masterDetailConfig = this.parseJsonField(form.master_detail_config, null);
    const actionsConfig = this.parseJsonField(form.actions_config, null);

    // If source is configured, attach schema metadata
    let sourceSchema: any = null;
    if (form.source_name && form.source_type) {
      try {
        sourceSchema = await this.getSourceSchema(form.source_type, form.source_name);
      } catch (err) {
        logger.warn(`Could not load schema for form source '${form.source_name}':`, { error: (err as Error).message });
      }
    }

    return {
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      category: form.category,
      form_type: form.form_type,
      display_mode: form.display_mode || (form.form_type === 'fullscreen' ? 'fullscreen' : form.form_type === 'popup' ? 'dialog' : 'embedded'),
      status: form.status,
      source_type: form.source_type,
      source_name: form.source_name,
      canvasLayout,
      controls,
      masterDetailConfig,
      actionsConfig,
      version: form.version,
      createdByName: form.created_by_name || 'System Administrator',
      updatedByName: form.updated_by_name || 'System Administrator',
      createdAt: form.created_at,
      updatedAt: form.updated_at,
      sourceSchema,
    };
  }

  /**
   * Create a new form
   */
  async createForm(input: CreateFormInput, userId?: string) {
    const id = uuidv4();
    const slug = input.slug?.trim() ? input.slug.trim().toLowerCase() : this.generateSlug(input.name);

    // Check slug uniqueness
    const existing = await query<RowDataPacket[]>('SELECT id FROM saved_forms WHERE slug = ?', [slug]);
    const finalSlug = existing.length > 0 ? `${slug}-${uuidv4().substring(0, 4)}` : slug;

    const displayMode = input.display_mode || (input.form_type === 'fullscreen' ? 'fullscreen' : input.form_type === 'popup' ? 'dialog' : 'embedded');

    const sql = `
      INSERT INTO saved_forms (
        id, name, slug, description, category, form_type, display_mode, status,
        source_type, source_name, canvas_layout, controls, master_detail_config,
        actions_config, version, created_by_user_id, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;

    await query(sql, [
      id,
      input.name.trim(),
      finalSlug,
      input.description || null,
      input.category || 'General',
      input.form_type || 'single',
      displayMode,
      input.status || 'draft',
      input.source_type || 'table',
      input.source_name || null,
      JSON.stringify(input.canvas_layout || {}),
      JSON.stringify(input.controls || []),
      input.master_detail_config ? JSON.stringify(input.master_detail_config) : null,
      input.actions_config ? JSON.stringify(input.actions_config) : null,
      userId || null,
      userId || null,
    ]);

    // Record initial version in form_versions
    try {
      await query(
        'INSERT INTO form_versions (id, form_id, version, definition, created_by_user_id) VALUES (?, ?, 1, ?, ?)',
        [
          uuidv4(),
          id,
          JSON.stringify({
            name: input.name,
            controls: input.controls,
            canvas_layout: input.canvas_layout,
            master_detail_config: input.master_detail_config,
          }),
          userId || null,
        ]
      );
    } catch (err) {
      logger.warn('Failed to insert form version snapshot:', { error: (err as Error).message });
    }

    return this.getFormById(id);
  }

  /**
   * Update an existing form
   */
  async updateForm(id: string, input: UpdateFormInput, userId?: string) {
    const current = await this.getFormById(id);

    const updateFields: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      updateFields.push('name = ?');
      params.push(input.name.trim());
    }

    if (input.slug !== undefined && input.slug.trim()) {
      updateFields.push('slug = ?');
      params.push(input.slug.trim().toLowerCase());
    }

    if (input.description !== undefined) {
      updateFields.push('description = ?');
      params.push(input.description);
    }

    if (input.category !== undefined) {
      updateFields.push('category = ?');
      params.push(input.category);
    }

    if (input.form_type !== undefined) {
      updateFields.push('form_type = ?');
      params.push(input.form_type);
    }

    if (input.display_mode !== undefined) {
      updateFields.push('display_mode = ?');
      params.push(input.display_mode);
    } else if (input.form_type === 'fullscreen') {
      updateFields.push('display_mode = ?');
      params.push('fullscreen');
    } else if (input.form_type === 'popup') {
      updateFields.push('display_mode = ?');
      params.push('dialog');
    }

    if (input.status !== undefined) {
      updateFields.push('status = ?');
      params.push(input.status);
    }

    if (input.source_type !== undefined) {
      updateFields.push('source_type = ?');
      params.push(input.source_type);
    }

    if (input.source_name !== undefined) {
      updateFields.push('source_name = ?');
      params.push(input.source_name);
    }

    if (input.canvas_layout !== undefined) {
      updateFields.push('canvas_layout = ?');
      params.push(JSON.stringify(input.canvas_layout));
    }

    if (input.controls !== undefined) {
      updateFields.push('controls = ?');
      params.push(JSON.stringify(input.controls));
    }

    if (input.master_detail_config !== undefined) {
      updateFields.push('master_detail_config = ?');
      params.push(input.master_detail_config ? JSON.stringify(input.master_detail_config) : null);
    }

    if (input.actions_config !== undefined) {
      updateFields.push('actions_config = ?');
      params.push(input.actions_config ? JSON.stringify(input.actions_config) : null);
    }

    const nextVersion = (current.version || 1) + 1;
    updateFields.push('version = ?');
    params.push(nextVersion);

    if (userId) {
      updateFields.push('updated_by_user_id = ?');
      params.push(userId);
    }

    if (updateFields.length === 0) {
      return current;
    }

    const sql = `UPDATE saved_forms SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, [...params, id]);

    // Save version history snapshot
    try {
      await query(
        'INSERT INTO form_versions (id, form_id, version, definition, created_by_user_id) VALUES (?, ?, ?, ?, ?)',
        [
          uuidv4(),
          id,
          nextVersion,
          JSON.stringify({
            name: input.name ?? current.name,
            controls: input.controls ?? current.controls,
            canvas_layout: input.canvas_layout ?? current.canvasLayout,
            master_detail_config: input.master_detail_config ?? current.masterDetailConfig,
          }),
          userId || null,
        ]
      );
    } catch (err) {
      logger.warn('Failed to insert form version snapshot:', { error: (err as Error).message });
    }

    return this.getFormById(id);
  }

  /**
   * Delete a form
   */
  async deleteForm(id: string) {
    const existing = await this.getFormById(id);
    await query('DELETE FROM saved_forms WHERE id = ?', [id]);
    return { success: true, message: `Form '${existing.name}' was successfully deleted.` };
  }

  /**
   * Duplicate a form
   */
  async duplicateForm(id: string, newName?: string, userId?: string) {
    const original = await this.getFormById(id);
    const name = newName || `${original.name} (Copy)`;
    const slug = this.generateSlug(name);

    const newId = uuidv4();
    const sql = `
      INSERT INTO saved_forms (
        id, name, slug, description, category, form_type, status,
        source_type, source_name, canvas_layout, controls, master_detail_config,
        actions_config, version, created_by_user_id, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;

    await query(sql, [
      newId,
      name,
      slug,
      original.description,
      original.category,
      original.form_type,
      original.source_type,
      original.source_name,
      JSON.stringify(original.canvasLayout || {}),
      JSON.stringify(original.controls || []),
      original.masterDetailConfig ? JSON.stringify(original.masterDetailConfig) : null,
      original.actionsConfig ? JSON.stringify(original.actionsConfig) : null,
      userId || null,
      userId || null,
    ]);

    return this.getFormById(newId);
  }

  /**
   * Publish form
   */
  async publishForm(id: string, userId?: string) {
    const form = await this.getFormById(id);

    // Validation before publishing
    if (form.source_type === 'table' && !form.source_name) {
      throw new Error('Cannot publish form without a selected data source table.');
    }

    await query('UPDATE saved_forms SET status = "published", updated_by_user_id = ? WHERE id = ?', [
      userId || null,
      id,
    ]);

    return this.getFormById(id);
  }

  /**
   * Unpublish form
   */
  async unpublishForm(id: string, userId?: string) {
    await query('UPDATE saved_forms SET status = "draft", updated_by_user_id = ? WHERE id = ?', [
      userId || null,
      id,
    ]);

    return this.getFormById(id);
  }

  /**
   * Export form definition
   */
  async exportForm(id: string) {
    const form = await this.getFormById(id);
    return {
      apexFlowExport: 'FormDefinition',
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      form: {
        name: form.name,
        slug: form.slug,
        description: form.description,
        category: form.category,
        form_type: form.form_type,
        display_mode: form.display_mode,
        source_type: form.source_type,
        source_name: form.source_name,
        canvas_layout: form.canvasLayout,
        controls: form.controls,
        master_detail_config: form.masterDetailConfig,
        actions_config: form.actionsConfig,
      },
    };
  }

  /**
   * Import form definition
   */
  async importForm(definition: any, userId?: string) {
    const formData = definition.form || definition;
    if (!formData.name) {
      throw new Error('Invalid form definition: "name" is missing.');
    }

    const input: CreateFormInput = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category || 'General',
      form_type: formData.form_type || 'single',
      display_mode: formData.display_mode || 'embedded',
      status: 'draft',
      source_type: formData.source_type || 'table',
      source_name: formData.source_name || null,
      canvas_layout: formData.canvas_layout || {},
      controls: formData.controls || [],
      master_detail_config: formData.master_detail_config || null,
      actions_config: formData.actions_config || null,
    };

    return this.createForm(input, userId);
  }

  /**
   * List eligible data sources: database tables and saved queries
   */
  async listEligibleDataSources() {
    const dbName = env.DB_NAME;

    // 1. Database tables
    const tableRows = await query<RowDataPacket[]>(
      `SELECT
         t.TABLE_NAME as table_name,
         t.TABLE_COMMENT as table_comment,
         COALESCE(t.TABLE_ROWS, 0) as row_count,
         (SELECT COUNT(*) FROM information_schema.COLUMNS c
          WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME) as column_count,
         (SELECT kcu.COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE kcu
          WHERE kcu.TABLE_SCHEMA = t.TABLE_SCHEMA AND kcu.TABLE_NAME = t.TABLE_NAME
            AND kcu.CONSTRAINT_NAME = 'PRIMARY' LIMIT 1) as primary_key
       FROM information_schema.TABLES t
       WHERE t.TABLE_SCHEMA = ? AND t.TABLE_TYPE = 'BASE TABLE'
         AND t.TABLE_NAME NOT IN ('schema_migrations', 'form_versions')
       ORDER BY t.TABLE_NAME ASC`,
      [dbName]
    );

    const tables = tableRows.map((t) => ({
      name: t.table_name,
      type: 'table' as const,
      label: t.table_name,
      description: t.table_comment || '',
      rowCount: Number(t.row_count) || 0,
      columnCount: Number(t.column_count) || 0,
      primaryKey: t.primary_key || null,
      isEditable: Boolean(t.primary_key),
    }));

    // 2. Saved Queries
    let queriesList: any[] = [];
    try {
      const qRows = await query<RowDataPacket[]>(
        `SELECT id, name, slug, description, category, status, output_columns
         FROM saved_queries
         ORDER BY name ASC`
      );
      queriesList = qRows.map((q) => {
        let cols: any[] = [];
        try {
          cols = typeof q.output_columns === 'string' ? JSON.parse(q.output_columns) : q.output_columns || [];
        } catch {
          cols = [];
        }
        return {
          id: q.id,
          name: q.slug || q.name,
          type: 'query' as const,
          label: `Query: ${q.name}`,
          description: q.description || '',
          columnCount: cols.length,
          status: q.status,
          isEditable: false, // Queries are read-only views unless single-table mapped
        };
      });
    } catch (err) {
      logger.warn('Failed to query saved_queries for form data sources:', { error: (err as Error).message });
    }

    return {
      tables,
      queries: queriesList,
    };
  }

  /**
   * Detailed Schema Discovery for selected source (table or query)
   */
  async getSourceSchema(sourceType: 'table' | 'query' | 'view' | 'none', sourceName: string) {
    if (!sourceName || sourceType === 'none') {
      return {
        sourceType: 'none',
        sourceName: '',
        columns: [],
        primaryKey: null,
        foreignKeys: [],
        inboundRelations: [],
        isEditable: false,
      };
    }

    const dbName = env.DB_NAME;

    if (sourceType === 'table' || sourceType === 'view') {
      this.quoteIdentifier(sourceName);

      // Columns
      const columns = await query<RowDataPacket[]>(
        `SELECT
           COLUMN_NAME as column_name,
           ORDINAL_POSITION as ordinal_position,
           DATA_TYPE as data_type,
           COLUMN_TYPE as column_type,
           IS_NULLABLE as is_nullable,
           COLUMN_DEFAULT as column_default,
           COLUMN_KEY as column_key,
           EXTRA as extra,
           COLUMN_COMMENT as column_comment
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION ASC`,
        [dbName, sourceName]
      );

      // Outbound Foreign Keys
      const fkRows = await query<RowDataPacket[]>(
        `SELECT
           kcu.CONSTRAINT_NAME as constraint_name,
           kcu.COLUMN_NAME as column_name,
           kcu.REFERENCED_TABLE_NAME as referenced_table,
           kcu.REFERENCED_COLUMN_NAME as referenced_column
         FROM information_schema.KEY_COLUMN_USAGE kcu
         WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ?
           AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
        [dbName, sourceName]
      );

      // Inbound Foreign Keys (Child tables pointing to this table)
      const inboundRows = await query<RowDataPacket[]>(
        `SELECT
           kcu.TABLE_NAME as child_table,
           kcu.COLUMN_NAME as child_foreign_key,
           kcu.REFERENCED_COLUMN_NAME as parent_primary_key
         FROM information_schema.KEY_COLUMN_USAGE kcu
         WHERE kcu.TABLE_SCHEMA = ? AND kcu.REFERENCED_TABLE_NAME = ?`,
        [dbName, sourceName]
      );

      const pkCol = columns.find((c) => c.column_key === 'PRI')?.column_name || null;

      const mappedColumns = columns.map((c) => {
        const isFk = fkRows.find((f) => f.column_name === c.column_name);
        return {
          name: c.column_name,
          dataType: c.data_type.toUpperCase(),
          columnType: c.column_type,
          isNullable: c.is_nullable === 'YES',
          defaultValue: c.column_default,
          isPrimaryKey: c.column_key === 'PRI',
          isAutoIncrement: (c.extra || '').toLowerCase().includes('auto_increment'),
          comment: c.column_comment || '',
          foreignKey: isFk
            ? {
                referencedTable: isFk.referenced_table,
                referencedColumn: isFk.referenced_column,
              }
            : null,
        };
      });

      return {
        sourceType: 'table',
        sourceName,
        columns: mappedColumns,
        primaryKey: pkCol,
        foreignKeys: fkRows.map((f) => ({
          columnName: f.column_name,
          referencedTable: f.referenced_table,
          referencedColumn: f.referenced_column,
        })),
        inboundRelations: inboundRows.map((r) => ({
          childTable: r.child_table,
          childForeignKey: r.child_foreign_key,
          parentPrimaryKey: r.parent_primary_key,
        })),
        isEditable: Boolean(pkCol),
      };
    }

    if (sourceType === 'query') {
      const qRows = await query<RowDataPacket[]>(
        'SELECT id, name, slug, output_columns, generated_sql FROM saved_queries WHERE id = ? OR slug = ? LIMIT 1',
        [sourceName, sourceName]
      );

      if (!qRows || qRows.length === 0) {
        throw new Error(`Saved Query '${sourceName}' not found.`);
      }

      const q = qRows[0];
      let outputCols: any[] = [];
      try {
        outputCols = typeof q.output_columns === 'string' ? JSON.parse(q.output_columns) : q.output_columns || [];
      } catch {
        outputCols = [];
      }

      const mappedColumns = outputCols.map((c: any) => ({
        name: c.alias || c.name,
        dataType: (c.type || 'VARCHAR').toUpperCase(),
        columnType: c.type || 'VARCHAR',
        isNullable: true,
        defaultValue: null,
        isPrimaryKey: c.name?.toLowerCase() === 'id',
        isAutoIncrement: false,
        comment: c.table ? `Source: ${c.table}.${c.name}` : '',
        foreignKey: null,
      }));

      return {
        sourceType: 'query',
        sourceName: q.slug || q.name,
        queryId: q.id,
        queryName: q.name,
        columns: mappedColumns,
        primaryKey: mappedColumns.find((c) => c.isPrimaryKey)?.name || null,
        foreignKeys: [],
        inboundRelations: [],
        isEditable: false, // Queries are read-only
      };
    }

    throw new Error(`Unsupported source type: '${sourceType}'`);
  }

  /**
   * Get Lookup Data for Select / LOV controls
   */
  async getLookupData(dto: LookupQuery) {
    const { sourceType, sourceName, returnColumn, displayColumn, search, filter, limit } = dto;

    if (sourceType === 'table') {
      const quotedTable = this.quoteIdentifier(sourceName);
      const quotedReturn = this.quoteIdentifier(returnColumn);
      const quotedDisplay = this.quoteIdentifier(displayColumn);

      const whereClauses: string[] = [];
      const params: unknown[] = [];

      if (search && search.trim()) {
        whereClauses.push(`t.${quotedDisplay} LIKE ?`);
        params.push(`%${search.trim()}%`);
      }

      if (filter && filter.trim()) {
        whereClauses.push(filter.trim());
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const limitCount = Math.max(1, Number(limit) || 100);
      const orderSql = dto.orderBy && dto.orderBy.trim() ? dto.orderBy.trim() : `t.${quotedDisplay} ASC`;
      const sql = `SELECT t.${quotedReturn} as \`key\`, t.${quotedDisplay} as \`label\`, t.* FROM ${quotedTable} t ${whereSql} ORDER BY ${orderSql} LIMIT ${limitCount}`;

      const rows = await query<RowDataPacket[]>(sql, params);
      return rows.map((r) => ({
        key: r.key,
        label: String(r.label ?? r.key),
        data: r,
      }));
    }

    if (sourceType === 'query') {
      const qRows = await query<RowDataPacket[]>(
        'SELECT id, name, slug, generated_sql FROM saved_queries WHERE id = ? OR slug = ? OR name = ? LIMIT 1',
        [sourceName, sourceName, sourceName]
      );

      if (!qRows || qRows.length === 0 || !qRows[0].generated_sql) {
        return [];
      }

      const rawSql = String(qRows[0].generated_sql)
        .replace(/;+\s*$/, '')
        .replace(/\s+LIMIT\s+(?:\?|\d+)\s*$/i, '');
      const quotedReturn = this.quoteIdentifier(returnColumn);
      const quotedDisplay = this.quoteIdentifier(displayColumn);
      const limitCount = Math.max(1, Number(limit) || 100);

      const whereClauses: string[] = [];
      const params: unknown[] = [];

      if (search && search.trim()) {
        whereClauses.push(`sub.${quotedDisplay} LIKE ?`);
        params.push(`%${search.trim()}%`);
      }

      if (filter && filter.trim()) {
        whereClauses.push(filter.trim());
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const orderSql = dto.orderBy && dto.orderBy.trim() ? dto.orderBy.trim() : `sub.${quotedDisplay} ASC`;
      const sql = `SELECT sub.${quotedReturn} as \`key\`, sub.${quotedDisplay} as \`label\`, sub.* FROM (${rawSql}) sub ${whereSql} ORDER BY ${orderSql} LIMIT ${limitCount}`;

      const rows = await query<RowDataPacket[]>(sql, params);
      return rows.map((r) => ({
        key: r.key,
        label: String(r.label ?? r.key),
        data: r,
      }));
    }

    return [];
  }

  // =========================================================================
  // RUNTIME DATA OPERATIONS (CRUD & MASTER-DETAIL TRANSACTION ENGINE)
  // =========================================================================

  /**
   * Fetch Records for Single, Continuous, or Tabular forms
   */
  async fetchRecords(formIdOrSlug: string, queryDto: FormRecordQuery) {
    const form = await this.getFormById(formIdOrSlug);
    if (!form.source_name || form.source_type !== 'table') {
      throw new Error(`Form '${form.name}' is not bound to a database table.`);
    }

    const tableName = form.source_name;
    const quotedTable = this.quoteIdentifier(tableName);
    const { page, limit, sortBy, sortOrder, search, filters: rawFilters } = queryDto;

    const schema = await this.getSourceSchema('table', tableName);
    const columnMap = new Map(schema.columns.map((c) => [c.name, c]));

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    // Search
    if (search && search.trim()) {
      const textCols = schema.columns.filter((c) =>
        ['VARCHAR', 'CHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'].includes(c.dataType)
      );
      if (textCols.length > 0) {
        const ors = textCols.map((c) => {
          params.push(`%${search.trim()}%`);
          return `${this.quoteIdentifier(c.name)} LIKE ?`;
        });
        whereClauses.push(`(${ors.join(' OR ')})`);
      }
    }

    // Column Filters
    if (rawFilters) {
      try {
        const parsed = JSON.parse(rawFilters);
        if (Array.isArray(parsed)) {
          parsed.forEach((f: any) => {
            if (!columnMap.has(f.column)) return;
            const quotedCol = this.quoteIdentifier(f.column);
            if (f.operator === 'equals') {
              whereClauses.push(`${quotedCol} = ?`);
              params.push(f.value);
            } else if (f.operator === 'contains') {
              whereClauses.push(`${quotedCol} LIKE ?`);
              params.push(`%${f.value}%`);
            } else if (f.operator === 'gt') {
              whereClauses.push(`${quotedCol} > ?`);
              params.push(f.value);
            } else if (f.operator === 'lt') {
              whereClauses.push(`${quotedCol} < ?`);
              params.push(f.value);
            }
          });
        }
      } catch (err) {
        logger.warn('Failed to parse form record filters:', { error: (err as Error).message });
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count
    const countSql = `SELECT COUNT(*) as total FROM ${quotedTable} ${whereSql}`;
    const countRows = await query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total) || 0;

    // Sorting
    let orderSql = '';
    if (sortBy && columnMap.has(sortBy)) {
      const dir = (sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderSql = `ORDER BY ${this.quoteIdentifier(sortBy)} ${dir}`;
    } else if (schema.primaryKey) {
      orderSql = `ORDER BY ${this.quoteIdentifier(schema.primaryKey)} DESC`;
    }

    const offset = (page - 1) * limit;
    const dataSql = `SELECT * FROM ${quotedTable} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const rows = await query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    return {
      formId: form.id,
      formName: form.name,
      tableName,
      primaryKey: schema.primaryKey,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get Single Record with all Master-Detail Child Records populated
   */
  async getRecordWithDetails(formIdOrSlug: string, recordId: string | number) {
    const form = await this.getFormById(formIdOrSlug);
    if (!form.source_name || form.source_type !== 'table') {
      throw new Error(`Form '${form.name}' has no writable table source.`);
    }

    const tableName = form.source_name;
    const schema = await this.getSourceSchema('table', tableName);
    if (!schema.primaryKey) {
      throw new Error(`Table '${tableName}' has no primary key defined.`);
    }

    const quotedTable = this.quoteIdentifier(tableName);
    const quotedPk = this.quoteIdentifier(schema.primaryKey);

    const masterRows = await query<RowDataPacket[]>(
      `SELECT * FROM ${quotedTable} WHERE ${quotedPk} = ? LIMIT 1`,
      [recordId]
    );

    if (!masterRows || masterRows.length === 0) {
      throw new Error(`Record not found with ${schema.primaryKey} = '${recordId}'`);
    }

    const masterRecord = masterRows[0];
    const detailsMap: Record<string, any[]> = {};

    // Collect detail grids from controls and masterDetailConfig
    const detailGrids: Array<{ gridControlId: string; detailTable: string; foreignKeyColumn: string }> = [];

    // From masterDetailConfig
    if (form.masterDetailConfig && Array.isArray((form.masterDetailConfig as any).details)) {
      (form.masterDetailConfig as any).details.forEach((d: any) => {
        detailGrids.push({
          gridControlId: d.gridControlId || d.id,
          detailTable: d.detailTable,
          foreignKeyColumn: d.foreignKeyColumn,
        });
      });
    }

    // Also inspect controls with detailGridConfig
    if (Array.isArray(form.controls)) {
      form.controls.forEach((ctrl) => {
        if (ctrl.type === 'datagrid' || ctrl.type === 'master_detail') {
          if (ctrl.detailGridConfig && ctrl.detailGridConfig.detailTable && ctrl.detailGridConfig.foreignKeyColumn) {
            const alreadyAdded = detailGrids.some((g) => g.gridControlId === ctrl.id);
            if (!alreadyAdded) {
              detailGrids.push({
                gridControlId: ctrl.id,
                detailTable: ctrl.detailGridConfig.detailTable,
                foreignKeyColumn: ctrl.detailGridConfig.foreignKeyColumn,
              });
            }
          }
        }
      });
    }

    // Fetch child records for each detail grid
    for (const grid of detailGrids) {
      try {
        const quotedDetailTable = this.quoteIdentifier(grid.detailTable);
        const quotedFk = this.quoteIdentifier(grid.foreignKeyColumn);
        const childRows = await query<RowDataPacket[]>(
          `SELECT * FROM ${quotedDetailTable} WHERE ${quotedFk} = ? ORDER BY created_at ASC, id ASC`,
          [recordId]
        );
        detailsMap[grid.gridControlId] = childRows;
      } catch (err) {
        logger.warn(`Failed to fetch detail rows for grid '${grid.gridControlId}':`, { error: (err as Error).message });
        detailsMap[grid.gridControlId] = [];
      }
    }

    return {
      master: masterRecord,
      details: detailsMap,
      primaryKey: schema.primaryKey,
    };
  }

  /**
   * Transaction-Safe Master-Detail Save (Insert or Update Master + Children)
   */
  async saveRecordWithDetails(
    formIdOrSlug: string,
    payload: {
      master: Record<string, any>;
      details?: Record<
        string,
        {
          inserted?: any[];
          updated?: any[];
          deleted?: (string | number)[];
        }
      >;
    },
    recordId?: string | number
  ) {
    const form = await this.getFormById(formIdOrSlug);
    if (!form.source_name || form.source_type !== 'table') {
      throw new Error(`Form '${form.name}' is not bound to a writable database table.`);
    }

    const masterTable = form.source_name;
    const masterSchema = await this.getSourceSchema('table', masterTable);
    if (!masterSchema.primaryKey) {
      throw new Error(`Table '${masterTable}' does not have a primary key.`);
    }
    const pkCol = masterSchema.primaryKey;
    const quotedMasterTable = this.quoteIdentifier(masterTable);

    // Map detail configs by gridControlId
    const detailConfigMap = new Map<string, { detailTable: string; foreignKeyColumn: string }>();

    if (form.masterDetailConfig && Array.isArray((form.masterDetailConfig as any).details)) {
      (form.masterDetailConfig as any).details.forEach((d: any) => {
        detailConfigMap.set(d.gridControlId || d.id, {
          detailTable: d.detailTable,
          foreignKeyColumn: d.foreignKeyColumn,
        });
      });
    }

    if (Array.isArray(form.controls)) {
      form.controls.forEach((ctrl) => {
        if (ctrl.detailGridConfig?.detailTable && ctrl.detailGridConfig?.foreignKeyColumn) {
          detailConfigMap.set(ctrl.id, {
            detailTable: ctrl.detailGridConfig.detailTable,
            foreignKeyColumn: ctrl.detailGridConfig.foreignKeyColumn,
          });
        }
      });
    }

    return await withTransaction(async (conn) => {
      let finalMasterId: string | number;

      // 1. SAVE MASTER RECORD
      if (recordId) {
        // UPDATE existing master
        finalMasterId = recordId;
        const setClauses: string[] = [];
        const values: unknown[] = [];

        for (const [key, val] of Object.entries(payload.master)) {
          if (key === pkCol) continue;
          if (key.startsWith('__')) continue;
          const colDef = masterSchema.columns.find((c) => c.name === key);
          if (!colDef) continue;

          setClauses.push(`${this.quoteIdentifier(key)} = ?`);
          values.push(val === '' && colDef.isNullable ? null : val);
        }

        if (setClauses.length > 0) {
          values.push(finalMasterId);
          const updateSql = `UPDATE ${quotedMasterTable} SET ${setClauses.join(', ')} WHERE ${this.quoteIdentifier(
            pkCol
          )} = ?`;
          await conn.query(updateSql, values);
        }
      } else {
        // INSERT new master
        const isUuidPk = masterSchema.columns.find((c) => c.name === pkCol)?.dataType === 'CHAR';
        finalMasterId = payload.master[pkCol] || (isUuidPk ? uuidv4() : undefined);

        const cols: string[] = [];
        const placeholders: string[] = [];
        const values: unknown[] = [];

        if (finalMasterId) {
          cols.push(this.quoteIdentifier(pkCol));
          placeholders.push('?');
          values.push(finalMasterId);
        }

        for (const [key, val] of Object.entries(payload.master)) {
          if (key === pkCol) continue;
          if (key.startsWith('__')) continue;
          const colDef = masterSchema.columns.find((c) => c.name === key);
          if (!colDef) continue;

          cols.push(this.quoteIdentifier(key));
          placeholders.push('?');
          values.push(val === '' && colDef.isNullable ? null : val);
        }

        const insertSql = `INSERT INTO ${quotedMasterTable} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const [result] = await conn.query<ResultSetHeader>(insertSql, values);

        if (!finalMasterId && result.insertId) {
          finalMasterId = result.insertId;
        }
      }

      // 2. SYNCHRONIZE DETAIL GRIDS
      if (payload.details) {
        for (const [gridId, operations] of Object.entries(payload.details)) {
          const config = detailConfigMap.get(gridId);
          if (!config) continue;

          const detailTable = config.detailTable;
          const quotedDetailTable = this.quoteIdentifier(detailTable);
          const detailSchema = await this.getSourceSchema('table', detailTable);
          const detailPk = detailSchema.primaryKey || 'id';

          // A. Deletions
          if (operations.deleted && operations.deleted.length > 0) {
            const placeholders = operations.deleted.map(() => '?').join(', ');
            await conn.query(
              `DELETE FROM ${quotedDetailTable} WHERE ${this.quoteIdentifier(detailPk)} IN (${placeholders})`,
              operations.deleted
            );
          }

          // B. Updates
          if (operations.updated && operations.updated.length > 0) {
            for (const item of operations.updated) {
              const childPkVal = item[detailPk];
              if (!childPkVal) continue;

              const setClauses: string[] = [];
              const values: unknown[] = [];

              for (const [key, val] of Object.entries(item)) {
                if (key === detailPk || key === config.foreignKeyColumn) continue;
                if (key.startsWith('__')) continue;
                const colDef = detailSchema.columns.find((c) => c.name === key);
                if (!colDef) continue;

                setClauses.push(`${this.quoteIdentifier(key)} = ?`);
                values.push(val === '' && colDef.isNullable ? null : val);
              }

              if (setClauses.length > 0) {
                values.push(childPkVal);
                await conn.query(
                  `UPDATE ${quotedDetailTable} SET ${setClauses.join(', ')} WHERE ${this.quoteIdentifier(
                    detailPk
                  )} = ?`,
                  values
                );
              }
            }
          }

          // C. Insertions
          if (operations.inserted && operations.inserted.length > 0) {
            for (const item of operations.inserted) {
              const childIsUuid = detailSchema.columns.find((c) => c.name === detailPk)?.dataType === 'CHAR';
              const childId = item[detailPk] || (childIsUuid ? uuidv4() : undefined);

              const cols: string[] = [];
              const placeholders: string[] = [];
              const values: unknown[] = [];

              if (childId) {
                cols.push(this.quoteIdentifier(detailPk));
                placeholders.push('?');
                values.push(childId);
              }

              // Set Foreign Key to Master Record ID!
              cols.push(this.quoteIdentifier(config.foreignKeyColumn));
              placeholders.push('?');
              values.push(finalMasterId);

              for (const [key, val] of Object.entries(item)) {
                if (key === detailPk || key === config.foreignKeyColumn) continue;
                if (key.startsWith('__')) continue;
                const colDef = detailSchema.columns.find((c) => c.name === key);
                if (!colDef) continue;

                cols.push(this.quoteIdentifier(key));
                placeholders.push('?');
                values.push(val === '' && colDef.isNullable ? null : val);
              }

              await conn.query(
                `INSERT INTO ${quotedDetailTable} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
                values
              );
            }
          }
        }
      }

      return {
        success: true,
        masterId: finalMasterId,
        message: 'Master and detail records successfully saved in a transaction.',
      };
    });
  }

  /**
   * Delete Record with Master-Detail Safety
   */
  async deleteRecord(formIdOrSlug: string, recordId: string | number) {
    const form = await this.getFormById(formIdOrSlug);
    if (!form.source_name || form.source_type !== 'table') {
      throw new Error(`Form '${form.name}' has no writable table source.`);
    }

    const tableName = form.source_name;
    const schema = await this.getSourceSchema('table', tableName);
    if (!schema.primaryKey) {
      throw new Error(`Table '${tableName}' has no primary key.`);
    }

    const quotedTable = this.quoteIdentifier(tableName);
    const quotedPk = this.quoteIdentifier(schema.primaryKey);

    await withTransaction(async (conn) => {
      // If foreign keys are set to CASCADE in MySQL, MySQL takes care of it.
      // If not, clean up configured detail grids
      if (form.masterDetailConfig && Array.isArray((form.masterDetailConfig as any).details)) {
        for (const detail of (form.masterDetailConfig as any).details) {
          if (detail.cascadeDelete) {
            try {
              const quotedDetail = this.quoteIdentifier(detail.detailTable);
              const quotedFk = this.quoteIdentifier(detail.foreignKeyColumn);
              await conn.query(`DELETE FROM ${quotedDetail} WHERE ${quotedFk} = ?`, [recordId]);
            } catch (err) {
              logger.warn(`Could not cascade delete detail items in '${detail.detailTable}':`, { error: (err as Error).message });
            }
          }
        }
      }

      await conn.query(`DELETE FROM ${quotedTable} WHERE ${quotedPk} = ?`, [recordId]);
    });

    return { success: true, message: 'Record deleted successfully.' };
  }
}

export const formsService = new FormsService();
