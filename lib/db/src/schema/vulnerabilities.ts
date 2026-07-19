import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vulnerabilitiesTable = pgTable("vulnerabilities", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  assetName: text("asset_name").notNull(),
  cveId: text("cve_id").notNull(),
  cvssScore: real("cvss_score").notNull(),
  exploitabilityScore: real("exploitability_score").notNull(),
  businessCriticality: text("business_criticality").notNull(), // low | medium | high | critical
  recommendedAction: text("recommended_action").notNull(), // patch_now | patch_later | monitor
  patchStatus: text("patch_status").notNull().default("unpatched"), // unpatched | in_progress | patched
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilitiesTable).omit({ createdAt: true, updatedAt: true });
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilitiesTable.$inferSelect;
