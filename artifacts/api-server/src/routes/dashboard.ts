import { Router, type IRouter } from "express";
import { db, alertsTable, entitiesTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRiskTrendResponse,
} from "@workspace/api-zod";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  // Count active incidents (non-resolved)
  const [activeResult] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(sql`${alertsTable.status} != 'resolved'`);
  const activeIncidents = activeResult?.count ?? 0;

  // Count critical alerts
  const [criticalResult] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(eq(alertsTable.severity, "critical"));
  const criticalAlerts = criticalResult?.count ?? 0;

  // Count contained threats
  const [containedResult] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(eq(alertsTable.status, "contained"));
  const containedThreats = containedResult?.count ?? 0;

  // Count entities
  const [entitiesResult] = await db.select({ count: count() }).from(entitiesTable);
  const entitiesMonitored = entitiesResult?.count ?? 0;

  // Calculate risk score based on active incidents weighted by severity
  const allAlerts = await db.select().from(alertsTable);
  const totalAnomaly = allAlerts.reduce((sum, a) => sum + (a.anomalyScore ?? 0), 0);
  const riskScore = allAlerts.length > 0 ? Math.min(100, totalAnomaly / allAlerts.length) : 15;

  // Alerts by attack stage
  const stageRows = await db
    .select({
      label: alertsTable.attackStage,
      count: count(),
    })
    .from(alertsTable)
    .groupBy(alertsTable.attackStage);

  // Alerts by severity
  const severityRows = await db
    .select({
      label: alertsTable.severity,
      count: count(),
    })
    .from(alertsTable)
    .groupBy(alertsTable.severity);

  const summary = {
    activeIncidents: Number(activeIncidents),
    criticalAlerts: Number(criticalAlerts),
    riskScore: Math.round(riskScore * 10) / 10,
    mttd: 4.2, // mean time to detect (hours, simulated)
    mttr: 18.7, // mean time to respond (hours, simulated)
    entitiesMonitored: Number(entitiesMonitored),
    containedThreats: Number(containedThreats),
    alertsByStage: stageRows.map((r) => ({ label: r.label, count: Number(r.count) })),
    alertsBySeverity: severityRows.map((r) => ({ label: r.label, count: Number(r.count) })),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/risk-trend", async (req, res): Promise<void> => {
  // Generate 30-day risk trend with realistic patterns
  const now = new Date();
  const trendPoints = [];

  let baseRisk = 25;
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Simulated spikes on days 20, 10, and last 3 days
    const dayOffset = 29 - i;
    let spike = 0;
    if (dayOffset >= 9 && dayOffset <= 11) spike = 30 + Math.random() * 20;
    if (dayOffset >= 19 && dayOffset <= 21) spike = 20 + Math.random() * 15;
    if (dayOffset >= 26) spike = 35 + (dayOffset - 26) * 8 + Math.random() * 10;

    baseRisk = Math.max(10, Math.min(95, baseRisk + (Math.random() - 0.5) * 3));
    trendPoints.push({
      time: t.toISOString().split("T")[0],
      score: Math.round(Math.min(95, baseRisk + spike) * 10) / 10,
    });
  }

  res.json(GetRiskTrendResponse.parse(trendPoints));
});

export default router;
