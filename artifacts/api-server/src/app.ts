import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Allow the frontend origin to call the API.
// FRONTEND_ORIGIN can be set to the deployed frontend URL (e.g. https://cyttack.vercel.app).
// When unset, `origin: true` reflects the request origin, permitting all — fine for dev
// and for Replit where both services share the same domain via the shared proxy.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, message: err?.message, cause: err?.cause, code: err?.code }, "Unhandled error");
  res.status(500).json({ error: err?.message ?? "Internal server error", code: err?.code ?? null });
});

export default app;
