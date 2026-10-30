import "dotenv/config.js";
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;