CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` text NOT NULL,
	`mark` text NOT NULL,
	`revised_at` text NOT NULL,
	`next_due_at` text NOT NULL,
	`proof` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`repository` text NOT NULL,
	`subject` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'not_covered' NOT NULL,
	`confidence` text,
	`priority` text DEFAULT 'normal' NOT NULL,
	`target_date` text,
	`last_revised_at` text,
	`next_due_at` text,
	`revision_count` integer DEFAULT 0 NOT NULL,
	`recall_streak` integer DEFAULT 0 NOT NULL,
	`proof` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
