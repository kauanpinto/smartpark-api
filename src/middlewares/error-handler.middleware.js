import { ZodError } from "zod";

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof Error && typeof err.status === "number") {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
}
