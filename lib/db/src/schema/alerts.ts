import { pgTable, text, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  anomalyScore: real("anomaly_score").notNull(),
  severity: text("severity").notNull(), // low | medium | high | critical
  status: text("status").notNull().default("new"), // new | investigating | contained | resolved
  attackStage: text("attack_stage").notNull(), // recon | initial_access | lateral_movement | exfiltration | impact
  description: text("description").notNull(),
  mitreTechniques: jsonb("mitre_techniques").notNull().default([]),
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  matchConfidence: real("match_confidence"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ createdAt: true, updatedAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
