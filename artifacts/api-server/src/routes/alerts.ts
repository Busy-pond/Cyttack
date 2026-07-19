import { Router, type IRouter } from "express";
import { db, alertsTable, entitiesTable, playbooksTable } from "@workspace/db";
import {
  ListAlertsResponse,
  GetAlertParams,
  GetAlertResponse,
  UpdateAlertParams,
  UpdateAlertBody,
  UpdateAlertResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const { status, severity } = req.query;

  let query = db.select().from(alertsTable).$dynamic();

  const conditions = [];
  if (status && typeof status === "string") {
    conditions.push(eq(alertsTable.status, status));
  }
  if (severity && typeof severity === "string") {
    conditions.push(eq(alertsTable.severity, severity));
  }

  const alerts = await db
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.timestamp));

  res.json(ListAlertsResponse.parse(alerts));
});

router.get("/alerts/:id", async (req, res): Promise<void> => {
  const params = GetAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  // Get the linked entity
  const [entity] = await db
    .select()
    .from(entitiesTable)
    .where(eq(entitiesTable.id, alert.entityId));

  // Get linked playbook
  const [playbook] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.linkedIncidentId, alert.id));

  // Generate behavior deviation data (simulated)
  const now = new Date();
  const behaviorData = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const baseline = 20 + Math.sin(i * 0.5) * 5;
    // Spike starts in the last 6 hours for high-score alerts
    const isAnomaly = i >= 18 && alert.anomalyScore > 50;
    const actual = isAnomaly
      ? baseline + (alert.anomalyScore / 100) * 80 * ((i - 18) / 6)
      : baseline + (Math.random() - 0.5) * 4;
    return {
      time: t.toISOString(),
      baseline: Math.round(baseline * 10) / 10,
      actual: Math.max(0, Math.round(actual * 10) / 10),
    };
  });

  const detail = {
    ...alert,
    entity: entity ?? null,
    behaviorData,
    playbook: playbook ?? null,
  };

  res.json(GetAlertResponse.parse(detail));
});

router.patch("/alerts/:id", async (req, res): Promise<void> => {
  const params = UpdateAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAlertBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.status) updates.status = body.data.status;
  if (body.data.attackStage) updates.attackStage = body.data.attackStage;

  const [alert] = await db
    .update(alertsTable)
    .set(updates)
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(UpdateAlertResponse.parse(alert));
});

export default router;
