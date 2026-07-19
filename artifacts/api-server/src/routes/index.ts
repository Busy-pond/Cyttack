import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entitiesRouter from "./entities";
import alertsRouter from "./alerts";
import campaignsRouter from "./campaigns";
import playbooksRouter from "./playbooks";
import vulnerabilitiesRouter from "./vulnerabilities";
import auditLogRouter from "./auditLog";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";
import simulationRouter from "./simulation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(entitiesRouter);
router.use(alertsRouter);
router.use(campaignsRouter);
router.use(playbooksRouter);
router.use(vulnerabilitiesRouter);
router.use(auditLogRouter);
router.use(dashboardRouter);
router.use(chatRouter);
router.use(simulationRouter);

export default router;
