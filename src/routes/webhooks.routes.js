import { Router } from "express";
import { webhooksController } from "../controllers/webhooks.controller.js";

const webhooksRouter = Router();

webhooksRouter.post("/mercadopago", webhooksController.mercadopago);

export default webhooksRouter;
