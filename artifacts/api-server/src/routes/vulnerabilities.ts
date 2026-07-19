import { Router, type IRouter } from "express";
import { db, vulnerabilitiesTable } from "@workspace/db";
import { ListVulnerabilitiesResponse } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/vulnerabilities", async (req, res): Promise<void> => {
  const vulnerabilities = await db
    .select()
    .from(vulnerabilitiesTable)
    .orderBy(desc(vulnerabilitiesTable.cvssScore));
  res.json(ListVulnerabilitiesResponse.parse(vulnerabilities));
});

export default router;
