CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'One-time' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`rating` integer NOT NULL,
	`category` text NOT NULL,
	`comment` text NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feedback_customer_idx` ON `feedback` (`customer_id`);--> statement-breakpoint
CREATE INDEX `feedback_status_idx` ON `feedback` (`status`);--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`channel` text NOT NULL,
	`summary` text NOT NULL,
	`remarks` text DEFAULT '' NOT NULL,
	`sentiment` text DEFAULT 'Neutral' NOT NULL,
	`happened_at` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `interactions_customer_idx` ON `interactions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `interactions_date_idx` ON `interactions` (`happened_at`);--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`title` text NOT NULL,
	`due_at` text NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reminders_customer_idx` ON `reminders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `reminders_due_idx` ON `reminders` (`due_at`);--> statement-breakpoint
CREATE TABLE `revenue` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`amount_pence` integer NOT NULL,
	`type` text NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `revenue_customer_idx` ON `revenue` (`customer_id`);--> statement-breakpoint
CREATE INDEX `revenue_date_idx` ON `revenue` (`occurred_at`);
--> statement-breakpoint
INSERT INTO `customers` (`id`,`name`,`email`,`phone`,`location`,`status`,`created_at`,`updated_at`) VALUES
('cust-aisha','Aisha Rahman','aisha.rahman@example.com','+44 7700 900121','London, UK','Returning','2026-01-10T09:00:00.000Z','2026-07-29T08:45:00.000Z'),
('cust-james','James Miller','j.miller@example.com','+44 7700 900122','Manchester, UK','One-time','2026-03-16T10:20:00.000Z','2026-07-28T15:20:00.000Z'),
('cust-sofia','Sofia Oliveira','sofia.o@example.com','+351 910 000 123','Lisbon, PT','Abandoned cart','2026-05-02T12:00:00.000Z','2026-07-27T11:10:00.000Z'),
('cust-daniel','Daniel Kim','daniel.kim@example.com','+44 7700 900124','Birmingham, UK','Returning','2026-02-21T14:00:00.000Z','2026-07-26T16:00:00.000Z'),
('cust-layla','Layla Noor','layla.noor@example.com','+44 7700 900125','Leeds, UK','Needs review','2026-06-11T09:30:00.000Z','2026-07-25T09:30:00.000Z'),
('cust-elliot','Elliot Turner','elliot.t@example.com','+44 7700 900126','Bristol, UK','Returning','2026-04-05T13:15:00.000Z','2026-07-24T13:15:00.000Z'),
('cust-mina','Mina Ahmed','mina.a@example.com','+44 7700 900127','Cardiff, UK','One-time','2026-06-25T10:10:00.000Z','2026-07-23T10:10:00.000Z');
--> statement-breakpoint
INSERT INTO `interactions` (`id`,`customer_id`,`channel`,`summary`,`remarks`,`sentiment`,`happened_at`,`created_by`,`created_at`) VALUES
('int-1','cust-aisha','Call','Discussed autumn collection reorder','Aisha liked the new colour range and expects approval by Friday. Follow up with the wholesale price sheet.','Positive','2026-07-29T08:45:00.000Z','adnan@brandsrepublic.co.uk','2026-07-29T08:47:00.000Z'),
('int-2','cust-james','Email','Shared delivery update','Confirmed the Manchester delivery window. No action unless the courier schedule changes.','Neutral','2026-07-28T15:20:00.000Z','adnan@brandsrepublic.co.uk','2026-07-28T15:22:00.000Z'),
('int-3','cust-sofia','WhatsApp','Asked about abandoned basket','Customer is still interested but wants sizing details before completing checkout.','Positive','2026-07-27T11:10:00.000Z','adnan@brandsrepublic.co.uk','2026-07-27T11:12:00.000Z'),
('int-4','cust-daniel','Meeting','Quarterly account review','Strong performance this quarter. Discussed increasing order volume for September.','Positive','2026-07-26T16:00:00.000Z','adnan@brandsrepublic.co.uk','2026-07-26T16:30:00.000Z'),
('int-5','cust-layla','Call','Could not confirm contact details','Phone number may be outdated. Verify details before the next campaign.','Negative','2026-07-25T09:30:00.000Z','adnan@brandsrepublic.co.uk','2026-07-25T09:35:00.000Z');
--> statement-breakpoint
INSERT INTO `reminders` (`id`,`customer_id`,`title`,`due_at`,`priority`,`completed`,`created_by`,`created_at`) VALUES
('rem-1','cust-aisha','Send wholesale price sheet','2026-07-30T09:00:00.000Z','High',0,'adnan@brandsrepublic.co.uk','2026-07-29T08:48:00.000Z'),
('rem-2','cust-sofia','Send sizing guide and checkout link','2026-07-29T15:00:00.000Z','High',0,'adnan@brandsrepublic.co.uk','2026-07-27T11:13:00.000Z'),
('rem-3','cust-daniel','Prepare September volume proposal','2026-08-03T10:00:00.000Z','Normal',0,'adnan@brandsrepublic.co.uk','2026-07-26T16:35:00.000Z'),
('rem-4','cust-layla','Verify phone and email details','2026-07-28T09:00:00.000Z','High',0,'adnan@brandsrepublic.co.uk','2026-07-25T09:36:00.000Z'),
('rem-5','cust-james','Confirm delivery completed','2026-07-29T12:00:00.000Z','Normal',1,'adnan@brandsrepublic.co.uk','2026-07-28T15:23:00.000Z');
--> statement-breakpoint
INSERT INTO `feedback` (`id`,`customer_id`,`rating`,`category`,`comment`,`status`,`created_at`) VALUES
('feed-1','cust-aisha',5,'Product','Excellent new collection and very helpful account support.','Open','2026-07-28T12:00:00.000Z'),
('feed-2','cust-james',4,'Delivery','Delivery communication was good, though the original estimate changed.','Open','2026-07-27T17:30:00.000Z'),
('feed-3','cust-sofia',3,'Website','Sizing information was difficult to find during checkout.','Open','2026-07-27T11:05:00.000Z'),
('feed-4','cust-daniel',5,'Service','Quarterly account review was clear and useful.','Resolved','2026-07-26T17:10:00.000Z');
--> statement-breakpoint
INSERT INTO `revenue` (`id`,`customer_id`,`amount_pence`,`type`,`reference`,`note`,`occurred_at`,`created_at`) VALUES
('rev-1','cust-aisha',184500,'Wholesale order','BR-1048','Autumn collection deposit','2026-07-24T10:00:00.000Z','2026-07-24T10:00:00.000Z'),
('rev-2','cust-james',8420,'Online order','WEB-8821','','2026-07-22T14:20:00.000Z','2026-07-22T14:20:00.000Z'),
('rev-3','cust-daniel',325000,'Wholesale order','BR-1039','Quarterly stock order','2026-07-18T09:00:00.000Z','2026-07-18T09:00:00.000Z'),
('rev-4','cust-aisha',96000,'Wholesale order','BR-1027','','2026-06-28T11:00:00.000Z','2026-06-28T11:00:00.000Z'),
('rev-5','cust-elliot',12950,'Online order','WEB-8704','','2026-06-21T16:45:00.000Z','2026-06-21T16:45:00.000Z'),
('rev-6','cust-mina',6790,'Online order','WEB-8650','','2026-06-10T13:10:00.000Z','2026-06-10T13:10:00.000Z');
