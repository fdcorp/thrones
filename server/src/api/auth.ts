import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../config';
import {
  createUser, getUserByUsername, getUserByEmail, toUserProfile, updateLastLogin,
  verifyEmailToken, setPasswordResetToken, getUserByResetToken, resetPassword,
} from '../db/queries';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../email';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/register
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body as { username?: string; password?: string; email?: string };

  if (!username || !password || !email) {
    res.status(400).json({ error: 'Username, email and password required' });
    return;
  }
  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: 'Username must be 2–20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: 'Username: letters, numbers, _ and - only' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    if (getUserByUsername(username)) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    if (getUserByEmail(email)) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const hash        = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const id          = createUser(username, hash, email, verifyToken);

    // Send verification email (non-blocking)
    sendVerificationEmail(email, username, verifyToken).catch(console.error);

    const token   = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
    const newUser = getUserByUsername(username)!;
    res.status(201).json({ token, user: toUserProfile(newUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const user = getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    updateLastLogin(user.id);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: toUserProfile(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = getUserByUsername(req.username!);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user: toUserProfile(user) });
});

// GET /api/verify-email?token=xxx
router.get('/verify-email', (req, res) => {
  const { token } = req.query as { token?: string };
  if (!token) { res.status(400).json({ error: 'Token required' }); return; }
  const ok = verifyEmailToken(token);
  if (!ok) { res.status(400).json({ error: 'Invalid or expired token' }); return; }
  res.json({ ok: true });
});

// POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  // Always return 200 to avoid email enumeration
  res.json({ ok: true });
  if (!email) return;
  try {
    const user = getUserByEmail(email);
    if (!user) return;
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    setPasswordResetToken(user.id, token, expires);
    await sendPasswordResetEmail(user.email!, user.username, token);
  } catch (err) {
    console.error('[forgot-password]', err);
  }
});

// POST /api/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) { res.status(400).json({ error: 'Token and password required' }); return; }
  if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  try {
    const user = getUserByResetToken(token);
    if (!user) { res.status(400).json({ error: 'Invalid or expired reset link' }); return; }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    resetPassword(user.id, hash);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
