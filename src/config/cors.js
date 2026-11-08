import { env } from "./env.js";
import cors from "cors";

export const corsConfig = cors({
  origin: env.APP_BASE_URL || "http://localhost:5500",
  credentials: true,
});
