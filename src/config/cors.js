import cors from "cors";

export const corsConfig = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5500",
  credentials: true,
});
