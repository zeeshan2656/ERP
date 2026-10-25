-- Migration 003: Seed Default Modules and Initial Branding/Theme Settings

-- Module Registry Seeds
INSERT INTO `module_registry` (`id`, `module_key`, `name`, `description`, `icon_name`, `route_path`, `menu_position`, `is_core`, `is_enabled`, `permission_key`, `category`) VALUES
('10000000-0000-0000-0000-000000000001', 'users', 'User Management', 'Manage enterprise users, access credentials, and statuses', 'Users', '/admin/users', 10, 1, 1, 'users', 'main'),
('10000000-0000-0000-0000-000000000002', 'roles', 'Roles & Permissions', 'Configure granular module-wise security roles and access matrices', 'ShieldCheck', '/admin/roles', 20, 1, 1, 'roles', 'main'),
('10000000-0000-0000-0000-000000000003', 'settings_branding', 'Branding & Identity', 'White-label customisation: logos, favicon, product name, and footer', 'Sparkles', '/admin/settings/branding', 30, 1, 1, 'settings', 'system'),
('10000000-0000-0000-0000-000000000004', 'settings_appearance', 'Appearance & Themes', 'Tailor visual tokens, typography, radii, and choose from 4 presets', 'Palette', '/admin/settings/appearance', 40, 1, 1, 'settings', 'system'),
('10000000-0000-0000-0000-000000000005', 'settings_modules', 'Module Registry', 'Enable or disable functional business modules and features', 'Layers', '/admin/settings/modules', 50, 1, 1, 'settings', 'system'),
('10000000-0000-0000-0000-000000000006', 'audit_logs', 'Audit Trails', 'Track user actions, changes, and security events with timestamps', 'FileText', '/admin/audit', 60, 1, 1, 'settings', 'system'),
('10000000-0000-0000-0000-000000000007', 'e_commerce', 'E-Commerce Storefront', 'Online product catalogue, shopping cart, and customer orders', 'ShoppingBag', '/admin/e-commerce', 70, 0, 0, 'e_commerce', 'business'),
('10000000-0000-0000-0000-000000000008', 'table_designer', 'Table Designer', 'Create and modify database tables, fields, and constraints visually', 'Database', '/admin/lowcode/tables', 80, 0, 0, 'table_designer', 'low_code'),
('10000000-0000-0000-0000-000000000009', 'report_builder', 'Canvas Report Builder', 'Design pixel-perfect printable reports and salary sheets', 'Printer', '/admin/lowcode/reports', 90, 0, 0, 'report_builder', 'low_code')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `menu_position`=VALUES(`menu_position`);

-- System Settings Seeds
INSERT INTO `system_settings` (`id`, `category`, `setting_key`, `setting_value`, `is_public`) VALUES
(UUID(), 'system', 'system_initialized', 'false', 1),
(UUID(), 'branding', 'product_name', 'Apex Flow', 1),
(UUID(), 'branding', 'company_name', 'Industrial Enterprise Platform', 1),
(UUID(), 'branding', 'tagline', 'High-Performance Low-Code Platform for Modern Enterprises', 1),
(UUID(), 'branding', 'footer_text', '© 2026 Apex Flow • Self-Hosted Enterprise Edition', 1),
(UUID(), 'branding', 'logo_light_url', '', 1),
(UUID(), 'branding', 'logo_dark_url', '', 1),
(UUID(), 'branding', 'favicon_url', '', 1),
(UUID(), 'branding', 'login_background_url', '', 1),
(UUID(), 'appearance', 'active_theme', 'soft_light', 1),
(UUID(), 'appearance', 'allow_user_theme_override', 'true', 1),
(UUID(), 'appearance', 'font_family', 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 1),
(UUID(), 'appearance', 'base_font_size', '16px', 1),
(UUID(), 'appearance', 'border_radius', '4px', 1),
(UUID(), 'appearance', 'density_mode', 'comfortable', 1),
(UUID(), 'appearance', 'primary_color', '#0067b8', 1),
(UUID(), 'appearance', 'accent_color', '#d9383a', 1),
(UUID(), 'appearance', 'sidebar_color', '#ffffff', 1),
(UUID(), 'appearance', 'header_color', '#ffffff', 1),
(UUID(), 'appearance', 'canvas_color', '#f8fafc', 1)
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);
