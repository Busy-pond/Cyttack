import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const entitiesTable = pgTable("entities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // user | server | workstation | ot-device | network-segment
  criticality: text("criticality").notNull(), // low | medium | high | critical
  status: text("status").notNull().default("normal"), // normal | anomalous | contained
  baselineScore: real("baseline_score"),
  currentScore: real("current_score"),
  ipAddress: text("ip_address"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEntitySchema = createInsertSchema(entitiesTable).omit({ createdAt: true, updatedAt: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entitiesTable.$inferSelect;
