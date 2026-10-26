import { api } from './client.ts';
import {
  SavedForm,
  EligibleDataSourcesResponse,
  SourceSchema,
  LookupItem,
  FormRecordResult,
  SingleRecordDetailsResult,
} from '../types/index.ts';

export interface FormListParams {
  category?: string;
  status?: string;
  form_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FormRecordQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  search?: string;
  filters?: string;
}

export const formsApi = {
  // List all saved forms
  async listForms(params?: FormListParams): Promise<SavedForm[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.form_type) searchParams.append('form_type', params.form_type);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    const url = qs ? `/forms?${qs}` : '/forms';
    const res = await api.get<SavedForm[]>(url);
    return res.data || [];
  },

  // Get distinct categories
  async getCategories(): Promise<string[]> {
    const res = await api.get<string[]>('/forms/categories');
    return res.data || [];
  },

  // List eligible data sources (tables + queries)
  async listEligibleDataSources(): Promise<EligibleDataSourcesResponse> {
    const res = await api.get<EligibleDataSourcesResponse>('/forms/sources/list');
    return res.data || { tables: [], queries: [] };
  },

  // Get source schema (columns, types, PK, relations)
  async getSourceSchema(type: 'table' | 'query' | 'view' | 'none', name: string): Promise<SourceSchema> {
    const res = await api.get<SourceSchema>(`/forms/sources/schema?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`);
    if (!res.data) throw new Error('Failed to load data source schema');
    return res.data;
  },

  // Lookup LOV Data Provider
  async getLookupData(params: {
    sourceType?: 'table' | 'query';
    sourceName: string;
    returnColumn: string;
    displayColumn: string;
    search?: string;
    filter?: string;
    limit?: number;
  }): Promise<LookupItem[]> {
    const sp = new URLSearchParams({
      sourceType: params.sourceType || 'table',
      sourceName: params.sourceName,
      returnColumn: params.returnColumn,
      displayColumn: params.displayColumn,
    });
    if (params.search) sp.append('search', params.search);
    if (params.filter) sp.append('filter', params.filter);
    if (params.limit) sp.append('limit', String(params.limit));

    const res = await api.get<LookupItem[]>(`/forms/lookup/data?${sp.toString()}`);
    return res.data || [];
  },

  // Get a single form by ID or slug
  async getForm(idOrSlug: string): Promise<SavedForm> {
    const res = await api.get<SavedForm>(`/forms/${idOrSlug}`);
    if (!res.data) throw new Error('Form not found');
    return res.data;
  },

  // Create a new form
  async createForm(form: Partial<SavedForm>): Promise<SavedForm> {
    const res = await api.post<SavedForm>('/forms', form);
    if (!res.data) throw new Error('Failed to create form');
    return res.data;
  },

  // Update an existing form
  async updateForm(id: string, form: Partial<SavedForm>): Promise<SavedForm> {
    const res = await api.put<SavedForm>(`/forms/${id}`, form);
    if (!res.data) throw new Error('Failed to update form');
    return res.data;
  },

  // Delete form
  async deleteForm(id: string): Promise<void> {
    await api.delete(`/forms/${id}`);
  },

  // Duplicate form
  async duplicateForm(id: string, name?: string): Promise<SavedForm> {
    const res = await api.post<SavedForm>(`/forms/${id}/duplicate`, { name });
    if (!res.data) throw new Error('Failed to duplicate form');
    return res.data;
  },

  // Publish form
  async publishForm(id: string): Promise<SavedForm> {
    const res = await api.post<SavedForm>(`/forms/${id}/publish`, {});
    if (!res.data) throw new Error('Failed to publish form');
    return res.data;
  },

  // Unpublish form
  async unpublishForm(id: string): Promise<SavedForm> {
    const res = await api.post<SavedForm>(`/forms/${id}/unpublish`, {});
    if (!res.data) throw new Error('Failed to unpublish form');
    return res.data;
  },

  // Export form
  async exportForm(id: string): Promise<any> {
    const res = await api.get<any>(`/forms/${id}/export`);
    return res.data;
  },

  // Import form
  async importForm(definition: any): Promise<SavedForm> {
    const res = await api.post<SavedForm>('/forms/import', definition);
    if (!res.data) throw new Error('Failed to import form');
    return res.data;
  },

  // =========================================================================
  // RUNTIME DATA CRUD
  // =========================================================================

  // Fetch records for Single, Continuous, or Tabular forms
  async fetchRecords(formId: string, params?: FormRecordQueryParams): Promise<FormRecordResult> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.sortBy) sp.append('sortBy', params.sortBy);
    if (params?.sortOrder) sp.append('sortOrder', params.sortOrder);
    if (params?.search) sp.append('search', params.search);
    if (params?.filters) sp.append('filters', params.filters);

    const qs = sp.toString();
    const url = qs ? `/forms/${formId}/records?${qs}` : `/forms/${formId}/records`;
    const res = await api.get<any>(url);
    return res as unknown as FormRecordResult;
  },

  // Get single record with populated master-detail child rows
  async getRecordWithDetails(formId: string, recordId: string | number): Promise<SingleRecordDetailsResult> {
    const res = await api.get<SingleRecordDetailsResult>(`/forms/${formId}/records/${recordId}`);
    if (!res.data) throw new Error('Record not found');
    return res.data;
  },

  // Insert master record + child detail rows in single transaction
  async createRecordWithDetails(formId: string, payload: { master: Record<string, any>; details?: Record<string, any> }): Promise<any> {
    const res = await api.post<any>(`/forms/${formId}/records`, payload);
    return res.data;
  },

  // Update master record + child detail rows in single transaction
  async updateRecordWithDetails(
    formId: string,
    recordId: string | number,
    payload: { master: Record<string, any>; details?: Record<string, any> }
  ): Promise<any> {
    const res = await api.put<any>(`/forms/${formId}/records/${recordId}`, payload);
    return res.data;
  },

  // Delete record
  async deleteRecord(formId: string, recordId: string | number): Promise<any> {
    const res = await api.delete<any>(`/forms/${formId}/records/${recordId}`);
    return res.data;
  },
};
