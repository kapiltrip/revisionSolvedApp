ALTER TABLE `revision_settings` ADD `daily_goal_minutes` integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `revision_settings` ADD `focus_block_minutes` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `revisions` ADD `mistake_category` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `revisions` ADD `repair_action` text DEFAULT '' NOT NULL;