/**
 * Simulation routes — backward-compatible + new CyberTwin endpoints.
 *
 * Existing (unchanged contract — same path, method, response shape):
 *   POST /api/simulation/start   → StartAttackSimulationResponse (Alert shape)
 *   POST /api/simulation/advance → AdvanceSimulationResponse (Alert shape)
 *
 * New additive endpoints:
 *   GET  /api/simulation/:id/state      → current stage, progress, risk, detection, SOAR status
 *   GET  /api/simulation/:id/timeline   → ordered AttackEvents
 *   GET  /api/simulation/:id/prediction → latest Prediction
 *   GET  /api/simulation/:id/soar       → SOARActions and statuses
 *   GET  /api/simulation/:id/impact     → ImpactAnalysis
 *   POST /api/simulation/:id/investment → InvestmentScenario (what-if)
 *   GET  /api/simulation/:id/report     → ExecutiveReport
 */
import { Router, type IRouter } from "express";
import {
  db,
  alertsTable,
  entitiesTable,
  playbooksTable,
  auditLogTable,
  attackEventsTable,
  predictionsTable,
  soarActionsTable,
  impactAnalysisTable,
  executiveReportsTable,
} from "@workspace/db";
import {
  StartAttackSimulationResponse,
  AdvanceSimulationBody,
  AdvanceSimulationResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  createAndRunToInitialAccess,
  advanceToFrontendStage,
  getSimulationState,
} from "../services/simulation-engine.js";
import { generateAndPersistReport } from "../services/report-generator.js";
import { simulateInvestment } from "../services/investment-simulator.js";

const router: IRouter = Router();

/** Serialize a Drizzle alert row so Date fields become ISO strings for Zod validation. */
function serializeAlert(alert: Record<string, unknown>): Record<string, unknown> {
  return {
    ...alert,
    timestamp: alert["timestamp"] instanceof Date ? alert["timestamp"].toISOString() : alert["timestamp"],
    createdAt: undefined,
    updatedAt: undefined,
  };
}

// ---------------------------------------------------------------------------
// EXISTING: POST /simulation/start
// Returns the same Alert shape as before. Internally creates a full
// SimulationSession + VirtualOrganization and runs the engine to Initial Access.
// ---------------------------------------------------------------------------
router.post("/simulation/start", async (req, res): Promise<void> => {
  // Pick a random critical entity (kept for backward compat — entityId/entityName in response)
  const entities = await db
    .select()
    .from(entitiesTable)
    .where(eq(entitiesTable.criticality, "critical"));

  const target = entities[Math.floor(Math.random() * entities.length)] ?? entities[0];

  if (!target) {
    res.status(500).json({ error: "No entities available for simulation" });
    return;
  }

  const simId = randomUUID();
  const playbookId = randomUUID();

  // --- Run the new engine synchronously to Initial Access ---
  const engineState = await createAndRunToInitialAccess(simId);

  // --- Create the alert in the same shape the frontend expects ---
  const [alert] = await db
    .insert(alertsTable)
    .values({
      id: simId,
      entityId: target.id,
      entityName: target.name,
      anomalyScore: Math.min(99, Math.round(40 + engineState.riskScore)),
      severity: "critical",
      status: "new",
      attackStage: "initial_access",
      description: `[SIMULATION] Anomalous authentication burst detected from external IP range 185.220.101.x. ${target.name} shows credential stuffing pattern consistent with APT-level initial access tooling. Engine risk score: ${engineState.riskScore.toFixed(1)}.`,
      mitreTechniques: [
        { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access" },
        { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" },
      ],
      campaignId: "campaign-silent-ledger",
      campaignName: "Silent Ledger",
      matchConfidence: Math.round(70 + engineState.detectionConfidence * 0.3),
      timestamp: new Date(),
    })
    .returning();

  // --- Create containment playbook ---
  await db.insert(playbooksTable).values({
    id: playbookId,
    name: "APT Containment — Credential Compromise",
    linkedIncidentId: simId,
    overallStatus: "idle",
    steps: [
      { step: 0, action: "Isolate affected endpoint from network segment", requiresApproval: false, status: "pending" },
      { step: 1, action: "Revoke all active sessions and force credential rotation", requiresApproval: true, status: "pending" },
      { step: 2, action: "Block source IP range 185.220.101.0/24 at perimeter firewall", requiresApproval: false, status: "pending" },
      { step: 3, action: "Snapshot VM state for forensic preservation", requiresApproval: true, status: "pending" },
      { step: 4, action: "Notify CERT-In and escalate to CISO", requiresApproval: false, status: "pending" },
    ],
  });

  // --- Update entity status ---
  await db
    .update(entitiesTable)
    .set({ status: "anomalous" })
    .where(eq(entitiesTable.id, target.id));

  // --- Audit log ---
  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "system",
    actionType: "SIMULATION_STARTED",
    description: `CyberTwin simulation initiated targeting ${target.name}. Engine risk score at initial access: ${engineState.riskScore.toFixed(1)}.`,
    relatedIncidentId: simId,
  });

  res.json(StartAttackSimulationResponse.parse(serializeAlert(alert as Record<string, unknown>)));
});

