import { Router, type IRouter } from "express";
import { db, entitiesTable } from "@workspace/db";
import { ListEntitiesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/entities", async (req, res): Promise<void> => {
  const entities = await db.select().from(entitiesTable).orderBy(entitiesTable.criticality);
  res.json(ListEntitiesResponse.parse(entities));
});

export default router;
