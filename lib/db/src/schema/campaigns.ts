import { pgTable, text, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  matchConfidence: real("match_confidence").notNull(),
  targetSectors: jsonb("target_sectors").notNull().default([]),
  associatedTTPs: jsonb("associated_ttps").notNull().default([]),
  description: text("description").notNull(),
  originRegion: text("origin_region").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
