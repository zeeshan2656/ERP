import { VisualQueryDefinition } from '../../modules/queries/queries.schema.js';
export interface SampleQueryDefinition {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    status: 'draft' | 'published';
    visualDefinition: VisualQueryDefinition;
}
export declare const SAMPLE_QUERIES: SampleQueryDefinition[];
/**
 * Idempotently seed default sample queries into saved_queries
 */
export declare function seedDefaultSampleQueries(): Promise<void>;
