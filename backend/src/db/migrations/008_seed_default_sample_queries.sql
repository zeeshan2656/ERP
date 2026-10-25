-- Migration 008: Seed Default Sample Queries for Visual Query Builder
-- All sample queries map to actual tables: users, roles, role_permissions, audit_logs
-- These are idempotent templates for testing and demonstration.

-- Ensure saved_queries table has proper indexes
ALTER TABLE `saved_queries` ADD INDEX IF NOT EXISTS `idx_saved_queries_slug` (`slug`);
ALTER TABLE `saved_queries` ADD INDEX IF NOT EXISTS `idx_saved_queries_category` (`category`);

-- Note: The idempotent TypeScript seeder in server bootstrap guarantees full JSON visual definitions
-- are populated and compiled.
