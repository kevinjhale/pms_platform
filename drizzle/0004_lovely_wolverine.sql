CREATE TABLE `lease_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`lease_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`amount_type` text DEFAULT 'fixed' NOT NULL,
	`fixed_amount` integer,
	`estimated_amount` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lease_id`) REFERENCES `leases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`rent_payment_id` text NOT NULL,
	`lease_charge_id` text,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`amount_due` integer NOT NULL,
	`amount_paid` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`rent_payment_id`) REFERENCES `rent_payments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lease_charge_id`) REFERENCES `lease_charges`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `integration_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`integration_key` text NOT NULL,
	`setting_key` text NOT NULL,
	`value` text NOT NULL,
	`is_encrypted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_settings_unique_idx` ON `integration_settings` (`organization_id`,`integration_key`,`setting_key`);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `apn` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `utility_water` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `utility_trash` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `utility_electricity` text;--> statement-breakpoint
ALTER TABLE `units` ADD `listed_date` integer;--> statement-breakpoint
ALTER TABLE `leases` ADD `co_signer_name` text;--> statement-breakpoint
ALTER TABLE `leases` ADD `co_signer_email` text;--> statement-breakpoint
ALTER TABLE `leases` ADD `co_signer_phone` text;--> statement-breakpoint
ALTER TABLE `leases` ADD `payment_status` text DEFAULT 'current';--> statement-breakpoint
ALTER TABLE `leases` ADD `cleaning_fee` integer;