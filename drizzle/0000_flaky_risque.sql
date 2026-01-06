CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text,
	`image` text,
	`email_verified` integer,
	`role` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`landlord_id` text,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`country` text DEFAULT 'US' NOT NULL,
	`property_type` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`year_built` integer,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `property_managers` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`user_id` text NOT NULL,
	`split_percentage` integer NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`proposed_by` text NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `unit_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`unit_number` text,
	`bedrooms` integer NOT NULL,
	`bathrooms` real NOT NULL,
	`sqft` integer,
	`rent_amount` integer NOT NULL,
	`deposit_amount` integer,
	`status` text DEFAULT 'unlisted' NOT NULL,
	`available_date` integer,
	`features` text,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `application_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`applicant_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`date_of_birth` text,
	`ssn` text,
	`current_address` text,
	`current_city` text,
	`current_state` text,
	`current_zip` text,
	`current_rent` integer,
	`current_landlord` text,
	`current_landlord_phone` text,
	`move_in_date` integer,
	`employer` text,
	`employer_phone` text,
	`job_title` text,
	`monthly_income` integer,
	`employment_start_date` integer,
	`additional_occupants` text,
	`has_pets` integer,
	`pets` text,
	`references` text,
	`background_check_consent` integer,
	`background_check_consent_date` integer,
	`decided_by` text,
	`decided_at` integer,
	`decision_notes` text,
	`submitted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leases` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`monthly_rent` integer NOT NULL,
	`security_deposit` integer,
	`late_fee_amount` integer,
	`late_fee_grace_days` integer DEFAULT 5,
	`move_in_date` integer,
	`move_out_date` integer,
	`move_in_inspection_notes` text,
	`move_out_inspection_notes` text,
	`renewal_offered_at` integer,
	`renewal_status` text DEFAULT 'not_offered',
	`renewed_from_lease_id` text,
	`terms` text,
	`pet_policy` text DEFAULT 'no_pets',
	`pet_deposit` integer,
	`parking_spaces` integer DEFAULT 0,
	`lease_document_url` text,
	`signed_at` integer,
	`signed_by_tenant_at` integer,
	`signed_by_landlord_at` integer,
	`terminated_at` integer,
	`termination_reason` text,
	`terminated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`terminated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rent_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`lease_id` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`due_date` integer NOT NULL,
	`amount_due` integer NOT NULL,
	`amount_paid` integer DEFAULT 0,
	`late_fee` integer DEFAULT 0,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`paid_at` integer,
	`payment_method` text,
	`payment_reference` text,
	`stripe_payment_intent_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lease_id`) REFERENCES `leases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `maintenance_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`is_internal` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `maintenance_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `maintenance_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`lease_id` text,
	`requested_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to` text,
	`assigned_at` integer,
	`scheduled_date` integer,
	`scheduled_time_slot` text,
	`permission_to_enter` integer DEFAULT false,
	`completed_at` integer,
	`completed_by` text,
	`completion_notes` text,
	`resolution_summary` text,
	`estimated_cost` integer,
	`actual_cost` integer,
	`cost_approved_by` text,
	`cost_approved_at` integer,
	`hours_spent` real,
	`photos` text,
	`rating` integer,
	`feedback` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lease_id`) REFERENCES `leases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cost_approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_email` text,
	`organization_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`description` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
