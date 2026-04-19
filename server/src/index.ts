import http from 'http';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PORT, CLIENT_ORIGIN } from './config';
import authRouter from './api/auth';
import gameRouter from './api/game';
import profileRouter from './api/profile';
import { setupWsServer } from './ws/wsServer';
import { getDb } from './db/database';
import { purgeUnverifiedAccounts } from './db/queries';

const app = express();

const allowedOrigins = CLIENT_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins, credentials: true }));
app.use(express.json());

// Rate limiting on auth endpoints — prevents brute-force and account spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/contact', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many messages, try again later.' } }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// API routes
app.use('/api', authRouter);
app.use('/api', gameRouter);
app.use('/api', profileRouter);

// Contact form
import { sendContactEmail } from './email';
app.post('/api/contact', async (req, res) => {
  const { email, subject, message } = req.body as { email?: string; subject?: string; message?: string };
  if (!email || !subject || !message) { res.status(400).json({ error: 'All fields are required.' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'Invalid email address.' }); return; }
  if (subject.length > 120 || message.length > 2000) { res.status(400).json({ error: 'Content too long.' }); return; }
  try {
    await sendContactEmail(email.trim(), subject.trim(), message.trim());
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// Init DB on startup
getDb();

const server = http.createServer(app);
setupWsServer(server);

server.listen(PORT, () => {
  console.log(`Thrones server running on http://localhost:${PORT}`);
  console.log(`[WS] Ranked/casual queues active — matchmaking v2`);

  // Purge unverified accounts older than 24h — run on startup then every hour
  const runPurge = () => {
    const deleted = purgeUnverifiedAccounts();
    if (deleted > 0) console.log(`[purge] Deleted ${deleted} unverified account(s)`);
  };
  runPurge();
  setInterval(runPurge, 60 * 60 * 1000); // every hour
});
