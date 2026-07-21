/**
 * MITREEngine — source of truth for the 13-stage attack chain.
 *
 * Each stage has:
 *   - baseProbability: base chance the stage succeeds (0–1) before control modifiers
 *   - riskContrib: points added to riskScore when stage succeeds (negative = containment)
 *   - detectionContrib: points added to detectionConfidence when stage executes
 *
 * Security control modifiers (applied in AttackEngine):
 *   - employeeAwareness: Recon −10%, Initial Access −20%
 *   - firewall:          Initial Access −15%, Exfiltration −20%
 *   - mfa:               Initial Access −10%, Credential Access −25%
 *   - edr:               detection +15% at Execution, +12% at Lateral Movement, +10% at Persistence
 *   - patchManagement:   Execution −15%, Privilege Escalation −20%
 *   - networkSegmentation: Lateral Movement −30%, Exfiltration −15%
 */

export interface MitreStage {
  index: number;
  name: string;
  /** Short slug for internal use */
  slug: string;
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  /** Base probability [0,1] that the attacker succeeds at this stage */
  baseProbability: number;
  /** Risk score delta when this stage succeeds (can be negative for containment) */
  riskContrib: number;
  /** Detection confidence delta when this stage runs */
  detectionContrib: number;
  /** One-line description template */
  descriptionTemplate: string;
}

