CREATE TABLE `maven_archive` (
	`id` text PRIMARY KEY NOT NULL,
	`source_table` text NOT NULL,
	`payload` text NOT NULL,
	`archived_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maven_attachment_chunks` (
	`attachment_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`data_base64` text NOT NULL,
	PRIMARY KEY(`attachment_id`, `chunk_index`)
);
--> statement-breakpoint
CREATE TABLE `maven_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_length` integer NOT NULL,
	`sha256` text NOT NULL,
	`data_base64` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maven_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`assignment_number` integer,
	`question_number` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`trainer` text DEFAULT '' NOT NULL,
	`review_date` text,
	`repair_action` text DEFAULT '' NOT NULL,
	`source_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maven_events` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maven_migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`applied_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maven_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`current_assignment` integer DEFAULT 7 NOT NULL,
	`updated_at` text NOT NULL
);
