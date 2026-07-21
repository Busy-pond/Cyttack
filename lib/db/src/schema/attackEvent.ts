import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const attackEventsTable = pgTable("attack_events", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  stage: text("stage").notNull(),
  mitreTechniqueId: text("mitre_technique_id").notNull(),
  assetId: text("asset_id").notNull(),
  assetType: text("asset_type").notNull(),
  // low | medium | high | critical
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  riskScoreAtEvent: real("risk_score_at_event").notNull(),
  detectionConfidenceAtEvent: real("detection_confidence_at_event").notNull(),
});

export type AttackEvent = typeof attackEventsTable.$inferSelect;
