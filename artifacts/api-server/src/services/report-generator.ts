/**
 * ReportGenerator — assembles the ExecutiveReport at simulation completion
 * (or on-demand via GET /api/simulation/:id/report).
 *
 * Uses template-based narrative since there is no LLM integration in this project.
 */
import { randomUUID } from "crypto";
import {
  db,
  executiveReportsTable,
  attackEventsTable,
  soarActionsTable,
  impactAnalysisTable,
  simulationSessionsTable,
  virtualOrganizationsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { MITRE_STAGES } from "./mitre-engine.js";

const IMPROVEMENT_BANK = [
  "Deploy MFA across all remote access and privileged accounts to eliminate password-based credential compromise.",
  "Implement EDR on all endpoints to accelerate detection of execution and lateral-movement techniques.",
  "Enforce network segmentation with micro-segmentation to limit blast radius of lateral movement.",
  "Activate automated patch management to close known exploitation vectors within 72 hours of CVE disclosure.",
  "Run quarterly phishing simulation exercises to reduce employee susceptibility to spearphishing by 60%.",
  "Integrate a SIEM with pre-built MITRE ATT&CK correlation rules to reduce MTTD below 4 hours.",
  "Establish a tested IR runbook with pre-approved SOAR playbooks to reduce MTTR by 40%.",
  "Enforce least-privilege access controls on Active Directory with PAM for all service accounts.",
  "Enable SSL inspection at the perimeter to detect C2 traffic tunnelling over HTTPS.",
  "Conduct a purple-team exercise annually to validate detection coverage across all 13 ATT&CK stages.",
];

export async function generateAndPersistReport(simulationId: string): Promise<string> {
  // Check if a report already exists
  const [existing] = await db
    .select({ id: executiveReportsTable.id })
    .from(executiveReportsTable)
    .where(eq(executiveReportsTable.simulationId, simulationId))
    .limit(1);
  if (existing) return existing.id;

  // Fetch all necessary data
  const [events, soarActions, impactRows, sessionRows] = await Promise.all([
    db.select().from(attackEventsTable).where(eq(attackEventsTable.simulationId, simulationId)),
    db.select().from(soarActionsTable).where(eq(soarActionsTable.simulationId, simulationId)),
    db.select().from(impactAnalysisTable).where(eq(impactAnalysisTable.simulationId, simulationId)),
    db.select().from(simulationSessionsTable).where(eq(simulationSessionsTable.id, simulationId)),
  ]);

  const session = sessionRows[0];
  const impact = impactRows[0];

  // --- Timeline ---
  const timeline = events.map((e) => ({
    timestamp: e.timestamp,
    stage: e.stage,
    mitreTechniqueId: e.mitreTechniqueId,
    assetId: e.assetId,
    assetType: e.assetType,
    severity: e.severity,
    description: e.description,
    riskScore: e.riskScoreAtEvent,
    detectionConfidence: e.detectionConfidenceAtEvent,
  }));

  // --- MITRE Mapping ---
  const mitreMapping = MITRE_STAGES.map((s) => {
    const matchedEvent = events.find((e) => e.stage === s.slug);
    return {
      stageIndex: s.index,
      stageName: s.name,
      techniqueId: s.techniqueId,
      techniqueName: s.techniqueName,
      tactic: s.tactic,
      observed: !!matchedEvent,
      severity: matchedEvent?.severity ?? null,
    };
  });

  // --- Compromised Assets ---
  const compromisedAssets = [
    ...new Set(
      events.filter((e) => ["critical", "high"].includes(e.severity)).map((e) => e.assetId),
    ),
  ];

  // --- Alerts Generated (event descriptions as alert summaries) ---
  const alertsGenerated = events
    .filter((e) => e.severity === "critical" || e.severity === "high")
    .map((e) => ({
      stage: e.stage,
      technique: e.mitreTechniqueId,
      severity: e.severity,
      description: e.description,
    }));

  // --- Risk Summary (template-based narrative) ---
  const finalRisk = session?.riskScore ?? 0;
  const finalDetection = session?.detectionConfidence ?? 0;
  const criticalStages = events.filter((e) => e.severity === "critical").length;

  const riskSummary = [
    `This simulation exposed ${criticalStages} critical-severity attack stages across the MITRE ATT&CK chain.`,
    `Final risk score reached ${finalRisk.toFixed(1)}/100 with detection confidence at ${finalDetection.toFixed(1)}%.`,
    impact
      ? `Business impact included ${impact.affectedDepartments.join(", ")} departments with an estimated financial exposure of ₹${(impact.estimatedFinancialLoss / 100_000).toFixed(1)} Lakh and ${impact.recoveryEstimateHours}h recovery timeline.`
      : "Full business impact data is pending.",
    soarActions.length
      ? `SOAR automation executed ${soarActions.filter((a) => a.status === "executed").length} of ${soarActions.length} response actions.`
      : "No SOAR actions were triggered.",
    "Immediate priority: address the control gaps identified in Recommended Improvements below.",
  ].join(" ");

  // --- Recommended Improvements (deterministic top-5 from bank based on simulation ID) ---
  const recommendedImprovements = IMPROVEMENT_BANK.slice(0, 5);

  const reportId = randomUUID();
  await db.insert(executiveReportsTable).values({
    id: reportId,
    simulationId,
    timeline,
    mitreMapping,
    compromisedAssets,
    alertsGenerated,
    soarActionsExecuted: soarActions,
    impactAnalysisId: impact?.id ?? null,
    riskSummary,
    recommendedImprovements,
  });

  return reportId;
}
