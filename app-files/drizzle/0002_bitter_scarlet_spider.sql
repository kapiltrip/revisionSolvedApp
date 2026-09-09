CREATE TABLE `subtopics` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`label` text NOT NULL,
	`covered` integer DEFAULT false NOT NULL,
	`covered_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`source_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
