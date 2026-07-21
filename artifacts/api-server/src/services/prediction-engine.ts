/**
 * PredictionEngine — computes and persists predictions for the next likely stage.
 */
import { randomUUID } from "crypto";
import { db, predictionsTable } from "@workspace/db";
import { MITRE_STAGES, TOTAL_STAGES } from "./mitre-engine.js";
import { computeAdjustedProbability } from "./attack-engine.js";
import type { VirtualOrg } from "./virtual-org-generator.js";

const DEFENSIVE_ACTIONS: Record<string, string> = {
  recon:                 "Enable active threat intelligence and honey-pot deception assets on perimeter.",
  initial_access:        "Enforce MFA on all remote access, deploy email filtering with sandbox detonation.",
  execution:             "Enable PowerShell script-block logging and constrained-language mode on endpoints.",
  persistence:           "Deploy EDR with registry monitoring and alert on run-key modifications.",
  credential_access:     "Enable MFA, reset Active Directory service-account passwords, audit privileged access.",
  privilege_escalation:  "Apply OS patches for known LPE CVEs; enable LAPS for local admin account rotation.",
  discovery:             "Segment internal network; restrict ICMP and NetBIOS discovery across VLANs.",
  lateral_movement:      "Enable network segmentation, restrict RDP to jump-servers, enforce PAM.",
  collection:            "Apply DLP policies to file servers and database exports; monitor bulk-copy operations.",
  exfiltration:          "Block outbound traffic on non-standard ports; inspect SSL traffic at perimeter.",
  detection:             "Tune SIEM correlation rules; escalate to CERT-In and engage IR retainer.",
  containment:           "Isolate affected segments; revoke and rotate all compromised credentials immediately.",
  recovery:              "Restore from clean snapshot, re-image endpoints, conduct post-incident review.",
};

export async function computeAndPersistPrediction(
  simulationId: string,
  currentStageIndex: number,
  org: VirtualOrg,
): Promise<{
  predictedNextStage: string;
  probability: number;
  confidence: number;
  suggestedDefensiveAction: string;
}> {
  const nextIndex = Math.min(currentStageIndex + 1, TOTAL_STAGES - 1);
  const nextStage = MITRE_STAGES[nextIndex]!;
  const probability = computeAdjustedProbability(nextStage, org);

  // Confidence in the prediction is higher when the probability is more extreme
  const confidence = 0.5 + Math.abs(probability - 0.5) * 0.8;

  const suggestedDefensiveAction =
    DEFENSIVE_ACTIONS[nextStage.slug] ?? "Review security posture and harden controls.";

  const id = randomUUID();
  await db.insert(predictionsTable).values({
    id,
    simulationId,
    predictedNextStage: nextStage.name,
    probability: Math.round(probability * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    suggestedDefensiveAction,
  });

  return {
    predictedNextStage: nextStage.name,
    probability: Math.round(probability * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    suggestedDefensiveAction,
  };
}
