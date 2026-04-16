import type { LeaderboardEntry, UserProfile, GameHistoryEntry, FriendEntry, FriendRequest } from '../../../shared/types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function authHeaders(token: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────

export async function apiRegister(username: string, password: string, email: string) {
  const res = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  return handleResponse<{ token: string; user: UserProfile }>(res);
}

export async function apiVerifyEmail(token: string) {
  const res = await fetch(`${BASE}/api/verify-email?token=${encodeURIComponent(token)}`);
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiResendVerification(token: string) {
  const res = await fetch(`${BASE}/api/resend-verification`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiForgotPassword(email: string) {
  const res = await fetch(`${BASE}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiResetPassword(token: string, password: string) {
  const res = await fetch(`${BASE}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<{ token: string; user: UserProfile }>(res);
}

export async function apiGetMe(token: string) {
  const res = await fetch(`${BASE}/api/me`, {
    headers: authHeaders(token),
  });
  return handleResponse<{ user: UserProfile }>(res);
}

// ── Leaderboard ───────────────────────────────────────────────────

export async function apiGetLeaderboard() {
  const res = await fetch(`${BASE}/api/leaderboard`, { headers: authHeaders(null) });
  return handleResponse<{ leaderboard: LeaderboardEntry[] }>(res);
}

export async function apiGetAllPlayers() {
  const res = await fetch(`${BASE}/api/players`, { headers: authHeaders(null) });
  return handleResponse<{ players: LeaderboardEntry[] }>(res);
}

// ── Profile ───────────────────────────────────────────────────────

export async function apiGetProfile(username: string) {
  const res = await fetch(`${BASE}/api/profile/${encodeURIComponent(username)}`, { headers: authHeaders(null) });
  return handleResponse<{ profile: UserProfile }>(res);
}

export async function apiUpdateProfile(token: string, country: string | null) {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ country }),
  });
  return handleResponse<{ user: UserProfile }>(res);
}

export async function apiGetHistory(username: string, page = 1) {
  const res = await fetch(`${BASE}/api/history/${encodeURIComponent(username)}?page=${page}`, { headers: authHeaders(null) });
  return handleResponse<{ history: GameHistoryEntry[]; total: number; page: number; pageSize: number }>(res);
}

export async function apiGetFriends(token: string) {
  const res = await fetch(`${BASE}/api/friends`, { headers: authHeaders(token) });
  return handleResponse<{ friends: FriendEntry[] }>(res);
}

export async function apiAddFriend(token: string, username: string) {
  const res = await fetch(`${BASE}/api/friends/${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiRemoveFriend(token: string, username: string) {
  const res = await fetch(`${BASE}/api/friends/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiCheckFriend(token: string, username: string) {
  const res = await fetch(`${BASE}/api/friends/check/${encodeURIComponent(username)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<{ isFriend: boolean; sentByMe: boolean; sentByThem: boolean }>(res);
}

export async function apiGetFriendRequests(token: string) {
  const res = await fetch(`${BASE}/api/friends/requests`, { headers: authHeaders(token) });
  return handleResponse<{ requests: FriendRequest[] }>(res);
}

export async function apiAcceptFriend(token: string, username: string) {
  const res = await fetch(`${BASE}/api/friends/accept/${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function apiDeclineFriend(token: string, username: string) {
  const res = await fetch(`${BASE}/api/friends/decline/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse<{ ok: boolean }>(res);
}
