import { getAuth } from "firebase-admin/auth";
import { HttpError } from "../errors/http-error.js";

export async function firebaseAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token de autenticação não fornecido"));
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);

    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email ?? null,
    };

    next();
  } catch (error) {
    next(new HttpError(401, "Token inválido ou expirado"));
  }
}