// ---------------------------------------------------------------------------
// EXISTING: POST /simulation/advance
// Returns the same updated Alert shape. Internally advances the engine.
// ---------------------------------------------------------------------------
router.post("/simulation/advance", async (req, res): Promise<void> => {
  const body = AdvanceSimulationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { incidentId, stage } = body.data;

  // Map frontend stage → engine advance (ignores 'initial_access' as already at it)
  if (stage !== "initial_access") {
    try {
      await advanceToFrontendStage(incidentId, stage);
    } catch {
      // Engine may not have a session for legacy simulations — fall through gracefully
    }
  }

  // Build the response data matching the old structure
  const stageMitreMap: Record<string, Array<{ id: string; name: string; tactic: string }>> = {
    initial_access: [
      { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access" },
      { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" },
    ],
    lateral_movement: [
      { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
      { id: "T1055", name: "Process Injection", tactic: "Defense Evasion" },
    ],
    exfiltration: [
      { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
      { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" },
    ],
    impact: [
      { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" },
      { id: "T1491", name: "Defacement", tactic: "Impact" },
    ],
  };

  const stageDescriptions: Record<string, string> = {
    lateral_movement: "[SIMULATION] Threat actor pivoting from initial foothold — RDP traffic observed to adjacent database server. T1021.001 confirmed. Process injection artifacts found in memory.",
    exfiltration: "[SIMULATION] Outbound traffic spike detected: 2.1 GB to 185.220.101.47 (known C2 infrastructure). SSL-encrypted tunnel over port 443. Data exfiltration in progress.",
    impact: "[SIMULATION] Detection, containment, and recovery procedures complete. Full MITRE ATT&CK chain traversed. Executive report generated.",
  };

  const techniques = stageMitreMap[stage] ?? stageMitreMap["lateral_movement"]!;
  const description = stageDescriptions[stage] ?? `[SIMULATION] Attack advanced to ${stage} stage.`;
  const anomalyScore = stage === "exfiltration" ? 96 : stage === "impact" ? 99 : 93;

  const [alert] = await db
    .update(alertsTable)
    .set({
      attackStage: stage === "impact" ? "impact" : (stage as "recon" | "initial_access" | "lateral_movement" | "exfiltration" | "impact"),
      anomalyScore,
      severity: "critical",
      mitreTechniques: techniques,
      description,
    })
    .where(eq(alertsTable.id, incidentId))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Simulation incident not found" });
    return;
  }

  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "system",
    actionType: "SIMULATION_ADVANCED",
    description: `Simulation advanced to stage: ${stage}. ${techniques.map((t) => t.id).join(", ")} techniques detected.`,
    relatedIncidentId: incidentId,
  });

  res.json(AdvanceSimulationResponse.parse(serializeAlert(alert as Record<string, unknown>)));
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/state
// ---------------------------------------------------------------------------
router.get("/simulation/:id/state", async (req, res): Promise<void> => {
  const { id } = req.params;
  const state = await getSimulationState(id);
  if (!state) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }

  // Include active SOAR actions count in state
  const soarActions = await db
    .select()
    .from(soarActionsTable)
    .where(eq(soarActionsTable.simulationId, id));

  res.json({
    ...state,
    soarStatus: {
      total: soarActions.length,
      executed: soarActions.filter((a) => a.status === "executed").length,
      pending: soarActions.filter((a) => a.status === "pending").length,
    },
  });
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/timeline
// ---------------------------------------------------------------------------
router.get("/simulation/:id/timeline", async (req, res): Promise<void> => {
  const { id } = req.params;
  const events = await db
    .select()
    .from(attackEventsTable)
    .where(eq(attackEventsTable.simulationId, id));

  res.json(events);
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/prediction
// ---------------------------------------------------------------------------
router.get("/simulation/:id/prediction", async (req, res): Promise<void> => {
  const { id } = req.params;
  const [prediction] = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.simulationId, id))
    .orderBy(desc(predictionsTable.timestamp))
    .limit(1);

  if (!prediction) {
    res.status(404).json({ error: "No prediction found for this simulation" });
    return;
  }
  res.json(prediction);
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/soar
// ---------------------------------------------------------------------------
router.get("/simulation/:id/soar", async (req, res): Promise<void> => {
  const { id } = req.params;
  const actions = await db
    .select()
    .from(soarActionsTable)
    .where(eq(soarActionsTable.simulationId, id));

  res.json(actions);
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/impact
// ---------------------------------------------------------------------------
router.get("/simulation/:id/impact", async (req, res): Promise<void> => {
  const { id } = req.params;
  const [impact] = await db
    .select()
    .from(impactAnalysisTable)
    .where(eq(impactAnalysisTable.simulationId, id))
    .limit(1);

  if (!impact) {
    res.status(404).json({ error: "Impact analysis not yet available — advance the simulation to the impact stage." });
    return;
  }
  res.json(impact);
});

// ---------------------------------------------------------------------------
// NEW: POST /simulation/:id/investment
// ---------------------------------------------------------------------------
router.post("/simulation/:id/investment", async (req, res): Promise<void> => {
  const { id } = req.params;
  const payload = req.body as {
    firewall?: boolean;
    mfa?: boolean;
    edr?: boolean;
    patchManagement?: boolean;
    networkSegmentation?: boolean;
    employeeAwareness?: boolean;
  };

  try {
    const result = await simulateInvestment(id, payload);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "Investment simulation failed" });
  }
});

// ---------------------------------------------------------------------------
// NEW: GET /simulation/:id/report
// ---------------------------------------------------------------------------
router.get("/simulation/:id/report", async (req, res): Promise<void> => {
  const { id } = req.params;

  // Check if the simulation exists
  const state = await getSimulationState(id);
  if (!state) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }

  // Generate report on demand (idempotent — won't duplicate if already exists)
  await generateAndPersistReport(id);

  const [report] = await db
    .select()
    .from(executiveReportsTable)
    .where(eq(executiveReportsTable.simulationId, id))
    .limit(1);

  if (!report) {
    res.status(404).json({ error: "Report could not be generated" });
    return;
  }

  res.json(report);
});

export default router;
