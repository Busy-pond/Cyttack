/**
 * EventEngine — persists AttackEvent records for each stage resolution.
 */
import { randomUUID } from "crypto";
import { db, attackEventsTable } from "@workspace/db";
import type { StageResult } from "./attack-engine.js";
import type { MitreStage } from "./mitre-engine.js";

export interface PersistedEvent {
  id: string;
  simulationId: string;
  stage: string;
  mitreTechniqueId: string;
  assetId: string;
  assetType: string;
  severity: string;
  description: string;
  riskScoreAtEvent: number;
  detectionConfidenceAtEvent: number;
  timestamp: Date;
}

export async function persistEvent(
  simulationId: string,
  stageResult: StageResult,
  mitreStage: MitreStage,
  riskScoreAtEvent: number,
  detectionConfidenceAtEvent: number,
): Promise<PersistedEvent> {
  const id = randomUUID();
  const [event] = await db
    .insert(attackEventsTable)
    .values({
      id,
      simulationId,
      stage: mitreStage.slug,
      mitreTechniqueId: mitreStage.techniqueId,
      assetId: stageResult.targetAssetId,
      assetType: stageResult.targetAssetType,
      severity: stageResult.severity,
      description: stageResult.description,
      riskScoreAtEvent,
      detectionConfidenceAtEvent,
    })
    .returning();

  return event!;
}
