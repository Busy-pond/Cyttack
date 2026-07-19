import { Router, type IRouter } from "express";
import { db, playbooksTable, auditLogTable } from "@workspace/db";
import {
  ListPlaybooksResponse,
  GetPlaybookParams,
  GetPlaybookResponse,
  ExecutePlaybookParams,
  ExecutePlaybookBody,
  ExecutePlaybookResponse,
  ApprovePlaybookStepParams,
  ApprovePlaybookStepBody,
  ApprovePlaybookStepResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

type PlaybookStep = {
  step: number;
  action: string;
  requiresApproval: boolean;
  status: "pending" | "running" | "awaiting_approval" | "done" | "failed";
};

const router: IRouter = Router();

router.get("/playbooks", async (req, res): Promise<void> => {
  const playbooks = await db.select().from(playbooksTable);
  res.json(ListPlaybooksResponse.parse(playbooks));
});

router.get("/playbooks/:id", async (req, res): Promise<void> => {
  const params = GetPlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [playbook] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.id, params.data.id));

  if (!playbook) {
    res.status(404).json({ error: "Playbook not found" });
    return;
  }

  res.json(GetPlaybookResponse.parse(playbook));
});

router.post("/playbooks/:id/execute", async (req, res): Promise<void> => {
  const params = ExecutePlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ExecutePlaybookBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [playbook] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.id, params.data.id));

  if (!playbook) {
    res.status(404).json({ error: "Playbook not found" });
    return;
  }

  const steps = playbook.steps as PlaybookStep[];
  const stepIndex = body.data.stepIndex;

  if (stepIndex < 0 || stepIndex >= steps.length) {
    res.status(400).json({ error: "Invalid step index" });
    return;
  }

  const step = steps[stepIndex];

  // If step requires approval, set to awaiting_approval
  if (step.requiresApproval && step.status === "pending") {
    steps[stepIndex] = { ...step, status: "awaiting_approval" };
  } else {
    steps[stepIndex] = { ...step, status: "running" };
  }

  const overallStatus = steps[stepIndex].status === "awaiting_approval"
    ? "awaiting_approval"
    : "running";

  const [updated] = await db
    .update(playbooksTable)
    .set({ steps, overallStatus })
    .where(eq(playbooksTable.id, params.data.id))
    .returning();

  // Log the action
  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "analyst",
    actionType: "PLAYBOOK_STEP_STARTED",
    description: `Initiated playbook step: ${step.action}`,
    relatedIncidentId: playbook.linkedIncidentId,
  });

  res.json(ExecutePlaybookResponse.parse(updated));
});

router.post("/playbooks/:id/approve", async (req, res): Promise<void> => {
  const params = ApprovePlaybookStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ApprovePlaybookStepBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [playbook] = await db
    .select()
    .from(playbooksTable)
    .where(eq(playbooksTable.id, params.data.id));

  if (!playbook) {
    res.status(404).json({ error: "Playbook not found" });
    return;
  }

  const steps = playbook.steps as PlaybookStep[];
  const stepIndex = body.data.stepIndex;

  if (stepIndex < 0 || stepIndex >= steps.length) {
    res.status(400).json({ error: "Invalid step index" });
    return;
  }

  // Mark current step as done, move to next
  steps[stepIndex] = { ...steps[stepIndex], status: "done" };

  const nextIndex = stepIndex + 1;
  let overallStatus: string = "running";

  if (nextIndex >= steps.length) {
    overallStatus = "completed";
  } else {
    steps[nextIndex] = { ...steps[nextIndex], status: "running" };
  }

  const allDone = steps.every((s) => s.status === "done");
  if (allDone) overallStatus = "completed";

  const [updated] = await db
    .update(playbooksTable)
    .set({ steps, overallStatus })
    .where(eq(playbooksTable.id, params.data.id))
    .returning();

  // Log approval
  await db.insert(auditLogTable).values({
    id: randomUUID(),
    actor: "analyst",
    actionType: "PLAYBOOK_STEP_APPROVED",
    description: `Approved playbook step: ${steps[stepIndex].action}`,
    relatedIncidentId: playbook.linkedIncidentId,
  });

  res.json(ApprovePlaybookStepResponse.parse(updated));
});

export default router;
