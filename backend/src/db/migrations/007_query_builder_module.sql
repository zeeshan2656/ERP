-- Migration 007: Visual Query Builder Module Schema & Permissions

-- 1. Create saved_queries table
CREATE TABLE IF NOT EXISTS `saved_queries` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'General',
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  `visual_definition` JSON NOT NULL,
  `generated_sql` TEXT NOT NULL,
  `parameters` JSON NULL,
  `output_columns` JSON NULL,
  `created_by_user_id` CHAR(36) NULL,
  `updated_by_user_id` CHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sq_name` (`name`),
  INDEX `idx_sq_category` (`category`),
  INDEX `idx_sq_status` (`status`),
  CONSTRAINT `fk_sq_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sq_updated_by` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create query_execution_history table
CREATE TABLE IF NOT EXISTS `query_execution_history` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `query_id` CHAR(36) NOT NULL,
  `executed_by_user_id` CHAR(36) NULL,
  `execution_time_ms` INT UNSIGNED NOT NULL,
  `row_count` INT UNSIGNED NOT NULL,
  `status` ENUM('success', 'error') NOT NULL,
  `error_message` TEXT NULL,
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_qeh_query_id` (`query_id`),
  INDEX `idx_qeh_executed_at` (`executed_at`),
  CONSTRAINT `fk_qeh_query` FOREIGN KEY (`query_id`) REFERENCES `saved_queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qeh_user` FOREIGN KEY (`executed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Register query_builder module in module_registry
INSERT INTO `module_registry` (`id`, `module_key`, `name`, `description`, `icon_name`, `route_path`, `menu_position`, `is_core`, `is_enabled`, `permission_key`, `category`)
VALUES (
  '10000000-0000-0000-0000-000000000010',
  'query_builder',
  'Query Builder',
  'Visual drag-and-drop query designer with multi-table joins, calculated columns, formulas, and reusable data sources',
  'GitMerge',
  '/admin/queries',
  26,
  1,
  1,
  'query_builder',
  'main'
) ON DUPLICATE KEY UPDATE
  `name` = 'Query Builder',
  `description` = 'Visual drag-and-drop query designer with multi-table joins, calculated columns, formulas, and reusable data sources',
  `icon_name` = 'GitMerge',
  `route_path` = '/admin/queries',
  `menu_position` = 26,
  `is_enabled` = 1,
  `permission_key` = 'query_builder',
  `category` = 'main';

-- 4. Seed permissions for admin role
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'query_builder', 1, 1, 1, 1
FROM `roles` r
WHERE r.slug = 'admin'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 1;

-- 5. Seed permissions for manager role
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'query_builder', 1, 1, 1, 0
FROM `roles` r
WHERE r.slug = 'manager'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 0;
