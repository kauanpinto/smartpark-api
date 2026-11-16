import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { jsonError } from './middlewares/json-error.middleware.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(rateLimit({
  windowMs: 60_000,
  limit: 120,
  skip: (req) => req.path.startsWith('/webhooks/'),
}));
app.use(express.json({
  limit: '50kb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}));

app.use(routes);
app.use(notFound);
app.use(jsonError);

export default app;