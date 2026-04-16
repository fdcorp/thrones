// Shared types between client and server

export enum Player {
  P1 = 'P1',
  P2 = 'P2',
}

// ── User ──────────────────────────────────────────────────────────
export interface UserProfile {
  id: number;
  username: string;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  emailVerified: boolean;
  country?: string;
  lastLogin?: string;
  createdAt?: string;
  // Ranked system fields — populated by getVisibleRank() on the server
  rank: {
    /** Visible tier string: "PEASANT" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "KING" */
    tier: string;
    /** Visible division: "V" | "IV" | "III" | "II" | "I" | null (null for MASTER/KING/PEASANT) */
    division: string | null;
    /** LP within the current division (0–99, or raw points for MASTER/KING) */
    leaguePoints: number;
    /** Human-readable string: "Gold II", "Master", "Peasant" */
    display: string;
    /** True during the first 20 ranked games — show anti-smurf badge */
    isProvisional: boolean;
    /** True during the first 10 ranked games — show "Placement X/10" badge */
    isInPlacement: boolean;
    provisionalGamesLeft: number;
    totalRankedGamesPlayed: number;
    inPromotionSeries: boolean;
    promotionWins: number;
    promotionLosses: number;
  };
}

export interface GameHistoryEntry {
  id: number;
  opponentUsername: string | null;
  winnerId: number | null;
  eloChangeMe: number;
  turns: number;
  gameMode: string;
  createdAt: string;
  rankedGamesNewer?: number;
}

export interface FriendEntry {
  id: number;
  username: string;
  elo: number;
  country?: string;
}

export interface FriendRequest {
  id: number;
  username: string;
  elo: number;
  country?: string;
  createdAt: string;
}

// ── Room ──────────────────────────────────────────────────────────
export interface RoomInfo {
  code: string;
  hostUsername: string;
  status: 'waiting' | 'playing' | 'finished';
}

// ── WebSocket messages (client → server) ─────────────────────────
export type ClientMessage =
  | { type: 'CREATE_ROOM'; preferredSlot?: Player }
  | { type: 'JOIN_ROOM'; roomCode: string }
  | { type: 'ACTION'; action: unknown }   // TurnAction — typed on each side
  | { type: 'SURRENDER' }
  | { type: 'MATCHMAKING_JOIN'; ranked: boolean }
  | { type: 'MATCHMAKING_LEAVE' }
  | { type: 'PING' };

// ── WebSocket messages (server → client) ─────────────────────────
export type ServerMessage =
  | { type: 'ROOM_JOINED';          roomCode: string; playerSlot: Player; opponentUsername?: string; opponentElo?: number; opponentInPlacement?: boolean; ranked?: boolean }
  | { type: 'OPPONENT_JOINED';      opponentUsername: string }
  | { type: 'GAME_STATE';           state: unknown }  // GameState — typed on each side
  | { type: 'GAME_OVER';            winner: Player | null; isDraw: boolean; eloChangeMe: number; eloChangeOpp: number; newEloMe: number }
  | { type: 'PLAYER_DISCONNECTED' }
  | { type: 'ERROR';                message: string }
  | { type: 'PONG' };

// ── Leaderboard entry ─────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  elo: number;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  isInPlacement: boolean;
  country?: string;
}
