/**
 * SimulationEngine — orchestrates the full simulation lifecycle.
 *
 * Runs synchronously (no background scheduler) because the existing frontend
 * endpoints expect synchronous responses. The engine advances stage-by-stage
 * in a tight loop, persisting events after each stage.
 *
 * Key invariant: simulationId === alertId, so the frontend can look up the
 * simulation using the same ID it receives from POST /simulation/start.
 */
import { randomUUID } from "crypto";
import { db, simulationSessionsTable, virtualOrganizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { MITRE_STAGES, TOTAL_STAGES, frontendStageToMaxIndex, toFrontendStage } from "./mitre-engine.js";
import { generateVirtualOrg } from "./virtual-org-generator.js";
import { resolveStage } from "./attack-engine.js";
import { persistEvent } from "./event-engine.js";
import { computeAndPersistPrediction } from "./prediction-engine.js";
import { generateAndPersistSoarActions } from "./soar-engine.js";
import { computeAndPersistImpact } from "./impact-analysis-engine.js";
import { generateAndPersistReport } from "./report-generator.js";
import { rngFromSimId } from "./seeded-random.js";
import type { OrgSecurityControls } from "@workspace/db";
import type { StageResult } from "./attack-engine.js";
import type { VirtualOrg } from "./virtual-org-generator.js";

export interface SimulationState {
  simulationId: string;
  alertId: string;
  status: string;
  currentStageIndex: number;
  progressPercent: number;
  riskScore: number;
  detectionConfidence: number;
  frontendStage: "recon" | "initial_access" | "lateral_movement" | "exfiltration" | "impact";
}

const CLAMP = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * Create a new simulation session + virtual org, run stages 0–1 synchronously.
 * Returns the final state after stage 1 (Initial Access) for backward compatibility.
 */
export async function createAndRunToInitialAccess(
  simulationId: string,
  controlOverrides?: Partial<OrgSecurityControls>,
): Promise<SimulationState> {
  const org = generateVirtualOrg(simulationId, controlOverrides);

  // Persist virtual org
  await db.insert(virtualOrganizationsTable).values({
    id: org.id,
    simulationId,
    departments: org.departments,
    employees: org.employees,
    firewalls: org.firewalls,
    activeDirectory: org.activeDirectory,
    mailServer: org.mailServer,
    databaseServer: org.databaseServer,
    fileServer: org.fileServer,
    endpoints: org.endpoints,
    cloudResources: org.cloudResources,
    securityControls: org.securityControls,
  });

  // Create session
  await db.insert(simulationSessionsTable).values({
    id: simulationId,
    alertId: simulationId,
    orgId: org.id,
    status: "running",
    currentStageIndex: 0,
    progressPercent: 0,
    riskScore: 0,
    detectionConfidence: 0,
  });

  // Run stages 0–1
  return runStagesToIndex(simulationId, org, 0, 1, []);
}

/**
 * Advance an existing simulation to the given frontend stage string.
 * Idempotent if already past the target.
 */
export async function advanceToFrontendStage(
  simulationId: string,
  targetFrontendStage: "initial_access" | "lateral_movement" | "exfiltration" | "impact",
): Promise<SimulationState> {
  const [session] = await db
    .select()
    .from(simulationSessionsTable)
    .where(eq(simulationSessionsTable.id, simulationId))
    .limit(1);

  if (!session) throw new Error(`Simulation ${simulationId} not found`);

  const [orgRow] = await db
    .select()
    .from(virtualOrganizationsTable)
    .where(eq(virtualOrganizationsTable.simulationId, simulationId))
    .limit(1);

  if (!orgRow) throw new Error(`Virtual org for simulation ${simulationId} not found`);

  const org = orgRow as unknown as VirtualOrg;
  const targetMaxIndex = frontendStageToMaxIndex(targetFrontendStage);
  const fromIndex = session.currentStageIndex + 1;

  if (fromIndex > targetMaxIndex) {
    // Already past target — return current state
    return {
      simulationId,
      alertId: session.alertId,
      status: session.status,
      currentStageIndex: session.currentStageIndex,
      progressPercent: session.progressPercent,
      riskScore: session.riskScore,
      detectionConfidence: session.detectionConfidence,
      frontendStage: toFrontendStage(session.currentStageIndex),
    };
  }

  return runStagesToIndex(
    simulationId,
    org,
    fromIndex,
    targetMaxIndex,
    [],
    session.riskScore,
    session.detectionConfidence,
  );
}

/**
 * Core: run stage resolution in a loop from fromIndex to toIndex (inclusive).
 * Persists events and updates session after each stage.
 */
async function runStagesToIndex(
  simulationId: string,
  org: VirtualOrg,
  fromIndex: number,
  toIndex: number,
  previousResults: StageResult[],
  startRisk = 0,
  startDetection = 0,
): Promise<SimulationState> {
  const rng = rngFromSimId(simulationId);
  // Fast-forward RNG past stages already completed (reproducibility)
  for (let i = 0; i < fromIndex; i++) rng();

  let riskScore = startRisk;
  let detectionConfidence = startDetection;
  const allResults: StageResult[] = [...previousResults];
  let lastStageIndex = fromIndex > 0 ? fromIndex - 1 : 0;

  const soarTriggered = fromIndex <= 10 && toIndex >= 10;
  const impactTriggered = fromIndex <= 11 && toIndex >= 11;
  const isComplete = toIndex >= TOTAL_STAGES - 1;

  for (let i = fromIndex; i <= Math.min(toIndex, TOTAL_STAGES - 1); i++) {
    const stage = MITRE_STAGES[i]!;
    const randomValue = rng();
    const result = resolveStage(stage, org, randomValue, riskScore, detectionConfidence);

    riskScore = CLAMP(riskScore + result.riskDelta, 0, 100);
    detectionConfidence = CLAMP(detectionConfidence + result.detectionDelta, 0, 100);

    await persistEvent(simulationId, result, stage, riskScore, detectionConfidence);
    allResults.push(result);
    lastStageIndex = i;

    // Trigger SOAR at Detection stage
    if (i === 10 && soarTriggered) {
      await generateAndPersistSoarActions(simulationId, org);
    }

    // Trigger impact analysis at Containment stage
    if (i === 11 && impactTriggered) {
      await computeAndPersistImpact(simulationId, org, allResults);
    }
  }

  // Compute prediction for next stage
  if (lastStageIndex < TOTAL_STAGES - 1) {
    await computeAndPersistPrediction(simulationId, lastStageIndex, org);
  }

  const progressPercent = Math.round(((lastStageIndex + 1) / TOTAL_STAGES) * 100);
  const newStatus = isComplete ? "completed" : "running";

  // Update session
  await db
    .update(simulationSessionsTable)
    .set({
      currentStageIndex: lastStageIndex,
      progressPercent,
      riskScore,
      detectionConfidence,
      status: newStatus,
      ...(isComplete ? { completedAt: new Date() } : {}),
    })
    .where(eq(simulationSessionsTable.id, simulationId));

  // Generate report if simulation is complete
  if (isComplete) {
    await generateAndPersistReport(simulationId);
  }

  return {
    simulationId,
    alertId: simulationId,
    status: newStatus,
    currentStageIndex: lastStageIndex,
    progressPercent,
    riskScore,
    detectionConfidence,
    frontendStage: toFrontendStage(lastStageIndex),
  };
}

/**
 * Read current simulation state from the DB (used by GET /simulation/:id/state).
 */
export async function getSimulationState(simulationId: string): Promise<SimulationState | null> {
  const [session] = await db
    .select()
    .from(simulationSessionsTable)
    .where(eq(simulationSessionsTable.id, simulationId))
    .limit(1);

  if (!session) return null;

  return {
    simulationId,
    alertId: session.alertId,
    status: session.status,
    currentStageIndex: session.currentStageIndex,
    progressPercent: session.progressPercent,
    riskScore: session.riskScore,
    detectionConfidence: session.detectionConfidence,
    frontendStage: toFrontendStage(session.currentStageIndex),
  };
}
