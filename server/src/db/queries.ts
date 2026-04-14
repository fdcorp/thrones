// Uses node:sqlite (built-in Node 22.5+)
import { getDb } from './database';
import type { LeaderboardEntry, UserProfile, GameHistoryEntry, FriendEntry } from '../../../shared/types';
import { RankedSystem, type PlayerRank, type PlayerRankDbRow } from '../../../shared/ranked';

// ── Internal DB type ──────────────────────────────────────────────

export interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  elo: number;
  games_played: number;
  games_won: number;
  country: string | null;
  last_login: string | null;
  created_at: string;
  // Glicko-2 ranked fields
  hidden_mmr: number;
  rating_deviation: number;
  volatility: number;
  visible_tier: string;
  visible_division: string | null;
  league_points: number;
  season_number: number;
  provisional_games_left: number;
  total_ranked_games_played: number;
  in_promotion_series: 0 | 1;
  promotion_wins: number;
  promotion_losses: number;
}

export function toUserProfile(u: DbUser): UserProfile {
  const playerRank = dbUserToPlayerRank(u);
  const visibleRank = _rankedSystem.getVisibleRank(playerRank);
  return {
    id:          u.id,
    username:    u.username,
    elo:         u.elo,
    gamesPlayed: u.games_played,
    gamesWon:    u.games_won,
    country:     u.country ?? undefined,
    lastLogin:   u.last_login ?? undefined,
    createdAt:   u.created_at,
    rank: {
      tier:                   visibleRank.tier,
      division:               visibleRank.division,
      leaguePoints:           visibleRank.league_points,
      display:                visibleRank.display,
      isProvisional:          visibleRank.is_provisional,
      isInPlacement:          visibleRank.is_in_placement,
      provisionalGamesLeft:   playerRank.provisional_games_left,
      totalRankedGamesPlayed: playerRank.total_ranked_games_played,
      inPromotionSeries:      visibleRank.in_promotion_series,
      promotionWins:          visibleRank.promotion_wins,
      promotionLosses:        visibleRank.promotion_losses,
    },
  };
}

// ── User queries ──────────────────────────────────────────────────

export function createUser(username: string, passwordHash: string): number {
  const db   = getDb();
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const res  = stmt.run(username, passwordHash) as { lastInsertRowid: number };
  return res.lastInsertRowid;
}

export function getUserByUsername(username: string): DbUser | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
}

export function getUserById(id: number): DbUser | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}

export function updateElo(userId: number, newElo: number, won: boolean) {
  const db = getDb();
  db.prepare(
    'UPDATE users SET elo = ?, games_played = games_played + 1, games_won = games_won + ? WHERE id = ?'
  ).run(newElo, won ? 1 : 0, userId);
}

// ── Ranked queries ────────────────────────────────────────────────

const _rankedSystem = new RankedSystem(1);

/** Extract a PlayerRank from a DbUser row. */
export function dbUserToPlayerRank(u: DbUser): PlayerRank {
  return _rankedSystem.fromDbRow({
    hidden_mmr:                u.hidden_mmr,
    rating_deviation:          u.rating_deviation,
    volatility:                u.volatility,
    visible_tier:              u.visible_tier,
    visible_division:          u.visible_division,
    league_points:             u.league_points,
    season_number:             u.season_number,
    provisional_games_left:    u.provisional_games_left,
    total_ranked_games_played: u.total_ranked_games_played,
    in_promotion_series:       u.in_promotion_series,
    promotion_wins:            u.promotion_wins,
    promotion_losses:          u.promotion_losses,
  });
}

/** Persist updated PlayerRank fields to the users table. */
export function updateRankedFields(userId: number, rank: PlayerRank, won: boolean) {
  const db  = getDb();
  const row = _rankedSystem.toDbRow(rank);
  db.prepare(`
    UPDATE users SET
      hidden_mmr                 = ?,
      rating_deviation           = ?,
      volatility                 = ?,
      visible_tier               = ?,
      visible_division           = ?,
      league_points              = ?,
      season_number              = ?,
      provisional_games_left     = ?,
      total_ranked_games_played  = ?,
      in_promotion_series        = ?,
      promotion_wins             = ?,
      promotion_losses           = ?,
      games_played               = games_played + 1,
      games_won                  = games_won + ?
    WHERE id = ?
  `).run(
    row.hidden_mmr,
    row.rating_deviation,
    row.volatility,
    row.visible_tier,
    row.visible_division,
    row.league_points,
    row.season_number,
    row.provisional_games_left,
    row.total_ranked_games_played,
    row.in_promotion_series,
    row.promotion_wins,
    row.promotion_losses,
    won ? 1 : 0,
    userId,
  );
}

