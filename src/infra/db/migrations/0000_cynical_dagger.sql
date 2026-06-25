CREATE TABLE `artefact` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`public_slug` text,
	`status` text DEFAULT 'active' NOT NULL,
	`payload_ref` text NOT NULL,
	`payload_bytes` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artefact_public_slug_uq` ON `artefact` (`public_slug`);--> statement-breakpoint
CREATE INDEX `artefact_owner_idx` ON `artefact` (`owner_id`);--> statement-breakpoint
CREATE INDEX `artefact_status_visibility_idx` ON `artefact` (`status`,`visibility`);--> statement-breakpoint
CREATE TABLE `data_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`artefact_id` text NOT NULL,
	`author_id` text NOT NULL,
	`blob` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artefact_id`) REFERENCES `artefact`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_entry_artefact_author_uq` ON `data_entry` (`artefact_id`,`author_id`);