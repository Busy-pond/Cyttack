import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playbooksTable = pgTable("playbooks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  linkedIncidentId: text("linked_incident_id").notNull(),
  steps: jsonb("steps").notNull().default([]),
  overallStatus: text("overall_status").notNull().default("idle"), // idle | running | awaiting_approval | completed | failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlaybookSchema = createInsertSchema(playbooksTable).omit({ createdAt: true, updatedAt: true });
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;
export type Playbook = typeof playbooksTable.$inferSelect;
