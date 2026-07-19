import { Router, type IRouter } from "express";
import { db, auditLogTable } from "@workspace/db";
import {
  ListAuditLogResponse,
  CreateAuditLogEntryBody,
  CreateAuditLogEntryResponse,
} from "@workspace/api-zod";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/audit-log", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.timestamp));
  res.json(ListAuditLogResponse.parse(entries));
});

router.post("/audit-log", async (req, res): Promise<void> => {
  const parsed = CreateAuditLogEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(auditLogTable)
    .values({
      id: randomUUID(),
      ...parsed.data,
    })
    .returning();

  res.status(201).json(CreateAuditLogEntryResponse.parse(entry));
});

export default router;
