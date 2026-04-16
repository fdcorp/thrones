CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  elo           INTEGER DEFAULT 1200,
  games_played  INTEGER DEFAULT 0,
  games_won     INTEGER DEFAULT 0,
  country       TEXT,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ── Glicko-2 hidden MMR (authoritative for matchmaking) ──────────
  hidden_mmr                 REAL    NOT NULL DEFAULT 1500,
  rating_deviation           REAL    NOT NULL DEFAULT 350,
  volatility                 REAL    NOT NULL DEFAULT 0.06,

  -- ── Visible ranked display (shown to player) ─────────────────────
  -- visible_tier: PEASANT | BRONZE | SILVER | GOLD | PLATINUM | DIAMOND | MASTER | KING
  visible_tier               TEXT    NOT NULL DEFAULT 'PEASANT',
  -- visible_division: V | IV | III | II | I | NULL (null for MASTER/KING/PEASANT)
  visible_division           TEXT,
  league_points              INTEGER NOT NULL DEFAULT 0,

  -- ── Season & placement tracking ───────────────────────────────────
  season_number              INTEGER NOT NULL DEFAULT 1,
  provisional_games_left     INTEGER NOT NULL DEFAULT 10,
  total_ranked_games_played  INTEGER NOT NULL DEFAULT 0,

  -- ── Promotion series state ────────────────────────────────────────
  in_promotion_series        INTEGER NOT NULL DEFAULT 0,  -- 0|1 boolean
  promotion_wins             INTEGER NOT NULL DEFAULT 0,
  promotion_losses           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id    INTEGER REFERENCES users(id),
  player2_id    INTEGER REFERENCES users(id),
  winner_id     INTEGER REFERENCES users(id),
  elo_change_p1 INTEGER,
  elo_change_p2 INTEGER,
  turns         INTEGER,
  -- game_mode: 'local' | 'ai' | 'online_casual' | 'online_ranked'
  game_mode     TEXT DEFAULT 'online_casual',

  -- ── Ranked-specific fields (NULL for non-ranked games) ────────────
  mmr_change_p1 REAL,     -- Glicko-2 MMR delta for player 1
  mmr_change_p2 REAL,     -- Glicko-2 MMR delta for player 2
  lp_change_p1  INTEGER,  -- LP delta for player 1 (positive = gain)
  lp_change_p2  INTEGER,  -- LP delta for player 2

  ended_at      DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
  user_id    INTEGER NOT NULL REFERENCES users(id),
  friend_id  INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  from_id    INTEGER NOT NULL REFERENCES users(id),
  to_id      INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (from_id, to_id)
);
