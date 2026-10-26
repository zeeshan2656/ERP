-- Migration 009: Professional Low-Code Form Builder Module Schema, Master-Detail Tables, and Seeds

-- 1. Create saved_forms table
CREATE TABLE IF NOT EXISTS `saved_forms` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'General',
  `form_type` ENUM('single', 'continuous', 'tabular', 'popup', 'fullscreen', 'readonly') NOT NULL DEFAULT 'single',
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  `source_type` ENUM('table', 'query', 'view', 'none') NOT NULL DEFAULT 'table',
  `source_name` VARCHAR(150) NULL,
  `canvas_layout` JSON NOT NULL,
  `controls` JSON NOT NULL,
  `master_detail_config` JSON NULL,
  `actions_config` JSON NULL,
  `version` INT UNSIGNED DEFAULT 1,
  `created_by_user_id` CHAR(36) NULL,
  `updated_by_user_id` CHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sf_name` (`name`),
  INDEX `idx_sf_category` (`category`),
  INDEX `idx_sf_status` (`status`),
  INDEX `idx_sf_form_type` (`form_type`),
  INDEX `idx_sf_source` (`source_type`, `source_name`),
  CONSTRAINT `fk_sf_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sf_updated_by` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create form_versions table for audit history & rollbacks
CREATE TABLE IF NOT EXISTS `form_versions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `form_id` CHAR(36) NOT NULL,
  `version` INT UNSIGNED NOT NULL,
  `definition` JSON NOT NULL,
  `created_by_user_id` CHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fv_form_id` (`form_id`),
  INDEX `idx_fv_version` (`version`),
  CONSTRAINT `fk_fv_form` FOREIGN KEY (`form_id`) REFERENCES `saved_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fv_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Register form_builder module in module_registry
INSERT INTO `module_registry` (`id`, `module_key`, `name`, `description`, `icon_name`, `route_path`, `menu_position`, `is_core`, `is_enabled`, `permission_key`, `category`)
VALUES (
  '10000000-0000-0000-0000-000000000011',
  'form_builder',
  'Form Builder',
  'Visual low-code form designer with blank-canvas layout, drag-and-drop controls, master-detail relationships, and runtime CRUD',
  'LayoutTemplate',
  '/admin/forms',
  27,
  1,
  1,
  'form_builder',
  'main'
) ON DUPLICATE KEY UPDATE
  `name` = 'Form Builder',
  `description` = 'Visual low-code form designer with blank-canvas layout, drag-and-drop controls, master-detail relationships, and runtime CRUD',
  `icon_name` = 'LayoutTemplate',
  `route_path` = '/admin/forms',
  `menu_position` = 27,
  `is_enabled` = 1,
  `permission_key` = 'form_builder',
  `category` = 'main';

-- 4. Seed role permissions for admin role
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'form_builder', 1, 1, 1, 1
FROM `roles` r
WHERE r.slug = 'admin'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 1;

-- 5. Seed role permissions for manager role
INSERT INTO `role_permissions` (`id`, `role_id`, `module_key`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT UUID(), r.id, 'form_builder', 1, 1, 1, 0
FROM `roles` r
WHERE r.slug = 'manager'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_add` = 1, `can_edit` = 1, `can_delete` = 0;

-- 6. Create realistic business tables for Master-Detail: sales_orders & sales_order_items
CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(191) NULL,
  `customer_phone` VARCHAR(50) NULL,
  `order_date` DATE NOT NULL,
  `order_status` ENUM('pending', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid', 'partially_paid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `shipping_address` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_so_order_number` (`order_number`),
  INDEX `idx_so_customer` (`customer_name`),
  INDEX `idx_so_status` (`order_status`),
  INDEX `idx_so_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales_order_items` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `order_id` CHAR(36) NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(50) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_soi_order_id` (`order_id`),
  INDEX `idx_soi_sku` (`sku`),
  CONSTRAINT `fk_soi_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Seed Sample Master-Detail Data
INSERT INTO `sales_orders` (`id`, `order_number`, `customer_name`, `customer_email`, `customer_phone`, `order_date`, `order_status`, `payment_status`, `total_amount`, `shipping_address`, `notes`)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'SO-2026-001', 'Acme Industrial Corp', 'purchasing@acme.example.com', '+1-555-0199', '2026-02-15', 'completed', 'paid', 4850.00, '742 Evergreen Terrace, Sector 4, Springfield', 'Urgent delivery required at loading dock 3.'),
  ('30000000-0000-0000-0000-000000000002', 'SO-2026-002', 'Global Logistics Ltd', 'ops@globallogistics.example.com', '+1-555-0248', '2026-02-18', 'processing', 'partially_paid', 12900.00, '12 Harbour Point Boulevard, Suite 500, Seattle, WA', 'Partial shipment authorized by warehouse manager.'),
  ('30000000-0000-0000-0000-000000000003', 'SO-2026-003', 'Apex Manufacturing Inc', 'orders@apexmanuf.example.com', '+1-555-0371', '2026-02-20', 'pending', 'unpaid', 3420.50, '88 Precision Way, Industrial Park, Austin, TX', 'Awaiting payment confirmation.'),
  ('30000000-0000-0000-0000-000000000004', 'SO-2026-004', 'OmniTech Solutions', 'procurement@omnitech.example.com', '+1-555-0412', '2026-02-22', 'completed', 'paid', 8150.00, '400 Technology Parkway, San Jose, CA', 'Net 30 terms applied.')
ON DUPLICATE KEY UPDATE `order_number` = VALUES(`order_number`);

INSERT INTO `sales_order_items` (`id`, `order_id`, `item_name`, `sku`, `quantity`, `unit_price`, `discount_percent`, `line_total`, `notes`)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Heavy Duty Hydraulic Valve 32mm', 'VALVE-HYD-032', 4, 850.00, 0.00, 3400.00, 'Standard alloy'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Pressure Sensor Transducer 0-10 Bar', 'SENS-PRESS-010', 5, 290.00, 0.00, 1450.00, 'Calibrated'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Industrial Programmable Controller (PLC-800)', 'PLC-800-PRO', 2, 4500.00, 0.00, 9000.00, 'Pre-loaded firmware v4'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'Optocoupled Digital I/O Expansion Module', 'MOD-IO-EXP16', 6, 650.00, 0.00, 3900.00, '16-channel 24V DC'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Servo Drive Motor 750W 3000 RPM', 'MTR-SRV-750W', 3, 1140.00, 0.00, 3420.00, 'Includes encoder cable'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 'Industrial Uninterruptible Power Supply (UPS-3KVA)', 'UPS-IND-3000', 2, 3200.00, 0.00, 6400.00, 'Battery rack included'),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', 'Shielded Ethernet Patch Panel 24-Port', 'NET-PATCH-24S', 5, 350.00, 0.00, 1750.00, 'Cat6A STP')
ON DUPLICATE KEY UPDATE `item_name` = VALUES(`item_name`);
