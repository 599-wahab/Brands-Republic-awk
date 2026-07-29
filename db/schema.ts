import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  location: text("location").notNull().default(""),
  status: text("status").notNull().default("One-time"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
}, (table) => [
  uniqueIndex("customers_email_unique").on(table.email),
  index("customers_status_idx").on(table.status),
]);

export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  summary: text("summary").notNull(),
  remarks: text("remarks").notNull().default(""),
  sentiment: text("sentiment").notNull().default("Neutral"),
  happenedAt: text("happened_at").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("interactions_customer_idx").on(table.customerId), index("interactions_date_idx").on(table.happenedAt)]);

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueAt: text("due_at").notNull(),
  priority: text("priority").notNull().default("Normal"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("reminders_customer_idx").on(table.customerId), index("reminders_due_idx").on(table.dueAt)]);

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  category: text("category").notNull(),
  comment: text("comment").notNull(),
  status: text("status").notNull().default("Open"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("feedback_customer_idx").on(table.customerId), index("feedback_status_idx").on(table.status)]);

export const revenue = sqliteTable("revenue", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  amountPence: integer("amount_pence").notNull(),
  type: text("type").notNull(),
  reference: text("reference").notNull().default(""),
  note: text("note").notNull().default(""),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("revenue_customer_idx").on(table.customerId), index("revenue_date_idx").on(table.occurredAt)]);
