import "dotenv/config.js";
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { corsConfig } from './config/cors.js';

const app = express();

app.use(express.json());
app.use(cors(corsConfig));
app.use(helmet());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;