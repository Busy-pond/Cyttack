import { Router, type IRouter } from "express";
import { db, alertsTable, entitiesTable } from "@workspace/db";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

const TEMPLATED_RESPONSES: Record<string, (data: { alerts: unknown[]; entities: unknown[] }) => string> = {
  default: ({ alerts, entities }) =>
    `Based on current telemetry across ${(entities as unknown[]).length} monitored entities, I've identified ${(alerts as unknown[]).length} active incidents. The highest-priority threat is currently at the lateral movement stage. Recommend reviewing the automated containment playbook for AIIMS-DB-01.`,

  status: ({ alerts }) =>
    `Current threat posture: ${(alerts as { severity: string }[]).filter((a) => a.severity === "critical").length} critical, ${(alerts as { severity: string }[]).filter((a) => a.severity === "high").length} high-severity incidents active. Overall risk score is elevated. ${(alerts as { status: string }[]).filter((a) => a.status === "contained").length} threats have been successfully contained in the last 24h.`,

  server: ({ alerts }) => {
    const related = (alerts as { entityName: string; description: string; attackStage: string }[]).filter((a) =>
      a.entityName?.toLowerCase().includes("server") ||
      a.entityName?.toLowerCase().includes("db") ||
      a.entityName?.toLowerCase().includes("portal")
    );
    if (related.length === 0) return "No anomalous activity detected on server-class entities in the current observation window.";
    return `${related.length} server-class entities flagged: ${related.map((a) => `${a.entityName} (${a.attackStage})`).join(", ")}. Primary concern is ${related[0]?.description ?? "unusual process activity"}. Isolation playbook available.`;
  },

  lateral: () =>
    "Lateral movement indicators detected via T1021.001 (Remote Desktop Protocol) and T1055 (Process Injection) techniques. Threat actor appears to be pivoting from the exam portal toward internal database servers. Recommend immediate network segmentation enforcement.",

  exfil: () =>
    "Exfiltration risk: T1041 (Exfiltration Over C2 Channel) technique signatures observed on PowerGrid-SCADA-Node-3. Data volume anomaly: 3.4 GB outbound to 185.220.101.x range in the past 6 hours. C2 channel suspected — traffic pattern matches APT campaign 'Phantom Circuit' TTPs.",

  apt: () =>
    "Highest-confidence APT match: 'Silent Ledger' (72%) — a state-sponsored group historically targeting financial regulators and government databases. Secondary match: 'Phantom Circuit' (58%) targeting critical infrastructure OT systems. Recommend threat intelligence sharing with CERT-In.",
};

function getTemplatedResponse(message: string, data: { alerts: unknown[]; entities: unknown[] }): string {
  const lower = message.toLowerCase();

  if (lower.includes("status") || lower.includes("overview") || lower.includes("summary")) {
    return TEMPLATED_RESPONSES.status(data);
  }
  if (lower.includes("server") || lower.includes("aiims") || lower.includes("cbse") || lower.includes("db")) {
    return TEMPLATED_RESPONSES.server(data);
  }
  if (lower.includes("lateral") || lower.includes("movement") || lower.includes("pivot")) {
    return TEMPLATED_RESPONSES.lateral(data);
  }
  if (lower.includes("exfil") || lower.includes("data") || lower.includes("c2") || lower.includes("outbound")) {
    return TEMPLATED_RESPONSES.exfil(data);
  }
  if (lower.includes("apt") || lower.includes("campaign") || lower.includes("threat actor") || lower.includes("attribution")) {
    return TEMPLATED_RESPONSES.apt(data);
  }

  return TEMPLATED_RESPONSES.default(data);
}

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const alerts = await db.select().from(alertsTable).orderBy(desc(alertsTable.timestamp)).limit(10);
  const entities = await db.select().from(entitiesTable);

  let reply: string;

  // Try Anthropic if API key available
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 512,
          system:
            "You are Cyttack, a SOC (Security Operations Center) AI assistant for India's national critical infrastructure defense. Answer concisely and technically. Use only the provided incident data context. Be direct — no filler phrases. Format key findings as bullet points when listing multiple items.",
          messages: [
            {
              role: "user",
              content: `Context — Active Incidents: ${JSON.stringify(alerts.slice(0, 5))}\n\nEntities: ${JSON.stringify(entities.slice(0, 5))}\n\nSOC Analyst Question: ${parsed.data.message}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          content?: Array<{ type: string; text: string }>;
        };
        reply = data.content?.[0]?.text ?? getTemplatedResponse(parsed.data.message, { alerts, entities });
      } else {
        reply = getTemplatedResponse(parsed.data.message, { alerts, entities });
      }
    } catch {
      reply = getTemplatedResponse(parsed.data.message, { alerts, entities });
    }
  } else {
    reply = getTemplatedResponse(parsed.data.message, { alerts, entities });
  }

  res.json(SendChatMessageResponse.parse({ reply }));
});

export default router;
