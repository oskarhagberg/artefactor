CREATE TABLE `view_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`artefact_id` text NOT NULL,
	`viewer_id` text NOT NULL,
	`viewed_at` integer NOT NULL,
	FOREIGN KEY (`artefact_id`) REFERENCES `artefact`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`viewer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `view_entry_artefact_viewer_uq` ON `view_entry` (`artefact_id`,`viewer_id`);--> statement-breakpoint
CREATE INDEX `view_entry_artefact_idx` ON `view_entry` (`artefact_id`);