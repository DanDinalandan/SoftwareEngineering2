import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { authRoutes } from './routes/authRoutes.js';
import { connectionRoutes } from './routes/connectionRoutes.js';
import { messageRoutes } from './routes/messageRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { providerRoutes } from './routes/providerRoutes.js';
import { rewardRoutes } from './routes/rewardRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientUrl === '*' ? true : config.clientUrl }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRoutes);
  app.use('/provider', providerRoutes);
  app.use(userRoutes);
  app.use(connectionRoutes);
  app.use(messageRoutes);
  app.use(notificationRoutes);
  app.use(rewardRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error.' });
  });

  return app;
}

