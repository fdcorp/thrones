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

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
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
});
