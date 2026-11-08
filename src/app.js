import helmet from "helmet";
import express from "express";
import { corsConfig } from "./config/cors.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(express.json());
app.use(corsConfig);
app.use(helmet());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
