import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { createUser, getUserByUsername, toUserProfile, updateLastLogin } from '../db/queries';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
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

  try {
    const existing = getUserByUsername(username);
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const id   = createUser(username, hash);
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
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

export default router;
