import { pgTable, text, timestamp, real, boolean } from "drizzle-orm/pg-core";

export const investmentScenariosTable = pgTable("investment_scenarios", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  firewall: boolean("firewall").notNull().default(false),
  mfa: boolean("mfa").notNull().default(false),
  edr: boolean("edr").notNull().default(false),
  patchManagement: boolean("patch_management").notNull().default(false),
  networkSegmentation: boolean("network_segmentation").notNull().default(false),
  employeeAwareness: boolean("employee_awareness").notNull().default(false),
  recalculatedAttackSuccessProbability: real(
    "recalculated_attack_success_probability",
  ).notNull(),
  recalculatedRiskScore: real("recalculated_risk_score").notNull(),
  recalculatedMTTD: real("recalculated_mttd").notNull(),
  recalculatedMTTR: real("recalculated_mttr").notNull(),
  resilienceScore: real("resilience_score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InvestmentScenario = typeof investmentScenariosTable.$inferSelect;
