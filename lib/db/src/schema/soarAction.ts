import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const soarActionsTable = pgTable("soar_actions", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // block_ip | isolate_endpoint | disable_account | block_process | update_firewall_rule | begin_recovery
  actionType: text("action_type").notNull(),
  targetAssetId: text("target_asset_id").notNull(),
  // pending | executed | failed
  status: text("status").notNull().default("pending"),
  rationale: text("rationale").notNull(),
});

export type SoarAction = typeof soarActionsTable.$inferSelect;
