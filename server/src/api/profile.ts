import { Router } from 'express';
import {
  getUserByUsername,
  getUserById,
  updateCountry,
  getGameHistory,
  getGameHistoryCount,
  getFriends,
  removeFriend,
  areFriends,
  toUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  hasPendingRequest,
  getIncomingRequests,
} from '../db/queries';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profile/:username — public profile
router.get('/profile/:username', (req, res) => {
  const user = getUserByUsername(req.params.username);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ profile: toUserProfile(user) });
});

// PUT /api/profile — update own country (auth required)
router.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const { country } = req.body as { country?: string };
  // Validate: null/empty string clears, otherwise 2-letter ISO code
  if (country !== undefined && country !== null && country !== '') {
    if (!/^[A-Z]{2}$/.test(country.toUpperCase())) {
      res.status(400).json({ error: 'Country must be a 2-letter ISO code (e.g. FR)' });
      return;
    }
  }
  const normalized = country ? country.toUpperCase() : null;
  updateCountry(req.userId!, normalized);
  const user = getUserById(req.userId!);
  res.json({ user: user ? toUserProfile(user) : null });
});

const HISTORY_PAGE_SIZE = 15;

// GET /api/history — own match history (auth required)
router.get('/history', requireAuth, (req: AuthRequest, res) => {
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const offset = (page - 1) * HISTORY_PAGE_SIZE;
  const total  = getGameHistoryCount(req.userId!);
  const history = getGameHistory(req.userId!, HISTORY_PAGE_SIZE, offset);
  res.json({ history, total, page, pageSize: HISTORY_PAGE_SIZE });
});

// GET /api/history/:username — public match history
router.get('/history/:username', (req, res) => {
  const user = getUserByUsername(req.params.username);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const page   = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const offset = (page - 1) * HISTORY_PAGE_SIZE;
  const total  = getGameHistoryCount(user.id);
  const history = getGameHistory(user.id, HISTORY_PAGE_SIZE, offset);
  res.json({ history, total, page, pageSize: HISTORY_PAGE_SIZE });
});

// GET /api/friends — own friends list (auth required)
router.get('/friends', requireAuth, (req: AuthRequest, res) => {
  const friends = getFriends(req.userId!);
  res.json({ friends });
});

// GET /api/friends/requests — incoming friend requests (auth required)
router.get('/friends/requests', requireAuth, (req: AuthRequest, res) => {
  const requests = getIncomingRequests(req.userId!);
  res.json({ requests });
});

// GET /api/friends/check/:username — check friend/request status (auth required)
// Must be declared BEFORE /friends/:username to avoid shadowing
router.get('/friends/check/:username', requireAuth, (req: AuthRequest, res) => {
  const target = getUserByUsername(req.params.username);
  if (!target) { res.json({ isFriend: false, sentByMe: false, sentByThem: false }); return; }
  res.json({
    isFriend:   areFriends(req.userId!, target.id),
    sentByMe:   hasPendingRequest(req.userId!, target.id),
    sentByThem: hasPendingRequest(target.id, req.userId!),
  });
});

// POST /api/friends/:username — send friend request (auth required)
router.post('/friends/:username', requireAuth, (req: AuthRequest, res) => {
  const target = getUserByUsername(req.params.username);
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  if (target.id === req.userId) { res.status(400).json({ error: 'Cannot add yourself' }); return; }
  if (areFriends(req.userId!, target.id)) { res.status(400).json({ error: 'Already friends' }); return; }
  // If they already sent us a request → auto-accept
  if (hasPendingRequest(target.id, req.userId!)) {
    acceptFriendRequest(target.id, req.userId!);
    res.json({ ok: true, accepted: true });
    return;
  }
  sendFriendRequest(req.userId!, target.id);
  res.json({ ok: true, accepted: false });
});

// POST /api/friends/accept/:username — accept incoming request (auth required)
router.post('/friends/accept/:username', requireAuth, (req: AuthRequest, res) => {
  const target = getUserByUsername(req.params.username);
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  if (!hasPendingRequest(target.id, req.userId!)) {
    res.status(400).json({ error: 'No pending request from this user' }); return;
  }
  acceptFriendRequest(target.id, req.userId!);
  res.json({ ok: true });
});

// DELETE /api/friends/decline/:username — decline or cancel a request (auth required)
router.delete('/friends/decline/:username', requireAuth, (req: AuthRequest, res) => {
  const target = getUserByUsername(req.params.username);
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  // Decline incoming: target sent to me
  declineFriendRequest(target.id, req.userId!);
  // Cancel outgoing: I sent to target
  cancelFriendRequest(req.userId!, target.id);
  res.json({ ok: true });
});

// DELETE /api/friends/:username — remove friend (auth required)
router.delete('/friends/:username', requireAuth, (req: AuthRequest, res) => {
  const target = getUserByUsername(req.params.username);
  if (!target) { res.status(404).json({ error: 'User not found' }); return; }
  removeFriend(req.userId!, target.id);
  removeFriend(target.id, req.userId!);
  res.json({ ok: true });
});

export default router;