/** Initialize ranked fields for a newly registered user. */
export function initRankedForUser(userId: number) {
  const rank = _rankedSystem.initializeNewPlayer();
  const row  = _rankedSystem.toDbRow(rank);
  getDb().prepare(`
    UPDATE users SET
      hidden_mmr = ?, rating_deviation = ?, volatility = ?,
      visible_tier = ?, visible_division = ?, league_points = ?,
      season_number = ?, provisional_games_left = ?,
      total_ranked_games_played = ?, in_promotion_series = ?,
      promotion_wins = ?, promotion_losses = ?
    WHERE id = ?
  `).run(
    row.hidden_mmr, row.rating_deviation, row.volatility,
    row.visible_tier, row.visible_division, row.league_points,
    row.season_number, row.provisional_games_left,
    row.total_ranked_games_played, row.in_promotion_series,
    row.promotion_wins, row.promotion_losses,
    userId,
  );
}

// ── Game queries ──────────────────────────────────────────────────

export function saveGame(
  player1Id:   number,
  player2Id:   number,
  winnerId:    number | null,
  eloChangeP1: number,
  eloChangeP2: number,
  turns:       number,
  gameMode:    'local' | 'ai' | 'online_casual' | 'online_ranked' = 'online_casual',
  mmrChangeP1: number | null = null,
  mmrChangeP2: number | null = null,
  lpChangeP1:  number | null = null,
  lpChangeP2:  number | null = null,
): number {
  const db  = getDb();
  const res = db.prepare(`
    INSERT INTO games
      (player1_id, player2_id, winner_id, elo_change_p1, elo_change_p2,
       turns, game_mode, mmr_change_p1, mmr_change_p2, lp_change_p1, lp_change_p2, ended_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    player1Id, player2Id, winnerId, eloChangeP1, eloChangeP2,
    turns, gameMode, mmrChangeP1, mmrChangeP2, lpChangeP1, lpChangeP2,
  ) as { lastInsertRowid: number };
  return res.lastInsertRowid;
}

// ── Profile mutations ─────────────────────────────────────────────

export function updateLastLogin(userId: number) {
  getDb().prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
}

export function updateCountry(userId: number, country: string | null) {
  getDb().prepare('UPDATE users SET country = ? WHERE id = ?').run(country, userId);
}

// ── Game history ──────────────────────────────────────────────────

export function getGameHistory(userId: number, limit = 20): GameHistoryEntry[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      g.id,
      g.turns,
      g.game_mode,
      g.created_at,
      g.winner_id,
      CASE WHEN g.player1_id = $uid THEN g.elo_change_p1 ELSE g.elo_change_p2 END AS elo_change_me,
      CASE WHEN g.player1_id = $uid THEN u2.username ELSE u1.username END AS opponent_username
    FROM games g
    LEFT JOIN users u1 ON g.player1_id = u1.id
    LEFT JOIN users u2 ON g.player2_id = u2.id
    WHERE g.player1_id = $uid OR g.player2_id = $uid
    ORDER BY g.created_at DESC
    LIMIT $limit
  `).all({ uid: userId, limit }) as {
    id: number;
    turns: number;
    game_mode: string;
    created_at: string;
    winner_id: number | null;
    elo_change_me: number;
    opponent_username: string | null;
  }[];

  return rows.map(r => ({
    id:               r.id,
    opponentUsername: r.opponent_username,
    winnerId:         r.winner_id,
    eloChangeMe:      r.elo_change_me,
    turns:            r.turns,
    gameMode:         r.game_mode,
    createdAt:        r.created_at,
  }));
}

// ── Friends ───────────────────────────────────────────────────────

export function addFriend(userId: number, friendId: number) {
  getDb().prepare(
    'INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)'
  ).run(userId, friendId);
}

export function removeFriend(userId: number, friendId: number) {
  getDb().prepare(
    'DELETE FROM friends WHERE user_id = ? AND friend_id = ?'
  ).run(userId, friendId);
}

export function areFriends(userId: number, friendId: number): boolean {
  const row = getDb().prepare(
    'SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?'
  ).get(userId, friendId);
  return !!row;
}

export function getFriends(userId: number): FriendEntry[] {
  const rows = getDb().prepare(`
    SELECT u.id, u.username, u.elo, u.country
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
    ORDER BY u.username ASC
  `).all(userId) as { id: number; username: string; elo: number; country: string | null }[];

  return rows.map(r => ({
    id:      r.id,
    username:r.username,
    elo:     r.elo,
    country: r.country ?? undefined,
  }));
}

// ── Leaderboard ───────────────────────────────────────────────────

export function getLeaderboard(limit = 50): LeaderboardEntry[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, username, elo, games_played, games_won
    FROM users
    ORDER BY elo DESC
    LIMIT ?
  `).all(limit) as { id: number; username: string; elo: number; games_played: number; games_won: number }[];

  return rows.map((row, i) => ({
    rank:        i + 1,
    id:          row.id,
    username:    row.username,
    elo:         row.elo,
    gamesWon:    row.games_won,
    gamesPlayed: row.games_played,
    winRate:     row.games_played > 0
      ? Math.round((row.games_won / row.games_played) * 100)
      : 0,
  }));
}
