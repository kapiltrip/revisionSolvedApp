CREATE TABLE `hdlbits_practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`seed_question_id` text NOT NULL,
	`question_ids` text NOT NULL,
	`series_id` text,
	`series_name` text,
	`mode` text NOT NULL,
	`focus` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_index` integer DEFAULT 0 NOT NULL,
	`time_limit_minutes` integer NOT NULL,
	`outcome` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todo_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Personal' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`due_at` text,
	`reminder_at` text,
	`status` text DEFAULT 'open' NOT NULL,
	`completed_at` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
