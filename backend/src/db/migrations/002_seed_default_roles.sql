-- Migration 002: Seed Default Roles and Initial Permissions

-- Insert System Roles
INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `is_system`) VALUES
('00000000-0000-0000-0000-000000000001', 'Super Administrator', 'admin', 'Full access to all system modules, settings, and administration.', 1),
('00000000-0000-0000-0000-000000000002', 'Operations Manager', 'manager', 'Access to operational management and user oversight.', 0),
('00000000-0000-0000-0000-000000000003', 'Standard Operator', 'operator', 'Standard operational daily workflow execution.', 0)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Default Role Permissions for Admin (All modules full control)
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
(UUID(), '00000000-0000-0000-0000-000000000001', 'users', 1, 1, 1, 1),
(UUID(), '00000000-0000-0000-0000-000000000001', 'roles', 1, 1, 1, 1),
(UUID(), '00000000-0000-0000-0000-000000000001', 'settings', 1, 1, 1, 1),
(UUID(), '00000000-0000-0000-0000-000000000001', 'e_commerce', 1, 1, 1, 1),
(UUID(), '00000000-0000-0000-0000-000000000001', 'table_designer', 1, 1, 1, 1),
(UUID(), '00000000-0000-0000-0000-000000000001', 'report_builder', 1, 1, 1, 1)
ON DUPLICATE KEY UPDATE `can_view`=1, `can_add`=1, `can_edit`=1, `can_delete`=1;

-- Default Role Permissions for Manager
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
(UUID(), '00000000-0000-0000-0000-000000000002', 'users', 1, 1, 1, 0),
(UUID(), '00000000-0000-0000-0000-000000000002', 'roles', 1, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000002', 'settings', 1, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000002', 'e_commerce', 1, 1, 1, 0),
(UUID(), '00000000-0000-0000-0000-000000000002', 'table_designer', 1, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000002', 'report_builder', 1, 1, 0, 0)
ON DUPLICATE KEY UPDATE `can_view`=1, `can_add`=VALUES(`can_add`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- Default Role Permissions for Operator
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
(UUID(), '00000000-0000-0000-0000-000000000003', 'users', 0, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000003', 'roles', 0, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000003', 'settings', 0, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000003', 'e_commerce', 1, 1, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000003', 'table_designer', 0, 0, 0, 0),
(UUID(), '00000000-0000-0000-0000-000000000003', 'report_builder', 1, 0, 0, 0)
ON DUPLICATE KEY UPDATE `can_view`=VALUES(`can_view`), `can_add`=VALUES(`can_add`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);
