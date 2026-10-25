-- Migration 004: Soft UI Parameters & Component Radius Settings

INSERT INTO `system_settings` (`id`, `category`, `setting_key`, `setting_value`, `is_public`) VALUES
-- Soft UI Shadow & Surface Settings
(UUID(), 'appearance', 'soft_ui_distance', '18px', 1),
(UUID(), 'appearance', 'soft_ui_blur', '30px', 1),
(UUID(), 'appearance', 'soft_ui_intensity', '100', 1),
(UUID(), 'appearance', 'soft_ui_light_bg', '#ECF0F3', 1),
(UUID(), 'appearance', 'soft_ui_light_shadow_dark', '#D1D9E6', 1),
(UUID(), 'appearance', 'soft_ui_light_shadow_light', '#FFFFFF', 1),
(UUID(), 'appearance', 'soft_ui_dark_bg', '#2F3338', 1),
(UUID(), 'appearance', 'soft_ui_dark_shadow_dark', '#1E2024', 1),
(UUID(), 'appearance', 'soft_ui_dark_shadow_light', '#3F434A', 1),

-- Global & Per-Component Border Radius Settings
(UUID(), 'appearance', 'radius_global', '8px', 1),
(UUID(), 'appearance', 'radius_buttons', 'follow', 1),
(UUID(), 'appearance', 'radius_inputs', 'follow', 1),
(UUID(), 'appearance', 'radius_cards', 'follow', 1),
(UUID(), 'appearance', 'radius_sidebar', 'follow', 1),
(UUID(), 'appearance', 'radius_header', 'follow', 1),
(UUID(), 'appearance', 'radius_dialogs', 'follow', 1),
(UUID(), 'appearance', 'radius_tables', 'follow', 1),
(UUID(), 'appearance', 'radius_badges', 'follow', 1),
(UUID(), 'appearance', 'radius_tabs', 'follow', 1),
(UUID(), 'appearance', 'radius_toasts', 'follow', 1),
(UUID(), 'appearance', 'radius_images', 'follow', 1),
(UUID(), 'appearance', 'radius_controls', 'follow', 1)
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
