/**
 * ImpactAnalysisEngine — computes business impact once compromised assets are finalized.
 * Triggered after the Containment stage (index 11).
 */
import { randomUUID } from "crypto";
import { db, impactAnalysisTable } from "@workspace/db";
import type { VirtualOrg } from "./virtual-org-generator.js";
import type { StageResult } from "./attack-engine.js";

const CRITICALITY_LOSS_USD: Record<string, number> = {
  low:      50_000,
  medium:  200_000,
  high:    750_000,
  critical: 2_500_000,
};

const CRITICALITY_RECOVERY_HOURS: Record<string, number> = {
  low:      4,
  medium:  12,
  high:    48,
  critical: 120,
};

export async function computeAndPersistImpact(
  simulationId: string,
  org: VirtualOrg,
  stageResults: StageResult[],
): Promise<{
  affectedDepartments: string[];
  criticalAssetsAffected: string[];
  businessImpactSummary: string;
  estimatedFinancialLoss: number;
  recoveryEstimateHours: number;
}> {
  // Collect compromised asset IDs from successful stage results
  const compromisedAssetIds = new Set(
    stageResults
      .filter((r) => r.success)
      .map((r) => r.targetAssetId),
  );

  // Map compromised endpoints → employees → departments
  const compromisedDeptIds = new Set<string>();
  for (const ep of org.endpoints) {
    if (compromisedAssetIds.has(ep.id)) {
      const emp = org.employees.find((e) => e.id === ep.ownerEmployeeId);
      if (emp) compromisedDeptIds.add(emp.departmentId);
    }
  }

  const affectedDepartments = org.departments
    .filter((d) => compromisedDeptIds.has(d.id))
    .map((d) => d.name);

  // Critical assets: db server, file server, AD if compromised
  const criticalAssetsAffected: string[] = [];
  if (compromisedAssetIds.has(org.databaseServer.id)) criticalAssetsAffected.push("Database Server");
  if (compromisedAssetIds.has(org.fileServer.id)) criticalAssetsAffected.push("File Server");
  if (compromisedAssetIds.has(org.activeDirectory.id)) criticalAssetsAffected.push("Active Directory");
  if (org.cloudResources.some((c) => compromisedAssetIds.has(c.id))) criticalAssetsAffected.push("Cloud Resources");

  // Financial loss: sum based on department criticality × count
  let estimatedFinancialLoss = 0;
  let maxRecoveryHours = 0;
  for (const dept of org.departments.filter((d) => compromisedDeptIds.has(d.id))) {
    estimatedFinancialLoss += CRITICALITY_LOSS_USD[dept.criticality] ?? 200_000;
    maxRecoveryHours = Math.max(
      maxRecoveryHours,
      CRITICALITY_RECOVERY_HOURS[dept.criticality] ?? 12,
    );
  }

  // DB server compromise multiplies loss
  if (compromisedAssetIds.has(org.databaseServer.id)) {
    const multiplier =
      org.databaseServer.sensitivityLevel === "critical" ? 2.5 :
      org.databaseServer.sensitivityLevel === "high"     ? 1.8 : 1.2;
    estimatedFinancialLoss *= multiplier;
    maxRecoveryHours = Math.max(maxRecoveryHours, CRITICALITY_RECOVERY_HOURS[org.databaseServer.sensitivityLevel] ?? 48);
  }

  estimatedFinancialLoss = Math.round(estimatedFinancialLoss);

  const businessImpactSummary = [
    `${affectedDepartments.length} department(s) impacted: ${affectedDepartments.join(", ") || "none confirmed"}.`,
    criticalAssetsAffected.length
      ? `Critical assets compromised: ${criticalAssetsAffected.join(", ")}.`
      : "No critical server assets directly compromised.",
    `Estimated financial exposure: ₹${(estimatedFinancialLoss / 100_000).toFixed(1)} Lakh.`,
    `Recovery estimate: ${maxRecoveryHours} hours to restore full operations.`,
  ].join(" ");

  await db.insert(impactAnalysisTable).values({
    id: randomUUID(),
    simulationId,
    affectedDepartments,
    criticalAssetsAffected,
    businessImpactSummary,
    estimatedFinancialLoss,
    recoveryEstimateHours: maxRecoveryHours || 8,
  });

  return {
    affectedDepartments,
    criticalAssetsAffected,
    businessImpactSummary,
    estimatedFinancialLoss,
    recoveryEstimateHours: maxRecoveryHours || 8,
  };
}