export const MITRE_STAGES: MitreStage[] = [
  {
    index: 0,
    name: "Reconnaissance",
    slug: "recon",
    techniqueId: "T1595",
    techniqueName: "Active Scanning",
    tactic: "Reconnaissance",
    baseProbability: 0.95,
    riskContrib: 5,
    detectionContrib: 2,
    descriptionTemplate:
      "[SIM] Attacker conducting active network scan against perimeter — port sweep and service fingerprinting detected on external IP range.",
  },
  {
    index: 1,
    name: "Initial Access",
    slug: "initial_access",
    techniqueId: "T1566.001",
    techniqueName: "Spearphishing Attachment",
    tactic: "Initial Access",
    baseProbability: 0.75,
    riskContrib: 15,
    detectionContrib: 8,
    descriptionTemplate:
      "[SIM] Spearphishing email with malicious attachment delivered to {asset}. Macro execution observed — foothold established.",
  },
  {
    index: 2,
    name: "Execution",
    slug: "execution",
    techniqueId: "T1059.001",
    techniqueName: "PowerShell",
    tactic: "Execution",
    baseProbability: 0.70,
    riskContrib: 10,
    detectionContrib: 10,
    descriptionTemplate:
      "[SIM] PowerShell script execution detected on {asset} — encoded command spawning child processes consistent with post-exploitation framework.",
  },
  {
    index: 3,
    name: "Persistence",
    slug: "persistence",
    techniqueId: "T1547.001",
    techniqueName: "Registry Run Keys",
    tactic: "Persistence",
    baseProbability: 0.65,
    riskContrib: 8,
    detectionContrib: 6,
    descriptionTemplate:
      "[SIM] Registry run key modification detected on {asset} — attacker establishing persistence mechanism to survive reboots.",
  },
  {
    index: 4,
    name: "Credential Access",
    slug: "credential_access",
    techniqueId: "T1110.003",
    techniqueName: "Password Spraying",
    tactic: "Credential Access",
    baseProbability: 0.60,
    riskContrib: 12,
    detectionContrib: 8,
    descriptionTemplate:
      "[SIM] Password spraying attack against Active Directory — {asset} accounts targeted. Multiple authentication failures followed by success.",
  },
  {
    index: 5,
    name: "Privilege Escalation",
    slug: "privilege_escalation",
    techniqueId: "T1068",
    techniqueName: "Exploitation for Privilege Escalation",
    tactic: "Privilege Escalation",
    baseProbability: 0.55,
    riskContrib: 12,
    detectionContrib: 10,
    descriptionTemplate:
      "[SIM] Local privilege escalation exploit executed on {asset} — attacker now operating with SYSTEM/root privileges.",
  },
  {
    index: 6,
    name: "Discovery",
    slug: "discovery",
    techniqueId: "T1083",
    techniqueName: "File and Directory Discovery",
    tactic: "Discovery",
    baseProbability: 0.80,
    riskContrib: 5,
    detectionContrib: 5,
    descriptionTemplate:
      "[SIM] Internal network enumeration underway from {asset} — attacker mapping file shares, AD structure, and high-value targets.",
  },
  {
    index: 7,
    name: "Lateral Movement",
    slug: "lateral_movement",
    techniqueId: "T1021.001",
    techniqueName: "Remote Desktop Protocol",
    tactic: "Lateral Movement",
    baseProbability: 0.65,
    riskContrib: 15,
    detectionContrib: 12,
    descriptionTemplate:
      "[SIM] RDP lateral movement from {asset} to adjacent server — T1021.001 confirmed. Process injection artifacts in memory.",
  },
  {
    index: 8,
    name: "Collection",
    slug: "collection",
    techniqueId: "T1005",
    techniqueName: "Data from Local System",
    tactic: "Collection",
    baseProbability: 0.70,
    riskContrib: 8,
    detectionContrib: 8,
    descriptionTemplate:
      "[SIM] Sensitive data staging detected on {asset} — attacker aggregating files prior to exfiltration.",
  },
  {
    index: 9,
    name: "Exfiltration",
    slug: "exfiltration",
    techniqueId: "T1041",
    techniqueName: "Exfiltration Over C2 Channel",
    tactic: "Exfiltration",
    baseProbability: 0.55,
    riskContrib: 15,
    detectionContrib: 15,
    descriptionTemplate:
      "[SIM] Outbound traffic spike from {asset} — 2.1 GB encrypted tunnel to known C2 infrastructure on port 443.",
  },
  {
    index: 10,
    name: "Detection",
    slug: "detection",
    techniqueId: "T1082",
    techniqueName: "System Information Discovery",
    tactic: "Defense Evasion",
    baseProbability: 0.90,
    riskContrib: 3,
    detectionContrib: 25,
    descriptionTemplate:
      "[SIM] Anomaly detection triggered on {asset} — SIEM correlation rules fired; SOC analyst alerted.",
  },
  {
    index: 11,
    name: "Containment",
    slug: "containment",
    techniqueId: "T1489",
    techniqueName: "Service Stop",
    tactic: "Impact",
    baseProbability: 0.85,
    riskContrib: -10,
    detectionContrib: 10,
    descriptionTemplate:
      "[SIM] Containment actions executed — {asset} isolated from network; compromised credentials revoked.",
  },
  {
    index: 12,
    name: "Recovery",
    slug: "recovery",
    techniqueId: "T1490",
    techniqueName: "Inhibit System Recovery",
    tactic: "Impact",
    baseProbability: 0.90,
    riskContrib: -15,
    detectionContrib: 5,
    descriptionTemplate:
      "[SIM] Recovery procedures initiated — {asset} restored from clean snapshot; firewall rules updated.",
  },
];

export const TOTAL_STAGES = MITRE_STAGES.length; // 13

/** Map engine stage slug to the frontend's limited attackStage enum */
export function toFrontendStage(
  stageIndex: number,
): "recon" | "initial_access" | "lateral_movement" | "exfiltration" | "impact" {
  if (stageIndex === 0) return "recon";
  if (stageIndex === 1) return "initial_access";
  if (stageIndex >= 2 && stageIndex <= 7) return "lateral_movement";
  if (stageIndex >= 8 && stageIndex <= 9) return "exfiltration";
  return "impact"; // 10–12
}

/** Map frontend stage string to max engine stageIndex to advance to */
export function frontendStageToMaxIndex(
  stage: "initial_access" | "lateral_movement" | "exfiltration" | "impact",
): number {
  switch (stage) {
    case "initial_access":
      return 1;
    case "lateral_movement":
      return 7;
    case "exfiltration":
      return 9;
    case "impact":
      return 12;
  }
}
