import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const executiveReportsTable = pgTable("executive_reports", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  timeline: jsonb("timeline").$type<object[]>().notNull().default([]),
  mitreMapping: jsonb("mitre_mapping").$type<object[]>().notNull().default([]),
  compromisedAssets: jsonb("compromised_assets")
    .$type<string[]>()
    .notNull()
    .default([]),
  alertsGenerated: jsonb("alerts_generated")
    .$type<object[]>()
    .notNull()
    .default([]),
  soarActionsExecuted: jsonb("soar_actions_executed")
    .$type<object[]>()
    .notNull()
    .default([]),
  impactAnalysisId: text("impact_analysis_id"),
  riskSummary: text("risk_summary").notNull(),
  recommendedImprovements: jsonb("recommended_improvements")
    .$type<string[]>()
    .notNull()
    .default([]),
});

export type ExecutiveReport = typeof executiveReportsTable.$inferSelect;
