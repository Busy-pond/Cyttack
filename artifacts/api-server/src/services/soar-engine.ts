/**
 * SOAREngine — generates and persists ordered SOAR response actions.
 * Triggered once the simulation reaches the Detection stage (index 10).
 */
import { randomUUID } from "crypto";
import { db, soarActionsTable } from "@workspace/db";
import type { VirtualOrg } from "./virtual-org-generator.js";

export type SoarActionType =
  | "block_ip"
  | "isolate_endpoint"
  | "disable_account"
  | "block_process"
  | "update_firewall_rule"
  | "begin_recovery";

interface ActionTemplate {
  actionType: SoarActionType;
  getRationale: (org: VirtualOrg) => string;
  getTargetAssetId: (org: VirtualOrg) => string;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    actionType: "block_ip",
    getRationale: () =>
      "Block known C2 IP range 185.220.101.0/24 at the perimeter to cut attacker command-and-control channel.",
    getTargetAssetId: (org) => org.firewalls[0]?.id ?? "perimeter",
  },
  {
    actionType: "isolate_endpoint",
    getRationale: () =>
      "Isolate the compromised endpoint from the network segment to prevent further lateral movement.",
    getTargetAssetId: (org) => org.endpoints[0]?.id ?? "endpoint-0",
  },
  {
    actionType: "disable_account",
    getRationale: () =>
      "Disable compromised Active Directory accounts to revoke attacker's credential foothold.",
    getTargetAssetId: (org) => org.activeDirectory.id,
  },
  {
    actionType: "block_process",
    getRationale: () =>
      "Terminate and block the malicious PowerShell process spawned by the post-exploitation framework.",
    getTargetAssetId: (org) => org.endpoints[1]?.id ?? org.endpoints[0]?.id ?? "endpoint-0",
  },
  {
    actionType: "update_firewall_rule",
    getRationale: () =>
      "Update perimeter firewall rules to block outbound traffic on port 443 to known-malicious IPs.",
    getTargetAssetId: (org) => org.firewalls[0]?.id ?? "perimeter",
  },
  {
    actionType: "begin_recovery",
    getRationale: () =>
      "Initiate recovery procedure: restore database server and file server from last clean snapshot.",
    getTargetAssetId: (org) => org.databaseServer.id,
  },
];

export async function generateAndPersistSoarActions(
  simulationId: string,
  org: VirtualOrg,
): Promise<void> {
  const rows = ACTION_TEMPLATES.map((template, i) => ({
    id: randomUUID(),
    simulationId,
    actionType: template.actionType,
    targetAssetId: template.getTargetAssetId(org),
    // First two actions execute immediately, rest are pending
    status: i < 2 ? "executed" : "pending",
    rationale: template.getRationale(org),
  }));

  await db.insert(soarActionsTable).values(rows);
}
