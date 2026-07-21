import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";

export const predictionsTable = pgTable("predictions", {
  id: text("id").primaryKey(),
  simulationId: text("simulation_id").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  predictedNextStage: text("predicted_next_stage").notNull(),
  probability: real("probability").notNull(),
  confidence: real("confidence").notNull(),
  suggestedDefensiveAction: text("suggested_defensive_action").notNull(),
});

export type Prediction = typeof predictionsTable.$inferSelect;
