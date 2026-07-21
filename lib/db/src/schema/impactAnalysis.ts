import { pgTable, text, timestamp, real, jsonb } from "drizzle-orm/pg-core";

export const impactAnalysisTable = pgTable("impact_analysis", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  affectedDepartments: jsonb("affected_departments")
    .$type<string[]>()
    .notNull()
    .default([]),
  criticalAssetsAffected: jsonb("critical_assets_affected")
    .$type<string[]>()
    .notNull()
    .default([]),
  businessImpactSummary: text("business_impact_summary").notNull(),
  estimatedFinancialLoss: real("estimated_financial_loss").notNull(),
  recoveryEstimateHours: real("recovery_estimate_hours").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ImpactAnalysis = typeof impactAnalysisTable.$inferSelect;
