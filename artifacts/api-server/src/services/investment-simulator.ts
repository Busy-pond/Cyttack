/**
 * InvestmentSimulatorService
 *
 * POST /api/simulation/:id/investment
 *
 * Given a set of toggled security controls, re-derives attack success
 * probability, risk score, MTTD, MTTR, and resilience score WITHOUT
 * mutating the original simulation. Persists an InvestmentScenario record.
 */
import { randomUUID } from "crypto";
import { db, investmentScenariosTable, simulationSessionsTable, virtualOrganizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { MITRE_STAGES } from "./mitre-engine.js";
import { computeAdjustedProbability } from "./attack-engine.js";
import type { OrgSecurityControls } from "@workspace/db";

export interface InvestmentPayload {
  firewall?: boolean;
  mfa?: boolean;
  edr?: boolean;
  patchManagement?: boolean;
  networkSegmentation?: boolean;
  employeeAwareness?: boolean;
}

export interface InvestmentResult {
  recalculatedAttackSuccessProbability: number;
  recalculatedRiskScore: number;
  recalculatedMTTD: number;
  recalculatedMTTR: number;
  resilienceScore: number;
}

export async function simulateInvestment(
  simulationId: string,
  payload: InvestmentPayload,
): Promise<InvestmentResult & { id: string }> {
  // Load the existing org and session
  const [org] = await db
    .select()
    .from(virtualOrganizationsTable)
    .where(eq(virtualOrganizationsTable.simulationId, simulationId))
    .limit(1);

  if (!org) {
    throw new Error(`No virtual organization found for simulation ${simulationId}`);
  }

  // Merge proposed controls onto the existing org controls (cast from jsonb)
  const existingControls = org.securityControls as OrgSecurityControls;
  const hypotheticalControls: OrgSecurityControls = {
    ...existingControls,
    ...Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ),
  };

  // Build a hypothetical org for probability calculation
  const hypotheticalOrg = { ...org, securityControls: hypotheticalControls };

  // --- Attack Success Probability ---
  // Probability of completing all stages through exfiltration (index 0–9)
  const stageProbabilities = MITRE_STAGES.slice(0, 10).map((s) =>
    computeAdjustedProbability(s, hypotheticalOrg as any),
  );
  const attackSuccessProb =
    stageProbabilities.reduce((acc, p) => acc * p, 1);

  // --- Risk Score ---
  // Sum of risk contributions weighted by their probability
  const riskScore = MITRE_STAGES.slice(0, 12).reduce((acc, s) => {
    const p = computeAdjustedProbability(s, hypotheticalOrg as any);
    return acc + s.riskContrib * p;
  }, 0);

  // --- MTTD (Mean Time To Detect, hours) ---
  // Baseline 72h; each detection-improving control reduces it
  let mttd = 72;
  if (hypotheticalControls.edr) mttd -= 24;
  if (hypotheticalControls.networkSegmentation) mttd -= 8;
  if (hypotheticalControls.firewall) mttd -= 4;
  mttd = Math.max(4, mttd);

  // --- MTTR (Mean Time To Respond, hours) ---
  // Baseline 168h; controls reduce it
  let mttr = 168;
  if (hypotheticalControls.edr) mttr -= 48;
  if (hypotheticalControls.patchManagement) mttr -= 24;
  if (hypotheticalControls.networkSegmentation) mttr -= 16;
  if (hypotheticalControls.mfa) mttr -= 8;
  mttr = Math.max(8, mttr);

  // --- Resilience Score (0–100) ---
  const controlsEnabled = Object.values(hypotheticalControls).filter(Boolean).length;
  const resilienceScore = Math.min(
    100,
    Math.round(30 + controlsEnabled * 12 - attackSuccessProb * 30),
  );

  const result: InvestmentResult = {
    recalculatedAttackSuccessProbability: Math.round(attackSuccessProb * 10000) / 100,
    recalculatedRiskScore: Math.round(Math.max(0, riskScore) * 10) / 10,
    recalculatedMTTD: mttd,
    recalculatedMTTR: mttr,
    resilienceScore,
  };

  const id = randomUUID();
  await db.insert(investmentScenariosTable).values({
    id,
    simulationId,
    firewall: hypotheticalControls.firewall,
    mfa: hypotheticalControls.mfa,
    edr: hypotheticalControls.edr,
    patchManagement: hypotheticalControls.patchManagement,
    networkSegmentation: hypotheticalControls.networkSegmentation,
    employeeAwareness: hypotheticalControls.employeeAwareness,
    ...result,
  });

  return { id, ...result };
}
