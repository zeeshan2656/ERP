-- Migration 010: Form Builder Display Modes (Embedded, Dialog, Full-Screen)
-- Adds explicit display_mode column to saved_forms table and migrates existing forms

ALTER TABLE `saved_forms`
  ADD COLUMN `display_mode` ENUM('embedded', 'dialog', 'fullscreen') NOT NULL DEFAULT 'embedded' AFTER `form_type`;

-- Migrate existing forms: if form_type is 'fullscreen', set display_mode = 'fullscreen'; if 'popup', set display_mode = 'dialog'
UPDATE `saved_forms`
  SET `display_mode` = 'fullscreen'
  WHERE `form_type` = 'fullscreen';

UPDATE `saved_forms`
  SET `display_mode` = 'dialog'
  WHERE `form_type` = 'popup';
