import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";

export const simulationSessionsTable = pgTable("simulation_sessions", {
  id: text("id").primaryKey(),
  alertId: text("alert_id").notNull(),
  orgId: text("org_id").notNull(),
  // running | completed | paused
  status: text("status").notNull().default("running"),
  currentStageIndex: integer("current_stage_index").notNull().default(0),
  progressPercent: real("progress_percent").notNull().default(0),
  riskScore: real("risk_score").notNull().default(0),
  detectionConfidence: real("detection_confidence").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type SimulationSession = typeof simulationSessionsTable.$inferSelect;
