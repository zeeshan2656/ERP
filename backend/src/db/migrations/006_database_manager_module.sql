-- Migration 006: Register and Enable Database Manager Module

-- 1. Ensure database_manager module is registered and enabled in module_registry
INSERT INTO `module_registry` (`id`, `module_key`, `name`, `description`, `icon_name`, `route_path`, `menu_position`, `is_core`, `is_enabled`, `permission_key`, `category`)
VALUES (
  '10000000-0000-0000-0000-000000000008',
  'database_manager',
  'Database Manager',
  'Visually inspect and manage database tables, schemas, relations, indexes, and live data records',
  'Database',
  '/admin/database',
  25,
  1,
  1,
  'database_manager',
  'main'
)
ON DUPLICATE KEY UPDATE
  `module_key` = 'database_manager',
  `name` = 'Database Manager',
  `description` = 'Visually inspect and manage database tables, schemas, relations, indexes, and live data records',
  `icon_name` = 'Database',
  `route_path` = '/admin/database',
  `menu_position` = 25,
  `is_enabled` = 1,
  `permission_key` = 'database_manager',
  `category` = 'main';

-- 2. Seed Admin permissions for database_manager
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'database_manager', 1, 1, 1, 1
FROM `roles` r
WHERE r.slug = 'admin'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 1;

-- 3. Also grant view/add/edit permissions for manager
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'database_manager', 1, 1, 1, 0
FROM `roles` r
WHERE r.slug = 'manager'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 0;
