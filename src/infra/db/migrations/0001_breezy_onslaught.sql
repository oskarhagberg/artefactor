CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_artefact` (
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
	`archived_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_artefact`("id", "owner_id", "title", "kind", "visibility", "public_slug", "status", "payload_ref", "payload_bytes", "payload_hash", "created_at", "updated_at", "archived_at") SELECT "id", "owner_id", "title", "kind", "visibility", "public_slug", "status", "payload_ref", "payload_bytes", "payload_hash", "created_at", "updated_at", "archived_at" FROM `artefact`;--> statement-breakpoint
DROP TABLE `artefact`;--> statement-breakpoint
ALTER TABLE `__new_artefact` RENAME TO `artefact`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `artefact_public_slug_uq` ON `artefact` (`public_slug`);--> statement-breakpoint
CREATE INDEX `artefact_owner_idx` ON `artefact` (`owner_id`);--> statement-breakpoint
CREATE INDEX `artefact_status_visibility_idx` ON `artefact` (`status`,`visibility`);--> statement-breakpoint
CREATE TABLE `__new_data_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`artefact_id` text NOT NULL,
	`author_id` text NOT NULL,
	`blob` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artefact_id`) REFERENCES `artefact`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_data_entry`("id", "artefact_id", "author_id", "blob", "created_at", "updated_at") SELECT "id", "artefact_id", "author_id", "blob", "created_at", "updated_at" FROM `data_entry`;--> statement-breakpoint
DROP TABLE `data_entry`;--> statement-breakpoint
ALTER TABLE `__new_data_entry` RENAME TO `data_entry`;--> statement-breakpoint
CREATE UNIQUE INDEX `data_entry_artefact_author_uq` ON `data_entry` (`artefact_id`,`author_id`);