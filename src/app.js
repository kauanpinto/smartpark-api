import helmet from "helmet";
import express from "express";
import { corsConfig } from "./config/cors.js";
import parkingLotsRouter from "./routes/parking-lots.routes.js";
import reservationsRouter from "./routes/reservations.routes.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";

const app = express();

app.use(express.json());
app.use(corsConfig);
app.use(helmet());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", parkingLotsRouter);
app.use("/api", reservationsRouter);

app.use(errorHandler);

export default app;
