-- Migration 005: Theme Architecture (Style, Mode, Density), Persistent Zoom, and Semantic Button Colors

INSERT INTO `system_settings` (`id`, `category`, `setting_key`, `setting_value`, `is_public`) VALUES
(UUID(), 'appearance', 'theme_style', 'general', 1),
(UUID(), 'appearance', 'theme_mode', 'light', 1),
(UUID(), 'appearance', 'app_zoom', '100', 1),
(UUID(), 'appearance', 'btn_save_color', '#16a34a', 1),
(UUID(), 'appearance', 'btn_update_color', '#2563eb', 1),
(UUID(), 'appearance', 'btn_cancel_color', '#64748b', 1),
(UUID(), 'appearance', 'btn_delete_color', '#dc2626', 1),
(UUID(), 'appearance', 'btn_success_color', '#16a34a', 1),
(UUID(), 'appearance', 'btn_warning_color', '#d97706', 1),
(UUID(), 'appearance', 'btn_info_color', '#0284c7', 1)
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Migrate existing saved themes in system_settings if present
UPDATE `system_settings`
SET `setting_value` = 'soft-ui'
WHERE `setting_key` = 'theme_style'
  AND EXISTS (
    SELECT 1 FROM (SELECT `setting_value` FROM `system_settings` WHERE `setting_key` = 'active_theme') AS t
    WHERE t.`setting_value` IN ('soft_ui_light', 'soft_ui_dark')
  );

UPDATE `system_settings`
SET `setting_value` = 'enterprise'
WHERE `setting_key` = 'theme_style'
  AND EXISTS (
    SELECT 1 FROM (SELECT `setting_value` FROM `system_settings` WHERE `setting_key` = 'active_theme') AS t
    WHERE t.`setting_value` = 'enterprise'
  );

UPDATE `system_settings`
SET `setting_value` = 'dark'
WHERE `setting_key` = 'theme_mode'
  AND EXISTS (
    SELECT 1 FROM (SELECT `setting_value` FROM `system_settings` WHERE `setting_key` = 'active_theme') AS t
    WHERE t.`setting_value` IN ('dark', 'soft_ui_dark')
  );

UPDATE `system_settings`
SET `setting_value` = 'compact'
WHERE `setting_key` = 'density_mode'
  AND EXISTS (
    SELECT 1 FROM (SELECT `setting_value` FROM `system_settings` WHERE `setting_key` = 'active_theme') AS t
    WHERE t.`setting_value` = 'compact'
  );

-- Ensure users table supports JSON string length for 3-axis preferences
ALTER TABLE `users` MODIFY COLUMN `theme_preference` VARCHAR(500) DEFAULT 'system';

-- Migrate existing individual user preferences in users table
UPDATE `users` SET `theme_preference` = '{"style":"soft-ui","mode":"light","density":"comfortable","zoom":100}' WHERE `theme_preference` = 'soft_ui_light';
UPDATE `users` SET `theme_preference` = '{"style":"soft-ui","mode":"dark","density":"comfortable","zoom":100}' WHERE `theme_preference` = 'soft_ui_dark';
UPDATE `users` SET `theme_preference` = '{"style":"general","mode":"dark","density":"comfortable","zoom":100}' WHERE `theme_preference` = 'dark';
UPDATE `users` SET `theme_preference` = '{"style":"general","mode":"light","density":"compact","zoom":100}' WHERE `theme_preference` = 'compact';
UPDATE `users` SET `theme_preference` = '{"style":"enterprise","mode":"light","density":"comfortable","zoom":100}' WHERE `theme_preference` = 'enterprise';
UPDATE `users` SET `theme_preference` = '{"style":"general","mode":"light","density":"comfortable","zoom":100}' WHERE `theme_preference` = 'soft_light';
