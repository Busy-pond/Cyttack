import { Router, type IRouter } from "express";
import { db, campaignsTable } from "@workspace/db";
import { ListCampaignsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/campaigns", async (req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.matchConfidence);
  res.json(ListCampaignsResponse.parse(campaigns));
});

export default router;
