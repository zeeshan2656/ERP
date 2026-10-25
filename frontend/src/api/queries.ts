import { api } from './client.ts';
import {
  SavedQuery,
  VisualQueryDefinition,
  QueryParameter,
  QueryExecutionHistoryItem,
} from '../types/index.ts';

export interface QueryListParams {
  category?: string;
  status?: string;
  search?: string;
}

export interface QueryExecutionResult {
  success: boolean;
  queryId?: string;
  queryName?: string;
  data: Record<string, any>[];
  columns?: Array<{ id: string; header: string; accessorKey: string }>;
  outputColumns?: Array<{
    id: string;
    name: string;
    alias: string;
    table: string;
    tableAlias: string;
    type: string;
    isCalculated: boolean;
  }>;
  rowCount: number;
  executionTimeMs: number;
  generatedSql?: string;
  warnings?: string[];
}

export const queriesApi = {
  // Get all saved queries
  async listQueries(params?: QueryListParams): Promise<SavedQuery[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    const url = qs ? `/queries?${qs}` : '/queries';
    const res = await api.get<SavedQuery[]>(url);
    return res.data || [];
  },

  // Get distinct categories
  async getCategories(): Promise<string[]> {
    const res = await api.get<string[]>('/queries/categories');
    return res.data || [];
  },

  // Get a single query by ID or slug
  async getQuery(id: string): Promise<SavedQuery> {
    const res = await api.get<SavedQuery>(`/queries/${id}`);
    if (!res.data) throw new Error('Query not found');
    return res.data;
  },

  // Create a new query
  async createQuery(payload: {
    name: string;
    description?: string | null;
    category?: string;
    status?: 'draft' | 'published';
    visualDefinition: VisualQueryDefinition;
    parameters?: QueryParameter[];
  }): Promise<SavedQuery> {
    const res = await api.post<SavedQuery>('/queries', payload);
    if (!res.data) throw new Error('Failed to create query');
    return res.data;
  },

  // Update existing query
  async updateQuery(
    id: string,
    payload: {
      name?: string;
      description?: string | null;
      category?: string;
      status?: 'draft' | 'published';
      visualDefinition?: VisualQueryDefinition;
      parameters?: QueryParameter[];
    }
  ): Promise<SavedQuery> {
    const res = await api.put<SavedQuery>(`/queries/${id}`, payload);
    if (!res.data) throw new Error('Failed to update query');
    return res.data;
  },

  // Delete query
  async deleteQuery(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/queries/${id}`);
    return res.data || { success: true, message: 'Deleted' };
  },

  // Duplicate query
  async duplicateQuery(id: string): Promise<SavedQuery> {
    const res = await api.post<SavedQuery>(`/queries/${id}/duplicate`, {});
    if (!res.data) throw new Error('Failed to duplicate query');
    return res.data;
  },

  // Preview unsaved query definition
  async previewQuery(
    visualDefinition: VisualQueryDefinition,
    parameterValues: Record<string, unknown> = {}
  ): Promise<QueryExecutionResult> {
    const res: any = await api.post('/queries/preview', {
      visualDefinition,
      parameterValues,
      parameters: parameterValues,
    });

    if (!res) throw new Error('Query preview returned no response');

    // Normalize: backend returns { success, data: rows, columns, rowCount, executionTimeMs, generatedSql, warnings }
    const rows = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    const columns =
      res.columns ||
      (rows.length > 0
        ? Object.keys(rows[0]).map((k: string) => ({ id: k, header: k, accessorKey: k }))
        : []);

    return {
      success: res.success ?? true,
      data: rows,
      columns,
      rowCount: typeof res.rowCount === 'number' ? res.rowCount : rows.length,
      executionTimeMs: res.executionTimeMs ?? 0,
      generatedSql: res.generatedSql || '',
      warnings: res.warnings || [],
    };
  },

  // Execute saved query
  async executeSavedQuery(
    id: string,
    parameterValues: Record<string, unknown> = {},
    options?: { limit?: number; offset?: number }
  ): Promise<QueryExecutionResult> {
    const res: any = await api.post(`/queries/${id}/execute`, {
      parameterValues,
      parameters: parameterValues,
      limit: options?.limit,
      offset: options?.offset,
    });

    if (!res) throw new Error('Query execution returned no response');

    const rows = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    const columns =
      res.columns ||
      (res.outputColumns
        ? res.outputColumns.map((c: any) => ({
            id: c.alias || c.name,
            header: c.alias || c.name,
            accessorKey: c.alias || c.name,
          }))
        : rows.length > 0
        ? Object.keys(rows[0]).map((k: string) => ({ id: k, header: k, accessorKey: k }))
        : []);

    return {
      success: res.success ?? true,
      queryId: res.queryId || id,
      queryName: res.queryName,
      data: rows,
      columns,
      outputColumns: res.outputColumns,
      rowCount: typeof res.rowCount === 'number' ? res.rowCount : rows.length,
      executionTimeMs: res.executionTimeMs ?? 0,
      generatedSql: res.generatedSql,
      warnings: res.warnings,
    };
  },

  // Get execution history
  async getExecutionHistory(id: string): Promise<QueryExecutionHistoryItem[]> {
    const res = await api.get<QueryExecutionHistoryItem[]>(`/queries/${id}/history`);
    return res.data || [];
  },
};
