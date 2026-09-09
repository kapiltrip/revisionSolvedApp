CREATE TABLE `revision_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`urgent_window_days` integer DEFAULT 0 NOT NULL,
	`yellow_window_days` integer DEFAULT 3 NOT NULL,
	`missed_interval_days` integer DEFAULT 1 NOT NULL,
	`hesitant_interval_days` integer DEFAULT 3 NOT NULL,
	`recalled_first_days` integer DEFAULT 7 NOT NULL,
	`recalled_second_days` integer DEFAULT 14 NOT NULL,
	`recalled_mastered_days` integer DEFAULT 30 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `revisions` ADD `duration_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `revisions` ADD `reflection` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `revisions` ADD `mood` text DEFAULT 'steady' NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `urgency_override` text;--> statement-breakpoint
ALTER TABLE `topics` ADD `estimated_minutes` integer DEFAULT 30 NOT NULL;