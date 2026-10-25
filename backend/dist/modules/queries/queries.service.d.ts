import { RowDataPacket } from 'mysql2/promise';
import { VisualQueryDefinition, QueryParameter } from './queries.schema.js';
export interface SavedQueryRow extends RowDataPacket {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    status: 'draft' | 'published';
    visual_definition: string | object;
    generated_sql: string;
    parameters: string | object | null;
    output_columns: string | object | null;
    created_by_user_id: string | null;
    updated_by_user_id: string | null;
    created_by_name?: string | null;
    updated_by_name?: string | null;
    created_at: string;
    updated_at: string;
}
export declare class QueriesService {
    /**
     * Generates a URL-safe slug from a query name
     */
    generateSlug(name: string): string;
    /**
     * List saved queries with pagination, search, and category filters
     */
    listQueries(options: {
        search?: string;
        category?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            category: string;
            status: "draft" | "published";
            sourceTables: any;
            columnCount: any;
            parameterCount: any;
            generatedSql: string;
            createdByName: string;
            updatedByName: string;
            lastExecutionStatus: any;
            lastExecutionTimeMs: any;
            isTemplate: boolean;
            createdAt: string;
            updatedAt: string;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get distinct categories
     */
    getCategories(): Promise<string[]>;
    /**
     * Get query by ID with full visual definition
     */
    getQueryById(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        category: string;
        status: "draft" | "published";
        visualDefinition: any;
        generatedSql: string;
        parameters: any;
        outputColumns: any;
        createdByName: string | null | undefined;
        updatedByName: string | null | undefined;
        createdAt: string;
        updatedAt: string;
    }>;
    /**
     * Helper to verify if userId exists in users table to satisfy foreign key constraint
     */
    private getValidUserId;
    /**
     * Create a new query
     */
    createQuery(data: {
        name: string;
        description?: string | null;
        category?: string;
        status?: 'draft' | 'published';
        visualDefinition: VisualQueryDefinition;
        parameters?: QueryParameter[];
    }, userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        category: string;
        status: "draft" | "published";
        visualDefinition: any;
        generatedSql: string;
        parameters: any;
        outputColumns: any;
        createdByName: string | null | undefined;
        updatedByName: string | null | undefined;
        createdAt: string;
        updatedAt: string;
    }>;
    /**
     * Update an existing query
     */
    updateQuery(id: string, data: {
        name?: string;
        description?: string | null;
        category?: string;
        status?: 'draft' | 'published';
        visualDefinition?: VisualQueryDefinition;
        parameters?: QueryParameter[];
    }, userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        category: string;
        status: "draft" | "published";
        visualDefinition: any;
        generatedSql: string;
        parameters: any;
        outputColumns: any;
        createdByName: string | null | undefined;
        updatedByName: string | null | undefined;
        createdAt: string;
        updatedAt: string;
    }>;
    /**
     * Delete query
     */
    deleteQuery(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Duplicate query
     */
    duplicateQuery(id: string, userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        category: string;
        status: "draft" | "published";
        visualDefinition: any;
        generatedSql: string;
        parameters: any;
        outputColumns: any;
        createdByName: string | null | undefined;
        updatedByName: string | null | undefined;
        createdAt: string;
        updatedAt: string;
    }>;
    /**
     * Execute live preview of unsaved visual query definition
     */
    previewQuery(def: VisualQueryDefinition, parameterValues?: Record<string, unknown>): Promise<{
        success: boolean;
        data: RowDataPacket[];
        columns: {
            id: string;
            header: string;
            accessorKey: string;
        }[];
        rowCount: number;
        executionTimeMs: number;
        generatedSql: string;
        warnings: string[];
    }>;
    /**
     * Execute saved query with parameters and record execution history
     */
    executeSavedQuery(id: string, parameterValues?: Record<string, unknown>, options?: {
        limit?: number;
        offset?: number;
    }, userId?: string): Promise<{
        success: boolean;
        queryId: string;
        queryName: string;
        data: RowDataPacket[];
        columns: any;
        outputColumns: any;
        rowCount: number;
        executionTimeMs: number;
        generatedSql: string;
    }>;
    /**
     * Get execution history of a query
     */
    getExecutionHistory(queryId: string): Promise<{
        id: any;
        executionTimeMs: any;
        rowCount: any;
        status: any;
        errorMessage: any;
        executedByName: any;
        executedAt: any;
    }[]>;
}
export declare const queriesService: QueriesService;
