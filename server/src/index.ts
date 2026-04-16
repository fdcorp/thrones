import http from 'http';
import express from 'express';
import cors from 'cors';
import { PORT, CLIENT_ORIGIN } from './config';
import authRouter from './api/auth';
import gameRouter from './api/game';
import profileRouter from './api/profile';
import { setupWsServer } from './ws/wsServer';
import { getDb } from './db/database';

const app = express();

const allowedOrigins = CLIENT_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes
app.use('/api', authRouter);
app.use('/api', gameRouter);
app.use('/api', profileRouter);

// Init DB on startup
getDb();

const server = http.createServer(app);
setupWsServer(server);

server.listen(PORT, () => {
  console.log(`Thrones server running on http://localhost:${PORT}`);
  console.log(`[WS] Ranked/casual queues active — matchmaking v2`);
});
