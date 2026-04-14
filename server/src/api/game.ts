import { Router } from 'express';
import { getLeaderboard } from '../db/queries';

const router = Router();

// GET /api/leaderboard
router.get('/leaderboard', (_req, res) => {
  try {
    const entries = getLeaderboard(50);
    res.json({ leaderboard: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
