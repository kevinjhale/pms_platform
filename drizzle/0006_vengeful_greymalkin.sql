CREATE TABLE `pm_client_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`pm_user_id` text NOT NULL,
	`landlord_user_id` text,
	`external_landlord_name` text,
	`external_landlord_email` text,
	`external_landlord_phone` text,
	`organization_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`can_create_properties` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`pm_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`landlord_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `properties` ADD `created_by_user_id` text REFERENCES users(id);