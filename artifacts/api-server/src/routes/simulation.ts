import { Router, type IRouter } from "express";
import { db, alertsTable, entitiesTable, playbooksTable, auditLogTable } from "@workspace/db";
import {
  StartAttackSimulationResponse,
  AdvanceSimulationBody,
  AdvanceSimulationResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const SIM_MITRE_TECHNIQUES = [
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access" },
  { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" },
  { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
];

router.post("/simulation/start", async (req, res): Promise<void> => {
  // Pick a random critical entity
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

  // Create the simulated alert
  const [alert] = await db
    .insert(alertsTable)
    .values({
      id: simId,
      entityId: target.id,
      entityName: target.name,
      anomalyScore: 91,
      severity: "critical",
      status: "new",
      attackStage: "initial_access",
      description: `[SIMULATION] Anomalous authentication burst detected from external IP range 185.220.101.x. ${target.name} shows credential stuffing pattern consistent with APT-level initial access tooling.`,
      mitreTechniques: SIM_MITRE_TECHNIQUES.slice(0, 2),
      campaignId: "campaign-silent-ledger",
      campaignName: "Silent Ledger",
      matchConfidence: 78,
      timestamp: new Date(),
    })
    .returning();

  // Create a playbook for the simulated incident
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

  // Update entity status
  await db
    .update(entitiesTable)
    .set({ status: "anomalous" })
    .where(eq(entitiesTable.id, target.id));

  // Log simulation start
  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "system",
    actionType: "SIMULATION_STARTED",
    description: `Attack simulation initiated targeting ${target.name}. Scenario: APT credential compromise via spearphishing.`,
    relatedIncidentId: simId,
  });

  res.json(StartAttackSimulationResponse.parse(alert));
});

router.post("/simulation/advance", async (req, res): Promise<void> => {
  const body = AdvanceSimulationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { incidentId, stage } = body.data;

  const stageMitreMap: Record<string, typeof SIM_MITRE_TECHNIQUES> = {
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
    impact: "[SIMULATION] Ransomware payload detected encrypting critical files on 3 hosts. T1486 confirmed. Estimated blast radius: 12 servers across 2 network segments.",
  };

  const techniques = stageMitreMap[stage] ?? SIM_MITRE_TECHNIQUES;
  const description = stageDescriptions[stage] ?? `[SIMULATION] Attack advanced to ${stage} stage.`;

  const [alert] = await db
    .update(alertsTable)
    .set({
      attackStage: stage,
      anomalyScore: stage === "exfiltration" ? 96 : stage === "impact" ? 99 : 93,
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

  // Log stage advancement
  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "system",
    actionType: "SIMULATION_ADVANCED",
    description: `Simulation advanced to stage: ${stage}. ${techniques.map((t) => t.id).join(", ")} techniques detected.`,
    relatedIncidentId: incidentId,
  });

  res.json(AdvanceSimulationResponse.parse(alert));
});

export default router;
