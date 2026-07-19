import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogTable = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(), // system | analyst | ciso
  actionType: text("action_type").notNull(),
  description: text("description").notNull(),
  relatedIncidentId: text("related_incident_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogTable);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogTable.$inferSelect;
