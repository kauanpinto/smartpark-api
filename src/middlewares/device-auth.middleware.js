import crypto from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "../errors/http-error.js";

export function deviceAuth(req, _res, next) {
  const token = req.header("x-device-secret") || "";
  const secret = env.DEVICE_SHARED_SECRET;

  if (!token) {
    return next(new HttpError(401, "Token de dispositivo não fornecido"));
  }

  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);

  if (
    tokenBuffer.length !== secretBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, secretBuffer)
  ) {
    return next(new HttpError(401, "Dispositivo não autorizado"));
  }

  next();
}
