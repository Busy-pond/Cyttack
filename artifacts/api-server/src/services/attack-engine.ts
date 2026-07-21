/**
 * AttackEngine — resolves stage-by-stage attack outcomes.
 *
 * For each stage, given the virtual org state and security controls, determines:
 *   - Whether the attacker succeeds
 *   - Which asset is targeted
 *   - Risk score and detection confidence deltas
 *
 * Security control modifiers (documented per control):
 *   employeeAwareness: Recon −10%, Initial Access −20%
 *   firewall:          Initial Access −15%, Exfiltration −20%
 *   mfa:               Initial Access −10%, Credential Access −25%
 *   edr:               detection confidence +15% at Execution, +12% at Lateral Movement, +10% at Persistence
 *   patchManagement:   Execution −15%, Privilege Escalation −20%
 *   networkSegmentation: Lateral Movement −30%, Exfiltration −15%
 */
import type { MitreStage } from "./mitre-engine.js";
import type { VirtualOrg } from "./virtual-org-generator.js";

export interface StageResult {
  stageIndex: number;
  success: boolean;
  targetAssetId: string;
  targetAssetType: string;
  targetAssetName: string;
  adjustedProbability: number;
  riskDelta: number;
  detectionDelta: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

/** Compute the effective success probability for a stage given security controls. */
export function computeAdjustedProbability(
  stage: MitreStage,
  org: VirtualOrg,
): number {
  const c = org.securityControls;
  let p = stage.baseProbability;

  switch (stage.slug) {
    case "recon":
      if (c.employeeAwareness) p -= 0.10;
      break;
    case "initial_access":
      if (c.employeeAwareness) p -= 0.20;
      if (c.firewall) p -= 0.15;
      if (c.mfa) p -= 0.10;
      break;
    case "execution":
      if (c.patchManagement) p -= 0.15;
      break;
    case "persistence":
      if (c.edr) p -= 0.12;
      break;
    case "credential_access":
      if (c.mfa) p -= 0.25;
      break;
    case "privilege_escalation":
      if (c.patchManagement) p -= 0.20;
      break;
    case "lateral_movement":
      if (c.networkSegmentation) p -= 0.30;
      if (c.edr) p -= 0.12;
      break;
    case "exfiltration":
      if (c.firewall) p -= 0.20;
      if (c.networkSegmentation) p -= 0.15;
      break;
    case "detection":
      // Detection stage always "succeeds" (SOC detects something)
      p = 0.99;
      break;
    case "containment":
    case "recovery":
      // Defender-controlled — high base, not reduced by controls
      break;
    default:
      break;
  }

  // Clamp to [0.05, 0.99]
  return Math.min(0.99, Math.max(0.05, p));
}

/** Compute detection confidence bonus from EDR for applicable stages. */
export function edrDetectionBonus(stage: MitreStage, hasEdr: boolean): number {
  if (!hasEdr) return 0;
  switch (stage.slug) {
    case "execution":   return 15;
    case "persistence": return 10;
    case "lateral_movement": return 12;
    default: return 0;
  }
}

/** Pick the primary target asset for this stage from the org. */
function pickTargetAsset(
  stage: MitreStage,
  org: VirtualOrg,
): { id: string; type: string; name: string } {
  switch (stage.slug) {
    case "recon":
      return { id: org.firewalls[0]?.id ?? "perimeter", type: "firewall", name: "Perimeter Firewall" };
    case "initial_access":
    case "execution":
    case "persistence": {
      const ep = org.endpoints[0]!;
      const emp = org.employees.find((e) => e.id === ep.ownerEmployeeId);
      return { id: ep.id, type: "endpoint", name: emp ? `${emp.name}'s Workstation` : "Employee Workstation" };
    }
    case "credential_access":
      return { id: org.activeDirectory.id, type: "active_directory", name: "Active Directory" };
    case "privilege_escalation": {
      const ep = org.endpoints[1] ?? org.endpoints[0]!;
      return { id: ep.id, type: "endpoint", name: "Server Endpoint" };
    }
    case "discovery":
      return { id: org.fileServer.id, type: "file_server", name: "File Server" };
    case "lateral_movement":
      return { id: org.databaseServer.id, type: "database_server", name: "Database Server" };
    case "collection":
    case "exfiltration":
      return { id: org.databaseServer.id, type: "database_server", name: "Database Server" };
    case "detection":
    case "containment":
    case "recovery": {
      // Use the most recently compromised asset or the firewall
      return { id: org.firewalls[0]?.id ?? "perimeter", type: "firewall", name: "Security Operations Center" };
    }
    default:
      return { id: "org", type: "organization", name: "Organization" };
  }
}

function stageSeverity(stage: MitreStage, success: boolean): "low" | "medium" | "high" | "critical" {
  if (!success) return "low";
  const highRisk = ["initial_access", "lateral_movement", "exfiltration", "credential_access", "privilege_escalation"];
  const mediumRisk = ["execution", "persistence", "collection"];
  if (highRisk.includes(stage.slug)) return "critical";
  if (mediumRisk.includes(stage.slug)) return "high";
  return "medium";
}

/**
 * Resolve one stage using a deterministic random value (0–1) from the seeded PRNG.
 * The caller provides the random value so this function stays pure/testable.
 */
export function resolveStage(
  stage: MitreStage,
  org: VirtualOrg,
  randomValue: number,
  currentRiskScore: number,
  currentDetectionConfidence: number,
): StageResult {
  const adjustedProbability = computeAdjustedProbability(stage, org);
  const success = randomValue < adjustedProbability;

  const target = pickTargetAsset(stage, org);
  const edrBonus = edrDetectionBonus(stage, org.securityControls.edr);
  const detectionDelta = success
    ? stage.detectionContrib + edrBonus
    : Math.floor(stage.detectionContrib * 0.3) + edrBonus;
  const riskDelta = success ? stage.riskContrib : Math.floor(stage.riskContrib * 0.2);

  const description = stage.descriptionTemplate.replace("{asset}", target.name);

  return {
    stageIndex: stage.index,
    success,
    targetAssetId: target.id,
    targetAssetType: target.type,
    targetAssetName: target.name,
    adjustedProbability,
    riskDelta,
    detectionDelta,
    severity: stageSeverity(stage, success),
    description,
  };
}
